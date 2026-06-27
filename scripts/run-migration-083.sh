#!/bin/bash
# ========================================
# Script d'exécution Migration 083
# Fix contrainte unique parametres_systeme
# ========================================

set -e

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "=========================================="
echo "Migration 083: Fix contrainte unique"
echo "=========================================="
echo ""
echo "Database: $POSTGRES_DB"
echo "Host: $POSTGRES_HOST:$POSTGRES_PORT"
echo ""

# Exécuter la migration
echo "Exécution de la migration..."
psql -h "${POSTGRES_HOST:-localhost}" \
     -p "${POSTGRES_PORT:-5432}" \
     -U "$POSTGRES_USER" \
     -d "$POSTGRES_DB" \
     -f backend/database/migrations/083-fix-contrainte-unique-parametres.sql

echo ""
echo "=========================================="
echo "Migration 083 terminée ✅"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Redémarrez le backend pour que TypeORM prenne en compte le changement d'entité"
echo ""
echo "cd backend && pnpm dev"
