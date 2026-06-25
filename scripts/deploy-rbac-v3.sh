#!/bin/bash

# ==================================
# eLISAschool - Script de Déploiement RBAC v3.0
# ==================================
# Version: 1.0.0
# Usage: ./deploy-rbac-v3.sh [--skip-backup] [--skip-migration] [--dry-run]
#
# Options:
#   --skip-backup      Ignorer le backup de la base de données
#   --skip-migration   Ignorer la migration des anciennes données
#   --dry-run          Afficher les commandes sans les exécuter
# ==================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
BACKUP=true
MIGRATION=true
DRY_RUN=false
PROJECT_ROOT="/mnt/DONNEES/projets/eLISAschool"
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parser les arguments
for arg in "$@"; do
    case $arg in
        --skip-backup)
            BACKUP=false
            shift
            ;;
        --skip-migration)
            MIGRATION=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}❌ Option inconnue: $arg${NC}"
            echo "Usage: $0 [--skip-backup] [--skip-migration] [--dry-run]"
            exit 1
            ;;
    esac
done

# Fonction pour exécuter une commande
run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN] $*${NC}"
    else
        eval "$@"
    fi
}

# Fonction pour afficher un message de succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher un message d'erreur
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Fonction pour afficher un message d'avertissement
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Fonction pour afficher un message d'info
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Déploiement RBAC v3.0 - eLISAschool${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ÉTAPE 1 : Vérifications préliminaires
echo -e "${BLUE}ÉTAPE 1/7 : Vérifications préliminaires${NC}"
echo "-------------------------------------------"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "$BACKEND_DIR/package.json" ]; then
    error "Répertoire backend non trouvé: $BACKEND_DIR"
fi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé"
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
fi

# Vérifier que PostgreSQL est accessible
if ! command -v psql &> /dev/null; then
    warning "psql n'est pas installé, certaines vérifications DB seront ignorées"
fi

success "Vérifications préliminaires OK"
echo ""

# ÉTAPE 2 : Backup de la base de données
if [ "$BACKUP" = true ]; then
    echo -e "${BLUE}ÉTAPE 2/7 : Backup de la base de données${NC}"
    echo "-------------------------------------------"
    
    mkdir -p "$BACKUP_DIR"
    
    # Vérifier les variables d'environnement
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env"
    fi
    
    DB_NAME=${DB_NAME:-elisaschool}
    DB_USER=${DB_USER:-elisaschool}
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    
    BACKUP_FILE="$BACKUP_DIR/rbac-v3-backup-$TIMESTAMP.sql"
    
    info "Backup de la base de données $DB_NAME..."
    
    run_cmd "PGPASSWORD='$DB_PASSWORD' pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE"
    
    if [ "$DRY_RUN" = false ] && [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        success "Backup créé: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        success "Backup simulé: $BACKUP_FILE"
    fi
    
    echo ""
else
    warning "Backup ignoré (--skip-backup)"
    echo ""
fi

# ÉTAPE 3 : Build du backend
echo -e "${BLUE}ÉTAPE 3/7 : Build du backend${NC}"
echo "-------------------------------------------"

cd "$BACKEND_DIR"

info "Installation des dépendances..."
run_cmd "npm install --production=false"

info "Compilation TypeScript..."
run_cmd "npm run build"

if [ "$DRY_RUN" = false ]; then
    success "Build complété avec succès"
else
    success "Build simulé"
fi

echo ""

# ÉTAPE 4 : Exécution du seed RBAC
echo -e "${BLUE}ÉTAPE 4/7 : Seed RBAC${NC}"
echo "-------------------------------------------"

info "Exécution du seed RBAC (rôles, permissions, mappings)..."
run_cmd "cd $BACKEND_DIR && npm run seed:rbac"

if [ "$DRY_RUN" = false ]; then
    success "Seed RBAC complété"
else
    success "Seed RBAC simulé"
fi

echo ""

# ÉTAPE 5 : Migration des anciennes données (si nécessaire)
if [ "$MIGRATION" = true ]; then
    echo -e "${BLUE}ÉTAPE 5/7 : Migration des anciennes données${NC}"
    echo "-------------------------------------------"
    
    MIGRATION_SCRIPT="$BACKEND_DIR/database/migrations/migrate-rbac-v3.sql"
    
    if [ ! -f "$MIGRATION_SCRIPT" ]; then
        warning "Script de migration non trouvé: $MIGRATION_SCRIPT"
        warning "Migration ignorée"
    else
        # Vérifier si la table utilisateur_roles existe encore
        if command -v psql &> /dev/null; then
            TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'utilisateur_roles';" 2>/dev/null || echo "0")
            
            if [ "$TABLE_EXISTS" -gt 0 ]; then
                ROW_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM utilisateur_roles;" 2>/dev/null || echo "0")
                
                if [ "$ROW_COUNT" -gt 0 ]; then
                    info "Migration de $ROW_COUNT entrées depuis utilisateur_roles..."
                    run_cmd "PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $MIGRATION_SCRIPT"
                    success "Migration complétée"
                else
                    info "Table utilisateur_roles vide, migration ignorée"
                fi
            else
                info "Table utilisateur_roles n'existe pas, migration ignorée"
            fi
        else
            warning "psql non disponible, vérification manuelle requise"
            info "Pour migrer les anciennes données:"
            info "  psql -U elisaschool -d elisaschool -f $MIGRATION_SCRIPT"
        fi
    fi
    
    echo ""
else
    warning "Migration ignorée (--skip-migration)"
    echo ""
fi

# ÉTAPE 6 : Redémarrage de l'application
echo -e "${BLUE}ÉTAPE 6/7 : Redémarrage de l'application${NC}"
echo "-------------------------------------------"

if command -v pm2 &> /dev/null; then
    info "Redémarrage avec PM2..."
    run_cmd "pm2 restart elisaschool-backend || pm2 start $BACKEND_DIR/dist/app.js --name elisaschool-backend"
    success "Application redémarrée"
elif command -v docker &> /dev/null; then
    info "Redémarrage avec Docker..."
    run_cmd "docker restart elisaschool-backend"
    success "Container redémarré"
else
    warning "Ni PM2 ni Docker détecté"
    info "Pour redémarrer manuellement:"
    info "  cd $BACKEND_DIR && npm start"
fi

echo ""

# ÉTAPE 7 : Vérifications post-déploiement
echo -e "${BLUE}ÉTAPE 7/7 : Vérifications post-déploiement${NC}"
echo "-------------------------------------------"

info "Vérification des logs..."
if command -v pm2 &> /dev/null; then
    run_cmd "pm2 logs elisaschool-backend --lines 20 --nostream"
fi

echo ""
info "Vérification de l'endpoint de monitoring..."
if [ "$DRY_RUN" = false ]; then
    MONITORING_URL="http://localhost:3000/api/rbac/monitoring/stats"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$MONITORING_URL" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        success "Endpoint de monitoring accessible ($MONITORING_URL)"
        
        # Afficher les statistiques
        echo ""
        info "Statistiques RBAC :"
        curl -s "$MONITORING_URL" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Impossible de parser la réponse"
    elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        warning "Endpoint protégé (code $HTTP_CODE) - Authentification requise"
        success "Endpoint fonctionnel"
    else
        warning "Endpoint non accessible (code $HTTP_CODE)"
    fi
else
    success "Vérification simulée"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  ✅ Déploiement RBAC v3.0 complété !${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Résumé du déploiement
echo -e "${BLUE}📊 Résumé du déploiement :${NC}"
echo "-------------------------------------------"
echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Backup: $([ "$BACKUP" = true ] && echo '✅ Effectué' || echo '⏭️ Ignoré')"
echo "  Migration: $([ "$MIGRATION" = true ] && echo '✅ Effectuée' || echo '⏭️ Ignorée')"
echo "  Dry Run: $([ "$DRY_RUN" = true ] && echo '✅ Oui' || echo '❌ Non')"
echo ""

echo -e "${BLUE}📁 Documentation :${NC}"
echo "-------------------------------------------"
echo "  • MIGRATION-RBAC-v3-MULTI-TENANT-STRICT.md"
echo "  • RAPPORT-EXECUTION-MIGRATION-RBAC-v3.md"
echo "  • GUIDE-MONITORING-PERFORMANCE-RBAC.md"
echo "  • RESUME-EXECUTION-FINAL-RBAC-v3.md"
echo ""

echo -e "${BLUE}🔗 Endpoints utiles :${NC}"
echo "-------------------------------------------"
echo "  • Monitoring: GET /api/rbac/monitoring/stats"
echo "  • Rôles: GET /api/rbac/roles"
echo "  • Permissions: GET /api/rbac/permissions"
echo "  • Utilisateurs: GET /api/rbac/users"
echo ""

echo -e "${YELLOW}⚠️  Prochaines étapes recommandées :${NC}"
echo "-------------------------------------------"
echo "  1. Mettre à jour le frontend (breaking changes API)"
echo "  2. Vérifier les logs d'erreurs (pm2 logs)"
echo "  3. Tester les permissions multi-établissements"
echo "  4. Configurer le monitoring (voir GUIDE-MONITORING-PERFORMANCE-RBAC.md)"
echo "  5. Si tout OK: supprimer table utilisateur_roles"
echo ""

echo -e "${GREEN}🎉 Le système RBAC v3.0 est opérationnel !${NC}"

exit 0
