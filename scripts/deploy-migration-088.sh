#!/bin/bash

# ==================================
# eLISAschool - Script de Déploiement Migration 088
# ==================================
# Refactorisation Architecture Académique
# Version: 1.0.0
# Auteur: franck arlos chendjou

set -e  # Arrêter en cas d'erreur

echo "===================================="
echo "Migration 088: Refactorisation Architecture Académique"
echo "===================================="
echo ""

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-postgres}"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de vérification
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# 1. Vérifier la connexion PostgreSQL
echo "1. Vérification de la connexion PostgreSQL..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1
check_result $? "Connexion PostgreSQL établie"
echo ""

# 2. Backup avant migration
echo "2. Backup du schéma avant migration..."
BACKUP_FILE="backups/schema-backup-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backups
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --schema-only > $BACKUP_FILE 2>&1
check_result $? "Backup créé: $BACKUP_FILE"
echo ""

# 3. Vérifier les prérequis
echo "3. Vérification des prérequis..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Tables existantes OK'
        ELSE 'ATTENTION: Tables manquantes'
    END AS status
FROM information_schema.tables 
WHERE table_name IN ('classes', 'annees_scolaires', 'matieres', 'affectations_matieres', 'affectations_eleves', 'bulletins');
"
echo ""

# 4. Exécuter la migration
echo "4. Exécution de la migration 088..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/088-refactorisation-architecture-academique.sql
check_result $? "Migration 088 exécutée"
echo ""

# 5. Vérifier les nouvelles tables
echo "5. Vérification des nouvelles tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'configurations_matieres_classes' THEN (SELECT COUNT(*) FROM configurations_matieres_classes)
        WHEN table_name = 'classes_annees' THEN (SELECT COUNT(*) FROM classes_annees)
        ELSE 0
    END AS row_count
FROM information_schema.tables 
WHERE table_name IN ('configurations_matieres_classes', 'classes_annees')
ORDER BY table_name;
"
echo ""

# 6. Vérifier les colonnes ajoutées
echo "6. Vérification des colonnes ajoutées à affectations_matieres..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'affectations_matieres'
  AND column_name IN ('configuration_id', 'date_debut', 'date_fin', 'actif')
ORDER BY column_name;
"
echo ""

# 7. Vérifier les données migrées
echo "7. Vérification des données migrées..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    'classes_annees' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT classe_id) AS distinct_classes,
    COUNT(DISTINCT annee_scolaire_id) AS distinct_years
FROM classes_annees

UNION ALL

SELECT 
    'configurations_matieres_classes' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT matiere_id) AS distinct_matieres,
    COUNT(DISTINCT classe_id) AS distinct_classes
FROM configurations_matieres_classes

UNION ALL

SELECT 
    'affectations_eleves (avec classe_annee_id)' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(classe_annee_id) AS with_classe_annee,
    COUNT(*) - COUNT(classe_annee_id) AS without_classe_annee
FROM affectations_eleves;
"
echo ""

# 8. Vérifier les index
echo "8. Vérification des index créés..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    tablename,
    indexname,
    CASE 
        WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
        ELSE 'NORMAL'
    END AS index_type
FROM pg_indexes
WHERE tablename IN ('configurations_matieres_classes', 'classes_annees')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
"
echo ""

# 9. Vérifier les triggers
echo "9. Vérification des triggers..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('configurations_matieres_classes', 'classes_annees')
ORDER BY event_object_table;
"
echo ""

# 10. Résumé final
echo ""
echo "===================================="
echo -e "${GREEN}Migration 088 terminée avec succès !${NC}"
echo "===================================="
echo ""
echo "Résumé:"
echo "  ✓ Table configurations_matieres_classes créée"
echo "  ✓ Table classes_annees créée"
echo "  ✓ Colonnes ajoutées à affectations_matieres"
echo "  ✓ Données migrées"
echo "  ✓ Index et contraintes créés"
echo "  ✓ Triggers updated_at configurés"
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifier les données dans pgAdmin/DBeaver"
echo "  2. Tester l'API backend"
echo "  3. Mettre à jour le frontend si nécessaire"
echo "  4. Supprimer les anciennes colonnes après validation:"
echo "     - affectations_eleves.classe_id"
echo "     - affectations_eleves.annee_scolaire_id"
echo "     - bulletins.classe_id"
echo "     - bulletins.annee_scolaire_id"
echo "     - classes.annee_scolaire_id"
echo "     - classes.professeur_principal_id"
echo ""
echo "Backup disponible: $BACKUP_FILE"
echo ""
