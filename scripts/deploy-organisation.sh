#!/bin/bash

# ==================================
# eLISAschool - Déploiement Module Organisation
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Ce script déploie le module organisation :
# 1. Exécute la migration SQL
# 2. Vérifie les tables créées
# 3. Valide l'intégration
# ==================================

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "  Déploiement du Module Organisation"
echo "=========================================="
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME=${POSTGRES_DB:-elisaschool_db}
DB_USER=${POSTGRES_USER:-elisaschool_user}
DB_CONTAINER=${DB_CONTAINER:-elisaschool-postgres}

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Étape 1: Vérification de la connexion à la base de données...${NC}"
if docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Base de données accessible${NC}"
else
    echo -e "${RED}✗ Impossible de se connecter à la base de données${NC}"
    echo "Vérifiez que le conteneur PostgreSQL est en cours d'exécution:"
    echo "  docker ps | grep postgres"
    exit 1
fi

echo ""
echo -e "${YELLOW}Étape 2: Exécution de la migration SQL...${NC}"
MIGRATION_FILE="backend/database/migrations/044-module-organisation.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗ Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi

# Copier le fichier de migration dans le conteneur
docker cp $MIGRATION_FILE $DB_CONTAINER:/tmp/migration.sql

# Exécuter la migration
if docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -f /tmp/migration.sql; then
    echo -e "${GREEN}✓ Migration exécutée avec succès${NC}"
else
    echo -e "${RED}✗ Échec de la migration${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Étape 3: Vérification des tables créées...${NC}"

TABLES=("organisations" "unites_organisationnelles" "postes" "hierarchie_personnel")
ALL_OK=true

for table in "${TABLES[@]}"; do
    if docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "\dt $table" | grep -q "$table"; then
        echo -e "${GREEN}✓ Table '$table' créée${NC}"
    else
        echo -e "${RED}✗ Table '$table' manquante${NC}"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = false ]; then
    echo -e "${RED}✗ Certaines tables n'ont pas été créées correctement${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Étape 4: Vérification des index...${NC}"

INDEX_COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE tablename IN ('organisations', 'unites_organisationnelles', 'postes', 'hierarchie_personnel')
    AND indexname LIKE 'idx_%';
")

echo -e "${GREEN}✓ $INDEX_COUNT index créés${NC}"

echo ""
echo -e "${YELLOW}Étape 5: Vérification des seeds...${NC}"

ORG_COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM organisations;")
echo -e "${GREEN}✓ $ORG_COUNT organisation(s) créée(s)${NC}"

UNITE_COUNT=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM unites_organisationnelles;")
echo -e "${GREEN}✓ $UNITE_COUNT unité(s) organisationnelle(s) créée(s)${NC}"

echo ""
echo -e "${YELLOW}Étape 6: Vérification de l'intégration backend...${NC}"

# Vérifier que le module est exporté
if grep -q "export \* from './organisation'" backend/src/modules/index.ts; then
    echo -e "${GREEN}✓ Module exporté dans modules/index.ts${NC}"
else
    echo -e "${RED}✗ Module non exporté dans modules/index.ts${NC}"
    exit 1
fi

# Vérifier que le controller est monté dans app.ts
if grep -q "organisationController" backend/src/app.ts; then
    echo -e "${GREEN}✓ Controller monté dans app.ts${NC}"
else
    echo -e "${RED}✗ Controller non monté dans app.ts${NC}"
    exit 1
fi

# Vérifier que le module est dans les enums
if grep -q "ORGANISATION = 'organisation'" shared/src/enums/modules.enum.ts; then
    echo -e "${GREEN}✓ Module ajouté dans modules.enum.ts${NC}"
else
    echo -e "${RED}✗ Module non ajouté dans modules.enum.ts${NC}"
    exit 1
fi

# Vérifier les permissions
if grep -q "ORGANISATION_VIEW" shared/src/enums/roles.enum.ts; then
    echo -e "${GREEN}✓ Permissions ajoutées dans roles.enum.ts${NC}"
else
    echo -e "${RED}✗ Permissions non ajoutées dans roles.enum.ts${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  ✓ Déploiement réussi !${NC}"
echo "=========================================="
echo ""
echo "Le module organisation est maintenant disponible."
echo ""
echo "Routes disponibles :"
echo "  GET    /api/organisation/organisations"
echo "  POST   /api/organisation/organisations"
echo "  GET    /api/organisation/unites"
echo "  POST   /api/organisation/unites"
echo "  GET    /api/organisation/postes"
echo "  POST   /api/organisation/postes"
echo "  GET    /api/organisation/hierarchie"
echo "  POST   /api/organisation/hierarchie"
echo "  GET    /api/organisation/arborescence/:organisationId"
echo "  GET    /api/organisation/organigramme/:organisationId"
echo "  GET    /api/organisation/statistiques/:organisationId"
echo ""
echo "Prochaines étapes :"
echo "  1. Redémarrer le backend: docker-compose restart backend"
echo "  2. Tester les endpoints avec Postman ou curl"
echo "  3. Consulter la documentation: docs/MODULE-ORGANISATION.md"
echo ""
