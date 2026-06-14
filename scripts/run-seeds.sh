#!/bin/bash
# ==================================
# eLISAschool - Script d'exécution des seeds
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Exécute les seeds de manière organisée et cohérente
# Usage: npm run seed:all ou ./scripts/run-seeds.sh

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Charger les variables d'environnement
cd "$(dirname "$0")/.."
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${BLUE}✓ Variables d'environnement chargées${NC}"
else
    echo -e "${RED}✗ Fichier .env non trouvé${NC}"
    exit 1
fi

# Fonction pour vérifier la connexion PostgreSQL
check_database() {
    echo -e "${BLUE}🔍 Vérification de la connexion PostgreSQL...${NC}"
    
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}⚠ psql non installé, skip la vérification${NC}"
        return 0
    fi
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✓ Connexion PostgreSQL OK${NC}"
    else
        echo -e "${RED}✗ Impossible de se connecter à PostgreSQL${NC}"
        echo -e "${YELLOW}Vérifiez que Docker est lancé: docker-compose up -d${NC}"
        exit 1
    fi
}

# Fonction pour exécuter les migrations
run_migrations() {
    echo -e "${BLUE}📦 Exécution des migrations TypeORM...${NC}"
    npm run typeorm:migration:run || {
        echo -e "${RED}✗ Échec des migrations${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Migrations exécutées${NC}"
}

# Fonction pour exécuter les seeds
run_seeds() {
    echo -e "${BLUE}🌱 Exécution des seeds...${NC}"
    echo ""
    
    # Les seeds sont exécutés dans l'ordre défini dans initial.seed.ts:
    # 1. Établissement par défaut
    # 2. Configuration (modules, paramètres)
    # 3. RBAC (rôles, permissions)
    # 4. Structure académique
    # 5. Super admin
    # 6. Utilisateurs par rôle
    
    npm run seed || {
        echo -e "${RED}✗ Échec des seeds${NC}"
        exit 1
    }
    
    echo ""
    echo -e "${GREEN}✓ Seeds exécutés avec succès${NC}"
}

# Fonction pour afficher le récapitulatif
show_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   SEEDS EXÉCUTÉS AVEC SUCCÈS! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📊 Récapitulatif:${NC}"
    echo -e "  • 1 établissement par défaut (ETAB-001)"
    echo -e "  • Configuration des modules et paramètres"
    echo -e "  • 38 rôles système avec permissions"
    echo -e "  • Structure académique complète"
    echo -e "  • 1 super admin"
    echo -e "  • 38 utilisateurs de test (1 par rôle)"
    echo ""
    echo -e "${BLUE}🔐 Identifiants de connexion:${NC}"
    echo -e "  ${YELLOW}Super Admin:${NC}"
    echo -e "    Email: admin@elisaschool.cm"
    echo -e "    Mot de passe: AdminSecret123!"
    echo ""
    echo -e "  ${YELLOW}Utilisateurs de test:${NC}"
    echo -e "    Mot de passe: Test123456!"
    echo -e "    Emails: {role}@elisaschool.cm"
    echo -e "    Exemples:"
    echo -e "      - admin.test@elisaschool.cm"
    echo -e "      - enseignant@elisaschool.cm"
    echo -e "      - parent@elisaschool.cm"
    echo -e "      - eleve@elisaschool.cm"
    echo ""
    echo -e "${BLUE}🚀 Pour démarrer l'application:${NC}"
    echo -e "  cd backend && npm run dev"
    echo -e "  cd frontend && npm run dev"
    echo ""
    echo -e "${GREEN}========================================${NC}"
}

# Fonction pour reset la base de données
reset_database() {
    echo -e "${YELLOW}⚠️  ATTENTION: Vous êtes sur le point de supprimer TOUTES les données!${NC}"
    echo -e "${YELLOW}Cette action est IRREVERSIBLE.${NC}"
    echo ""
    read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " CONFIRM
    
    if [ "$CONFIRM" != "oui" ]; then
        echo -e "${YELLOW}Opération annulée${NC}"
        exit 0
    fi
    
    echo -e "${BLUE}🗑️  Reset de la base de données...${NC}"
    
    # Supprimer toutes les tables
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        DO \$\$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END \$\$;
    " || {
        echo -e "${RED}✗ Échec du reset${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✓ Base de données resetée${NC}"
}

# Menu principal
show_help() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   eLISAschool - Script de Seeds${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  $0 [commande]"
    echo ""
    echo -e "${YELLOW}Commandes disponibles:${NC}"
    echo -e "  ${GREEN}all${NC}              Exécuter tous les seeds (par défaut)"
    echo -e "  ${GREEN}migrations${NC}       Exécuter uniquement les migrations"
    echo -e "  ${GREEN}seeds${NC}            Exécuter uniquement les seeds"
    echo -e "  ${GREEN}reset${NC}            Reset la base de données"
    echo -e "  ${GREEN}reset+seed${NC}       Reset + exécuter les seeds"
    echo -e "  ${GREEN}help${NC}             Afficher cette aide"
    echo ""
    echo -e "${YELLOW}Exemples:${NC}"
    echo -e "  $0 all              # Exécuter tous les seeds"
    echo -e "  $0 reset+seed       # Reset complet et seeds"
    echo -e "  $0 help             # Afficher l'aide"
    echo ""
}

# Exécution
case "${1:-all}" in
    all)
        check_database
        run_migrations
        run_seeds
        show_summary
        ;;
    migrations)
        check_database
        run_migrations
        ;;
    seeds)
        check_database
        run_seeds
        ;;
    reset)
        check_database
        reset_database
        ;;
    reset+seed)
        check_database
        reset_database
        run_migrations
        run_seeds
        show_summary
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}✗ Commande inconnue: $1${NC}"
        show_help
        exit 1
        ;;
esac
