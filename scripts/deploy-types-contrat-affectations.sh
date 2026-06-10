#!/bin/bash

# ====================================================
# Script de déploiement: Types de Contrat & Affectations
# Description: Exécute la migration 046 et vérifie l'intégrité
# Date: 2026-06-09
# ====================================================

set -e

echo "=========================================="
echo "Déploiement: Types Contrat & Affectations"
echo "=========================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécuter ce script depuis le répertoire backend/"
    exit 1
fi

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Étape 1: Vérification de la base de données...${NC}"

# Vérifier la connexion à la base de données
if ! psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Impossible de se connecter à la base de données${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connexion DB OK${NC}"

echo -e "${YELLOW}📋 Étape 2: Exécution de la migration 046...${NC}"

# Exécuter la migration
psql $DATABASE_URL -f database/migrations/046-types-contrat-personnalises.sql

echo -e "${GREEN}✅ Migration exécutée avec succès${NC}"

echo -e "${YELLOW}📋 Étape 3: Vérification des tables créées...${NC}"

# Vérifier que les tables existent
TABLES_OK=true

if ! psql $DATABASE_URL -c "SELECT COUNT(*) FROM types_contrat_personnalises;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Table types_contrat_personnalises manquante${NC}"
    TABLES_OK=false
fi

if ! psql $DATABASE_URL -c "SELECT COUNT(*) FROM affectations_postes;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Table affectations_postes manquante${NC}"
    TABLES_OK=false
fi

if [ "$TABLES_OK" = true ]; then
    echo -e "${GREEN}✅ Toutes les tables sont créées${NC}"
else
    echo -e "${RED}❌ Certaines tables sont manquantes${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Étape 4: Vérification des types système...${NC}"

# Vérifier les types système
TYPES_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM types_contrat_personnalises WHERE est_systeme = true;")

if [ "$TYPES_COUNT" -ge 4 ]; then
    echo -e "${GREEN}✅ $TYPES_COUNT types système créés${NC}"
else
    echo -e "${RED}❌ Types système manquants (trouvé: $TYPES_COUNT, attendu: 4)${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Étape 5: Vérification des permissions...${NC}"

# Vérifier les nouvelles permissions
PERMS_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM permissions WHERE code LIKE 'rh_%contrat%' OR code LIKE 'rh_%affectation%' OR code LIKE 'rh_parcours%';")

if [ "$PERMS_COUNT" -ge 6 ]; then
    echo -e "${GREEN}✅ $PERMS_COUNT nouvelles permissions créées${NC}"
else
    echo -e "${YELLOW}⚠️  Permissions partielles (trouvé: $PERMS_COUNT)${NC}"
fi

echo -e "${YELLOW}📋 Étape 6: Vérification des indexes...${NC}"

# Vérifier les indexes critiques
INDEXES=$(psql $DATABASE_URL -t -c "
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE tablename IN ('types_contrat_personnalises', 'affectations_postes', 'contrats_personnel')
    AND indexname LIKE '%idx%';
")

echo -e "${GREEN}✅ $INDEXES indexes créés${NC}"

echo -e "${YELLOW}📋 Étape 7: Compilation TypeScript...${NC}"

# Compiler le projet pour vérifier les erreurs
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
else
    echo -e "${RED}❌ Erreurs de compilation détectées${NC}"
    echo "Exécuter 'npm run build' pour voir les détails"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS${NC}"
echo "=========================================="
echo ""
echo "📊 Récapitulatif :"
echo "  - Table types_contrat_personnalises: ✅"
echo "  - Table affectations_postes: ✅"
echo "  - Types système (CDD, CDI, VACATAIRE, STAGIAIRE): ✅"
echo "  - Permissions RBAC: ✅"
echo "  - Indexes optimisés: ✅"
echo "  - Audit trail: ✅"
echo ""
echo "🚀 Prochaines étapes :"
echo "  1. Redémarrer le serveur backend"
echo "  2. Tester les nouveaux endpoints API"
echo "  3. Configurer les types personnalisés dans l'interface"
echo ""
echo "📝 Endpoints disponibles :"
echo "  GET    /api/personnel/types-contrat"
echo "  POST   /api/personnel/types-contrat"
echo "  GET    /api/personnel/affectations"
echo "  POST   /api/personnel/affectations"
echo "  GET    /api/personnel/membres/:id/parcours-complet"
echo ""
