#!/bin/bash

# ==================================
# eLISAschool - Déploiement Migration Structure Académique v2.0
# ==================================
# Version: 2.0.0
# Auteur: franck arlos chendjou
# Date: 2026-06-13
#
# Description:
# - Supprime TypeCycle et fusionne dans Cycle
# - Ajoute filières technologiques
# - Crée tables Specialites et Competences

set -e

echo "🚀 Déploiement de la migration Structure Académique v2.0..."

# Variables
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-postgres}"
MIGRATION_FILE="backend/database/migrations/054-refonte-structure-academique-v2.sql"

# Vérifier que le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Erreur: Fichier de migration non trouvé: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration: $MIGRATION_FILE"
echo "🗄️  Base de données: $DB_NAME@$DB_HOST:$DB_PORT"

# Exécuter la migration
echo "🔄 Exécution de la migration..."
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

echo "✅ Migration terminée avec succès!"
echo ""
echo "📊 Résumé des modifications:"
echo "  ✓ Table types_cycles supprimée"
echo "  ✓ Table cycles enrichie (description, dureeAnnees, diplomeSanctionnant)"
echo "  ✓ Table specialites créée"
echo "  ✓ Table competences créée"
echo "  ✓ 10 filières technologiques ajoutées"
echo ""
echo "🎓 Prochaines étapes:"
echo "  1. Redémarrer le backend: npm run dev"
echo "  2. Vérifier les logs pour erreurs"
echo "  3. Tester les endpoints: /api/cycles, /api/specialites, /api/competences"
