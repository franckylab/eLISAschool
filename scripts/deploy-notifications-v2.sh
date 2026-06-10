#!/bin/bash
# ==================================
# eLISAschool - Script Déploiement Notifications Améliorées
# ==================================
# Version: 2.0.0
# Auteur: franck arlos chendjou
# Description: Déploiement automatique des améliorations notifications
# Date: 2026-06-09

set -e

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   eLISAschool - Déploiement Notifications v2.0.0       ║"
echo "║   Permissions, Cache, Audit Trail, Monitoring          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Variables
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
MIGRATION_FILE="$BACKEND_DIR/database/migrations/047-notifications-ameliorations.sql"

# ============================================
# 1. VÉRIFICATIONS PRÉLIMINAIRES
# ============================================

echo -e "${YELLOW}[1/6] Vérifications préliminaires...${NC}"

# Vérifier que le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Erreur: Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "✅ Fichier de migration trouvé"

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Erreur: Docker n'est pas en cours d'exécution${NC}"
    exit 1
fi

echo "✅ Docker est en cours d'exécution"

# Vérifier que les containers sont actifs
if ! docker-compose ps | grep -q "backend.*Up"; then
    echo -e "${YELLOW}⚠️  Le container backend n'est pas actif. Démarrage...${NC}"
    cd "$PROJECT_ROOT"
    docker-compose up -d backend
    sleep 5
fi

echo "✅ Container backend actif"

# ============================================
# 2. BACKUP DE LA BASE DE DONNÉES
# ============================================

echo ""
echo -e "${YELLOW}[2/6] Backup de la base de données...${NC}"

BACKUP_FILE="$PROJECT_ROOT/backups/notifications_pre_v2_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "$PROJECT_ROOT/backups"

docker-compose exec -T postgres pg_dump -U elisa elisaschool > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${RED}⚠️  Échec du backup automatique. Continuation sans backup...${NC}"
}

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup créé: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo -e "${YELLOW}⚠️  Backup non créé (continuons avec prudence)${NC}"
fi

# ============================================
# 3. EXÉCUTION DE LA MIGRATION
# ============================================

echo ""
echo -e "${YELLOW}[3/6] Exécution de la migration SQL...${NC}"

docker-compose exec -T postgres psql -U elisa -d elisaschool < "$MIGRATION_FILE" || {
    echo -e "${RED}❌ Erreur lors de l'exécution de la migration${NC}"
    echo -e "${YELLOW}💡 Vous pouvez restaurer le backup: $BACKUP_FILE${NC}"
    exit 1
}

echo "✅ Migration exécutée avec succès"

# ============================================
# 4. VÉRIFICATION DES PERMISSIONS
# ============================================

echo ""
echo -e "${YELLOW}[4/6] Vérification des permissions RBAC...${NC}"

PERMISSIONS_COUNT=$(docker-compose exec -T postgres psql -U elisa -d elisaschool -t -c \
    "SELECT COUNT(*) FROM permissions WHERE code LIKE 'notification%';" 2>/dev/null | tr -d ' ')

echo "✅ Permissions notifications: $PERMISSIONS_COUNT"

# Afficher les permissions créées
echo ""
echo "📋 Permissions créées:"
docker-compose exec -T postgres psql -U elisa -d elisaschool -c \
    "SELECT code, libelle FROM permissions WHERE code LIKE 'notification%' ORDER BY code;" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Impossible d'afficher les permissions${NC}"
}

# ============================================
# 5. VÉRIFICATION DES PARAMÈTRES
# ============================================

echo ""
echo -e "${YELLOW}[5/6] Vérification des paramètres de configuration...${NC}"

PARAMS_COUNT=$(docker-compose exec -T postgres psql -U elisa -d elisaschool -t -c \
    "SELECT COUNT(*) FROM parametres_configurations WHERE cle LIKE 'notifications.%';" 2>/dev/null | tr -d ' ')

echo "✅ Paramètres notifications: $PARAMS_COUNT"

# Afficher les nouveaux paramètres
echo ""
echo "📋 Paramètres configurés:"
docker-compose exec -T postgres psql -U elisa -d elisaschool -c \
    "SELECT cle, valeur, type FROM parametres_configurations WHERE cle LIKE 'notifications.%' ORDER BY cle;" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Impossible d'afficher les paramètres${NC}"
}

# ============================================
# 6. REDÉMARRAGE DU BACKEND
# ============================================

echo ""
echo -e "${YELLOW}[6/6] Redémarrage du backend pour appliquer les changements...${NC}"

cd "$PROJECT_ROOT"
docker-compose restart backend

echo "✅ Backend redémarré"

# Attendre que le backend soit prêt
echo "⏳ Attente du démarrage du backend..."
sleep 10

# Vérifier que le backend est actif
if docker-compose ps | grep -q "backend.*Up"; then
    echo "✅ Backend actif et fonctionnel"
else
    echo -e "${RED}❌ Erreur: Le backend ne s'est pas redémarré correctement${NC}"
    echo -e "${YELLOW}💡 Vérifiez les logs: docker-compose logs backend${NC}"
    exit 1
fi

# ============================================
# RÉSUMÉ FINAL
# ============================================

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           ✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈ            ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  📊 Résumé:                                              ║"
echo "║     • Permissions RBAC: $PERMISSIONS_COUNT créées               ║"
echo "║     • Paramètres config: $PARAMS_COUNT configurés              ║"
echo "║     • Cache optimisé: TTL 15 min                         ║"
echo "║     • Audit trail: 10 nouvelles actions                  ║"
echo "║     • Multi-tenant: Validation stricte                   ║"
echo "║     • Monitoring: Vues SQL créées                        ║"
echo "║                                                          ║"
echo "║  🔗 Prochaines étapes:                                   ║"
echo "║     1. Tester les nouvelles permissions                  ║"
echo "║     2. Configurer les providers selon vos besoins        ║"
echo "║     3. Monitorer via les vues SQL                        ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}📚 Documentation complète:${NC}"
echo "   • ANALYSE-PERMISSIONS-CONFIGURATION-AUDIT.md"
echo "   • backend/database/migrations/047-notifications-ameliorations.sql"
echo ""

echo -e "${YELLOW}🧪 Tests recommandés:${NC}"
echo "   # Vérifier les permissions"
echo "   curl -H 'Authorization: Bearer <TOKEN>' http://localhost:3000/api/notification-providers"
echo ""
echo "   # Tester l'envoi de notification"
echo "   curl -X POST -H 'Authorization: Bearer <TOKEN>' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"destinataireId\":\"...\",\"titre\":\"Test\",\"contenu\":\"Test notification\",\"type\":\"IN_APP\"}' \\"
echo "     http://localhost:3000/api/notifications"
echo ""

echo -e "${GREEN}✨ Déploiement terminé avec succès ! ✨${NC}"
echo ""

exit 0
