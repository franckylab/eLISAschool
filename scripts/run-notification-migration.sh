#!/bin/bash
# ==================================
# eLISAschool - Script Migration Notification Providers
# ==================================
# Exécute la migration des notification providers

set -e

echo "🚀 Exécution de la migration notification providers..."

cd "$(dirname "$0")/../../.."

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Exécuter la migration avec ts-node
cd backend
npx ts-node -r tsconfig-paths/register src/database/migrations/run-notification-providers-migration.ts

echo "✅ Migration terminée!"
