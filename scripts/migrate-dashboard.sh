#!/bin/bash

# ==================================
# eLISAschool - Script Migration Dashboard
# ==================================
# Version: 1.0.0
# Auteur: xAI Éducation
# 
# Applique la migration dashboard et vérifie l'installation

set -e  # Sortir en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================="
echo -e "eLISAschool - Migration Dashboard"
echo -e "==================================${NC}\n"

# 1. Vérifier les variables d'environnement
echo -e "${YELLOW}ÉTAPE 1: Vérification de l'environnement...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}✗ Fichier .env non trouvé${NC}"
    exit 1
fi

# Charger les variables
source .env

if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_DATABASE" ]; then
    echo -e "${RED}✗ Variables de base de données manquantes dans .env${NC}"
    echo -e "Required: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE"
    exit 1
fi

echo -e "${GREEN}✓ Variables d'environnement valides${NC}\n"

# 2. Vérifier la connexion PostgreSQL
echo -e "${YELLOW}ÉTAPE 2: Vérification connexion PostgreSQL...${NC}"

export PGPASSWORD="$DB_PASSWORD"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connexion PostgreSQL établie${NC}\n"
else
    echo -e "${RED}✗ Impossible de se connecter à PostgreSQL${NC}"
    echo -e "Host: $DB_HOST:$DB_PORT"
    echo -e "Database: $DB_DATABASE"
    echo -e "User: $DB_USERNAME"
    exit 1
fi

# 3. Vérifier si la table existe déjà
echo -e "${YELLOW}ÉTAPE 3: Vérification table dashboard_layouts...${NC}"

TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -t -c \
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dashboard_layouts');")

if [ "$(echo $TABLE_EXISTS | xargs)" = "t" ]; then
    echo -e "${YELLOW}⚠ Table dashboard_layouts existe déjà${NC}"
    read -p "Voulez-vous la recréer? (y/N): " recreate
    if [[ "$recreate" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Suppression de la table existante...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -c \
            "DROP TABLE IF EXISTS dashboard_layouts CASCADE;"
        echo -e "${GREEN}✓ Table supprimée${NC}\n"
    else
        echo -e "${BLUE}✓ Utilisation de la table existante${NC}\n"
        exit 0
    fi
fi

# 4. Appliquer la migration
echo -e "${YELLOW}ÉTAPE 4: Application de la migration...${NC}"

MIGRATION_FILE="backend/src/database/migrations/010-dashboard-layouts.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗ Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -f "$MIGRATION_FILE"; then
    echo -e "${GREEN}✓ Migration appliquée avec succès${NC}\n"
else
    echo -e "${RED}✗ Échec de la migration${NC}"
    exit 1
fi

# 5. Vérifier la création de la table
echo -e "${YELLOW}ÉTAPE 5: Vérification de la table...${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -c \
    "SELECT column_name, data_type, is_nullable 
     FROM information_schema.columns 
     WHERE table_name = 'dashboard_layouts' 
     ORDER BY ordinal_position;"

echo -e ""

# 6. Vérifier les index
echo -e "${YELLOW}ÉTAPE 6: Vérification des index...${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -c \
    "SELECT indexname, indexdef 
     FROM pg_indexes 
     WHERE tablename = 'dashboard_layouts';"

echo -e ""

# 7. Statistiques
echo -e "${YELLOW}ÉTAPE 7: Statistiques de la table...${NC}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -c \
    "SELECT 
        COUNT(*) as total_rows,
        pg_size_pretty(pg_total_relation_size('dashboard_layouts')) as total_size
     FROM dashboard_layouts;"

echo -e ""

# 8. Résumé
echo -e "${GREEN}=================================="
echo -e "✓ Migration Dashboard complétée!"
echo -e "==================================${NC}\n"

echo -e "${BLUE}Résumé:${NC}"
echo -e "  • Table: dashboard_layouts"
echo -e "  • Colonnes: 8 (id, utilisateur_id, etablissement_id, nom, widgets, actif, created_at, updated_at)"
echo -e "  • Index: 3 (utilisateur, utilisateur+etablissement, actif)"
echo -e "  • Trigger: updated_at automatique\n"

echo -e "${BLUE}Prochaines étapes:${NC}"
echo -e "  1. Compiler le backend: npm run build:backend"
echo -e "  2. Démarrer le serveur: cd backend && npm start"
echo -e "  3. Tester l'API: curl -H 'Authorization: Bearer <token>' http://localhost:3000/api/dashboard/widgets\n"

echo -e "${GREEN}✨ Dashboard système prêt!${NC}\n"
