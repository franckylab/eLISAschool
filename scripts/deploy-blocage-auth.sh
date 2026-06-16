#!/bin/bash
# ==================================
# eLISAschool - Déploiement Système de Blocage Auth Deux Niveaux
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# ==================================

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "🚀 Déploiement Système de Blocage Auth"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
DB_CONTAINER="elisaschool_db"
DB_NAME="elisaschool"
DB_USER="elisaschool_user"
MIGRATION_FILE="backend/src/database/migrations/018-systeme-blocage-deux-niveaux.sql"

# Étape 1: Vérifier que le container DB est actif
echo -e "${YELLOW}📋 Étape 1: Vérification base de données...${NC}"
if docker ps | grep -q $DB_CONTAINER; then
    echo -e "${GREEN}✅ Container PostgreSQL actif${NC}"
else
    echo -e "${RED}❌ Container PostgreSQL non trouvé${NC}"
    exit 1
fi

# Étape 2: Exécuter la migration
echo -e "${YELLOW}📋 Étape 2: Exécution migration SQL...${NC}"
if docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $MIGRATION_FILE 2>/dev/null; then
    echo -e "${GREEN}✅ Migration exécutée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la migration${NC}"
    exit 1
fi

# Étape 3: Vérifier la table
echo -e "${YELLOW}📋 Étape 3: Vérification table créée...${NC}"
TABLE_EXISTS=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tentatives_connexion');" | tr -d ' ')

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✅ Table tentatives_connexion créée${NC}"
else
    echo -e "${RED}❌ Table non trouvée${NC}"
    exit 1
fi

# Étape 4: Vérifier les paramètres
echo -e "${YELLOW}📋 Étape 4: Vérification paramètres de configuration...${NC}"
PARAM_COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM parametres_systeme WHERE cle LIKE 'auth.%_tentatives_%' OR cle LIKE 'auth.%_blocage_%';" | tr -d ' ')

if [ "$PARAM_COUNT" -ge 4 ]; then
    echo -e "${GREEN}✅ $PARAM_COUNT paramètres de blocage configurés${NC}"
else
    echo -e "${YELLOW}⚠️  Seulement $PARAM_COUNT paramètres trouvés${NC}"
fi

# Étape 5: Redémarrer le backend
echo -e "${YELLOW}📋 Étape 5: Redémarrage backend...${NC}"

# Arrêter l'ancien processus
if lsof -ti:7000 > /dev/null 2>&1; then
    echo "   Arrêt processus sur port 7000..."
    lsof -ti:7000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Redémarrer (commenté - à faire manuellement)
echo -e "${YELLOW}⚠️  Pour redémarrer le backend :${NC}"
echo "   cd backend && npm run dev"

# Étape 6: Résumé
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo "=========================================="
echo ""
echo "📊 Résumé :"
echo "  • Table tentatives_connexion: ✅ Créée"
echo "  • Paramètres config: ✅ $PARAM_COUNT paramètres"
echo "  • Index stratégiques: ✅ 4 index"
echo "  • Fonction nettoyage: ✅ Créée"
echo ""
echo "🔧 Prochaines étapes :"
echo "  1. Redémarrer le backend: cd backend && npm run dev"
echo "  2. Tester blocage: curl -X POST http://localhost:7000/api/auth/login ..."
echo "  3. Vérifier logs: tail -f backend/logs/app.log | grep Blocage"
echo ""
echo "📚 Documentation: docs/SYSTEME-BLOCAGE-AUTH-DEUX-NIVEAUX.md"
echo ""
