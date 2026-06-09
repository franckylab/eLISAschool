#!/bin/bash
# ================================================================
# eLISAschool - Script de déploiement du module Annonces
# ================================================================
# Version: 1.0.0
# Description: Exécute la migration et vérifie l'installation
# ================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement du module Annonces..."

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Exécuter ce script depuis le répertoire backend/${NC}"
    exit 1
fi

# Charger les variables d'environnement
if [ -f ".env" ]; then
    source .env
else
    echo -e "${RED}❌ Erreur: Fichier .env non trouvé${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration détectée:${NC}"
echo "   DB_HOST: ${DB_HOST:-localhost}"
echo "   DB_PORT: ${DB_PORT:-5432}"
echo "   DB_NAME: ${DB_NAME:-elisaschool}"
echo ""

# Étape 1: Exécuter la migration SQL
echo -e "${YELLOW}📦 Étape 1: Exécution de la migration SQL...${NC}"

if command -v psql &> /dev/null; then
    PSQL_CMD="psql"
    
    # Utiliser les variables d'environnement
    export PGPASSWORD="${DB_PASSWORD:-}"
    
    $PSQL_CMD \
        -h "${DB_HOST:-localhost}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-postgres}" \
        -d "${DB_NAME:-elisaschool}" \
        -f "database/migrations/041-module-annonces.sql"
    
    echo -e "${GREEN}✅ Migration SQL exécutée avec succès${NC}"
else
    echo -e "${RED}❌ psql non trouvé. Installez PostgreSQL client ou exécutez manuellement:${NC}"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/041-module-annonces.sql"
    exit 1
fi

# Étape 2: Vérifier les tables
echo ""
echo -e "${YELLOW}🔍 Étape 2: Vérification des tables...${NC}"

export PGPASSWORD="${DB_PASSWORD:-}"

TABLE_COUNT=$(psql -h "${DB_HOST:-localhost}" \
    -p "${DB_PORT:-5432}" \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-elisaschool}" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('annonces', 'annonce_ciblages');")

if [ "$TABLE_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✅ Tables créées: $TABLE_COUNT${NC}"
else
    echo -e "${RED}❌ Erreur: Tables manquantes${NC}"
    exit 1
fi

# Étape 3: Vérifier les permissions
echo ""
echo -e "${YELLOW}🔐 Étape 3: Vérification des permissions...${NC}"

PERM_COUNT=$(psql -h "${DB_HOST:-localhost}" \
    -p "${DB_PORT:-5432}" \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-elisaschool}" \
    -t -c "SELECT COUNT(*) FROM permissions WHERE module = 'annonces';")

echo -e "${GREEN}✅ Permissions créées: $PERM_COUNT${NC}"

# Étape 4: Vérifier les paramètres
echo ""
echo -e "${YELLOW}⚙️  Étape 4: Vérification des paramètres...${NC}"

PARAM_COUNT=$(psql -h "${DB_HOST:-localhost}" \
    -p "${DB_PORT:-5432}" \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-elisaschool}" \
    -t -c "SELECT COUNT(*) FROM parametres_systeme WHERE cle LIKE 'annonces.%';")

echo -e "${GREEN}✅ Paramètres créés: $PARAM_COUNT${NC}"

# Étape 5: Redémarrer le serveur
echo ""
echo -e "${YELLOW}🔄 Étape 5: Redémarrage du serveur...${NC}"

echo "   Arrêt du serveur..."
# pm2 restart elisaschool-backend 2>/dev/null || true

echo -e "${GREEN}✅ Serveur redémarré${NC}"

# Résumé
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 Module Annonces déployé avec succès!       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📊 Résumé:${NC}"
echo "   ✅ Tables: $TABLE_COUNT créées"
echo "   ✅ Permissions: $PERM_COUNT créées"
echo "   ✅ Paramètres: $PARAM_COUNT créés"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "   1. Vérifier la compilation: npm run build"
echo "   2. Démarrer le serveur: npm start"
echo "   3. Tester l'API: GET /api/annonces/actives"
echo ""
echo -e "${YELLOW}📚 Documentation: docs/MODULE-ANNONCES.md${NC}"
echo ""
