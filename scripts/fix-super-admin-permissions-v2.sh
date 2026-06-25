#!/bin/bash

# ==================================
# eLISAschool - Script: Correction Permissions SUPER_ADMIN
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Date: 2026-06-21
#
# Ce script applique la migration pour corriger les permissions du SUPER_ADMIN
# ==================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Correction Permissions SUPER_ADMIN${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
elif [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Fichier .env non trouvé${NC}"
    exit 1
fi

# Configuration de la base de données
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-elisaschool}

echo -e "${YELLOW}📊 Connexion à la base de données:${NC}"
echo -e "   Host: ${DB_HOST}:${DB_PORT}"
echo -e "   Database: ${DB_NAME}"
echo -e "   User: ${DB_USER}"
echo ""

# Vérifier la connexion
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Impossible de se connecter à la base de données${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connexion réussie${NC}"
echo ""

# Appliquer la migration
echo -e "${YELLOW}🔧 Application de la migration...${NC}"
echo ""

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/069-fix-super-admin-permissions.sql

echo ""
echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}✅ Migration appliquée avec succès${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""
echo -e "${YELLOW}💡 Prochaines étapes :${NC}"
echo -e "   1. Redémarrer le backend pour vider le cache"
echo -e "   2. Reconnecter l'utilisateur admin@elisaschool.cm"
echo -e "   3. Vérifier que le SUPER_ADMIN a maintenant ~487 permissions"
echo ""
