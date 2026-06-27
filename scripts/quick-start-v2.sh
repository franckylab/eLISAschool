#!/bin/bash
# =====================================================
# eLISAschool - Script de démarrage après migrations V2
# =====================================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Usage: ./scripts/quick-start-v2.sh
# =====================================================

set -e

echo "=========================================="
echo "=== QUICK START ARCHITECTURE V2 ==="
echo "=========================================="
echo ""

# 1. Vérifier PostgreSQL
echo "1. VÉRIFICATION POSTGRESQL..."
if PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL connecté"
else
    echo "❌ PostgreSQL non accessible"
    exit 1
fi

# 2. Vérifier migrations
echo ""
echo "2. VÉRIFICATION MIGRATIONS..."
TABLE_COUNT=$(PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool -t -c "
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('classes_annees', 'configurations_scoring', 'configurations_matieres_classes');
")

if [ "$TABLE_COUNT" -eq 3 ]; then
    echo "✅ 3/3 tables migrées"
else
    echo "❌ Seulement $TABLE_COUNT/3 tables"
    exit 1
fi

# 3. Vérifier données
echo ""
echo "3. VÉRIFICATION DONNÉES..."
CA_COUNT=$(PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool -t -c "SELECT count(*) FROM classes_annees;")
CS_COUNT=$(PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool -t -c "SELECT count(*) FROM configurations_scoring;")

echo "📊 classes_annees: $CA_COUNT"
echo "📊 configurations_scoring: $CS_COUNT"

if [ "$CA_COUNT" -gt 0 ] && [ "$CS_COUNT" -gt 0 ]; then
    echo "✅ Données peuplées"
else
    echo "⚠️  Données manquantes"
fi

# 4. Instructions suivantes
echo ""
echo "=========================================="
echo "=== ÉTAPES SUIVANTES ==="
echo "=========================================="
echo ""
echo "1. Compiler le backend:"
echo "   cd backend"
echo "   npm install"
echo "   npm run build"
echo ""
echo "2. Démarrer l'application:"
echo "   npm run dev    # Development"
echo "   npm start      # Production"
echo ""
echo "3. Tester les endpoints:"
echo "   ./scripts/test-migrations-v2.sh"
echo ""
echo "4. Accéder à l'application:"
echo "   Backend: http://localhost:3000"
echo "   Frontend: http://localhost:7001"
echo ""
echo "=========================================="
echo "=== PRÊT! ==="
echo "=========================================="
