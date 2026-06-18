#!/bin/bash

# ==================================
# eLISAschool - Script Migration 075
# ==================================
# Module: Groupes Établissements
# Description: Crée les tables et permissions pour le module groupes
# ==================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================="
echo -e "Migration 075: Module Groupes Établissements"
echo -e "==========================================${NC}"

# Chemin vers le projet
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION_FILE="$PROJECT_ROOT/database/migrations/075-module-groupes-etablissements.sql"

# Vérifier que le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi

# Charger les variables d'environnement
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé, utilisation des valeurs par défaut${NC}"
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-7002}"
    DB_NAME="${DB_NAME:-elisaschool}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASSWORD="${DB_PASSWORD:-postgres}"
fi

# Afficher les informations de connexion
echo -e "${YELLOW}📊 Connexion à la base de données:${NC}"
echo "   Hôte: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Base: $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo ""

# Exécuter la migration
echo -e "${GREEN}🚀 Exécution de la migration...${NC}"
echo ""

PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "✅ Migration exécutée avec succès !"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "${YELLOW}📋 Prochaines étapes :${NC}"
    echo "   1. Redémarrer le backend : npm run dev"
    echo "   2. Vérifier les logs de démarrage"
    echo "   3. Accéder à /groupes-etablissements"
    echo ""
else
    echo ""
    echo -e "${RED}=========================================="
    echo -e "❌ Échec de la migration"
    echo -e "==========================================${NC}"
    echo ""
    exit 1
fi
