#!/bin/bash
# =====================================================
# eLISAschool - Script de test des migrations académiques v2
# =====================================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# Description: Vérifier que toutes les migrations ont réussi
# =====================================================

set -e

DB_USER="elisaschool_user"
DB_PASSWORD="elisaschool_password"
DB_NAME="elisaschool"
DB_HOST="localhost"
DB_PORT="7002"

export PGPASSWORD=$DB_PASSWORD

echo "=========================================="
echo "=== TEST MIGRATIONS ARCHITECTURE V2 ==="
echo "=========================================="
echo ""

# 1. Vérifier tables existantes
echo "1. VÉRIFICATION TABLES..."
TABLES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'configurations_matieres_classes',
    'classes_annees',
    'configurations_scoring'
)
ORDER BY table_name;
")

if echo "$TABLES" | grep -q "configurations_matieres_classes"; then
    echo "✅ configurations_matieres_classes existe"
else
    echo "❌ configurations_matieres_classes manquante"
fi

if echo "$TABLES" | grep -q "classes_annees"; then
    echo "✅ classes_annees existe"
else
    echo "❌ classes_annees manquante"
fi

if echo "$TABLES" | grep -q "configurations_scoring"; then
    echo "✅ configurations_scoring existe"
else
    echo "❌ configurations_scoring manquante"
fi

echo ""

# 2. Vérifier données
echo "2. VÉRIFICATION DONNÉES..."

CLASSES_ANNEES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM classes_annees;")
echo "📊 classes_annees: $CLASSES_ANNEES lignes"

CONFIG_SCORING=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM configurations_scoring;")
echo "📊 configurations_scoring: $CONFIG_SCORING lignes"

CONFIG_MATIERES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM configurations_matieres_classes;")
echo "📊 configurations_matieres_classes: $CONFIG_MATIERES lignes"

echo ""

# 3. Vérifier colonnes
echo "3. VÉRIFICATION COLONNES..."

# Vérifier classeAnneeId dans bulletins
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d bulletins" 2>&1 | grep -q "classeAnneeId"; then
    echo "✅ bulletins.classeAnneeId existe"
else
    echo "⚠️  bulletins.classeAnneeId n'existe pas (optionnel)"
fi

# Vérifier affectationMatiereId dans emploi_du_temps
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d emploi_du_temps" 2>&1 | grep -q "affectationMatiereId"; then
    echo "✅ emploi_du_temps.affectationMatiereId existe"
else
    echo "⚠️  emploi_du_temps.affectationMatiereId n'existe pas (optionnel)"
fi

echo ""

# 4. Vérifier permission RBAC
echo "4. VÉRIFICATION PERMISSION RBAC..."

PERM=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT count(*) FROM permissions WHERE code = 'notes:modifier_apres_cloture';
")

if [ "$PERM" -gt 0 ]; then
    echo "✅ Permission notes:modifier_apres_cloture existe"
else
    echo "❌ Permission notes:modifier_apres_cloture manquante"
fi

echo ""

# 5. Vérifier index
echo "5. VÉRIFICATION INDEX..."

INDEX_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT count(*) FROM pg_indexes 
WHERE tablename IN ('classes_annees', 'configurations_scoring', 'configurations_matieres_classes')
AND indexname NOT LIKE '%pkey%';
")

echo "📊 Index créés: $INDEX_COUNT"

echo ""

# 6. Vérifier orphelins
echo "6. VÉRIFICATION INTÉGRITÉ DONNÉES..."

ORPHELINS_CA=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT count(*) FROM classes_annees ca
LEFT JOIN classes c ON ca.\"classeId\" = c.id
WHERE c.id IS NULL;
")

if [ "$ORPHELINS_CA" -eq 0 ]; then
    echo "✅ Aucune classe_annee orpheline"
else
    echo "❌ $ORPHELINS_CA classes_annees orphelines"
fi

ORPHELINS_CS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT count(*) FROM configurations_scoring cs
LEFT JOIN etablissements e ON cs.\"etablissementId\" = e.id
WHERE e.id IS NULL;
")

if [ "$ORPHELINS_CS" -eq 0 ]; then
    echo "✅ Aucune configuration_scoring orpheline"
else
    echo "❌ $ORPHELINS_CS configurations_scoring orphelines"
fi

echo ""
echo "=========================================="
echo "=== TEST TERMINÉ ==="
echo "=========================================="
