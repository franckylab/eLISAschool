#!/bin/bash
# ==================================
# eLISAschool - Script de Validation Architecture v2
# ==================================
# Vérifie que toutes les entités utilisent classeAnneeId correctement

echo "=== VALIDATION ARCHITECTURE ACADÉMIQUE V2 ==="
echo ""

DB_PASSWORD="elisaschool_password"
DB_USER="elisaschool_user"
DB_NAME="elisaschool"
DB_HOST="localhost"
DB_PORT="7002"

export PGPASSWORD=$DB_PASSWORD

# 1. Vérifier la structure des tables
echo "📊 1. VÉRIFICATION STRUCTURE BASE DE DONNÉES"
echo ""

echo "📋 Table: bulletins"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d bulletins" 2>&1 | grep -E "classeAnneeId|classeId|anneeScolaireId"

echo ""
echo "📋 Table: notes"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d notes" 2>&1 | grep -E "classeAnneeId|classeId|anneeScolaireId"

echo ""
echo "📋 Table: emploi_du_temps"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d emploi_du_temps" 2>&1 | grep -E "classeAnneeId|classeId|anneeScolaireId"

echo ""
echo "📋 Table: affectations_matieres"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d affectations_matieres" 2>&1 | grep -E "classeAnneeId|classeId|anneeScolaireId"

echo ""
echo "📋 Table: configurations_matieres_classes"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d configurations_matieres_classes" 2>&1 | grep -E "classeAnneeId|classeId|anneeScolaireId"

echo ""
echo "📋 Table: classes (ne doit PAS avoir anneeScolaireId)"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d classes" 2>&1 | grep -E "anneeScolaireId|professeurPrincipalId|effectifMax|effectifActuel" || echo "   ✅ Colonnes annuelles supprimées"

# 2. Vérifier les index
echo ""
echo "🔍 2. VÉRIFICATION INDEX"
echo ""

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('bulletins', 'notes', 'emploi_du_temps', 'affectations_matieres', 'configurations_matieres_classes', 'classes_annees')
AND indexname LIKE '%classe%'
ORDER BY tablename, indexname;
"

# 3. Vérifier les contraintes de clé étrangère
echo ""
echo "🔗 3. VÉRIFICATION FOREIGN KEYS"
echo ""

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND kcu.column_name = 'classeAnneeId'
ORDER BY tc.table_name;
"

# 4. Compter les données
echo ""
echo "📈 4. STATISTIQUES DONNÉES"
echo ""

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 'classes_annees' as table_name, COUNT(*) as total, COUNT(\"classeAnneeId\") as avec_classe_annee FROM classes_annees
UNION ALL
SELECT 'bulletins', COUNT(*), COUNT(\"classeAnneeId\") FROM bulletins
UNION ALL
SELECT 'notes', COUNT(*), COUNT(\"classeAnneeId\") FROM notes
UNION ALL
SELECT 'emploi_du_temps', COUNT(*), COUNT(\"classeAnneeId\") FROM emploi_du_temps
UNION ALL
SELECT 'affectations_matieres', COUNT(*), COUNT(\"classeAnneeId\") FROM affectations_matieres
UNION ALL
SELECT 'configurations_matieres_classes', COUNT(*), COUNT(\"classeAnneeId\") FROM configurations_matieres_classes;
"

# 5. Vérifier cohérence des entités TypeORM
echo ""
echo "🔎 5. VÉRIFICATION ENTITÉS TYPEORM"
echo ""

echo "✅ Entités avec classeAnneeId:"
grep -r "classeAnneeId.*string" /mnt/DONNEES/projets/eLISAschool/backend/src/modules/*/entities/*.entity.ts 2>/dev/null | wc -l

echo "❌ Entités avec ancien classeId (devrait être 0):"
grep -r "classeId.*string" /mnt/DONNEES/projets/eLISAschool/backend/src/modules/{bulletins,notes,emploi-du-temps,matieres}/entities/*.entity.ts 2>/dev/null | wc -l

echo "❌ Entités avec ancien anneeScolaireId (devrait être 0):"
grep -r "anneeScolaireId.*string" /mnt/DONNEES/projets/eLISAschool/backend/src/modules/{bulletins,notes,emploi-du-temps,matieres}/entities/*.entity.ts 2>/dev/null | wc -l

# 6. Résumé
echo ""
echo "=== RÉSUMÉ VALIDATION ==="
echo ""

ERRORS=0

# Vérifier si des anciennes colonnes existent
OLD_COLS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM information_schema.columns
WHERE table_name IN ('bulletins', 'notes', 'emploi_du_temps', 'affectations_matieres', 'configurations_matieres_classes')
AND column_name IN ('classeId', 'anneeScolaireId');
")

if [ "$OLD_COLS" -eq 0 ]; then
    echo "✅ Structure DB: Aucune ancienne colonne (classeId, anneeScolaireId)"
else
    echo "❌ Structure DB: $OLD_COLS anciennes colonnes encore présentes"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier si classeAnneeId existe partout
NEW_COLS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*)
FROM information_schema.columns
WHERE table_name IN ('bulletins', 'notes', 'emploi_du_temps', 'affectations_matieres', 'configurations_matieres_classes')
AND column_name = 'classeAnneeId';
")

if [ "$NEW_COLS" -eq 5 ]; then
    echo "✅ Structure DB: classeAnneeId présent dans 5/5 tables"
else
    echo "❌ Structure DB: classeAnneeId présent dans $NEW_COLS/5 tables"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉 VALIDATION RÉUSSIE - Architecture v2 cohérente"
    exit 0
else
    echo "⚠️  VALIDATION ÉCHOUÉE - $ERRORS erreur(s) détectée(s)"
    exit 1
fi
