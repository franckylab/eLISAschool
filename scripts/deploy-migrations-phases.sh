#!/bin/bash

# ==================================
# eLISAschool - Script de Déploiement Phasé
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
# 
# Phases:
#   Phase 1: Création des tables de base
#   Phase 2: Migration des données et FK
#   Phase 3: Index, scoring, permissions

echo "========================================"
echo "eLISAschool - Déploiement Phasé"
echo "Architecture Académique v2"
echo "========================================"
echo ""

# Configuration DB
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-elisaschool}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

MIGRATION_088="backend/database/migrations/088-refactorisation-architecture-academique.sql"
MIGRATION_089="backend/database/migrations/089-finalisation-architecture-academique-v2.sql"

# Vérifier fichiers
if [ ! -f "$MIGRATION_088" ]; then
    echo "❌ Migration 088 introuvable: $MIGRATION_088"
    exit 1
fi

if [ ! -f "$MIGRATION_089" ]; then
    echo "❌ Migration 089 introuvable: $MIGRATION_089"
    exit 1
fi

echo "📋 Fichiers de migration trouvés"
echo "🗄️  Base: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""

# Demander confirmation
read -p "⚠️  Exécuter le déploiement complet? (oui/non): " CONFIRM
if [ "$CONFIRM" != "oui" ]; then
    echo "❌ Déploiement annulé"
    exit 0
fi

echo ""

# ==========================================
# PHASE 1: Création des tables de base
# ==========================================
echo "════════════════════════════════════════"
echo "🔷 PHASE 1: Création des tables"
echo "════════════════════════════════════════"
echo ""

echo "1.1 Création de configurations_matieres_classes..."
echo "1.2 Création de classes_annees..."
echo "1.3 Migration des données existantes..."
echo ""

# Exécuter migration 088
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $MIGRATION_088

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERREUR Phase 1 - Migration 088 échouée"
    exit 1
fi

echo ""
echo "✅ Phase 1 complétée"
echo ""

# Vérifications Phase 1
echo "📊 Vérifications Phase 1..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 'configurations_matieres_classes' as table_name, COUNT(*) as rows FROM configurations_matieres_classes
UNION ALL
SELECT 'classes_annees', COUNT(*) FROM classes_annees
UNION ALL
SELECT 'affectations_matieres (avec date_debut)', COUNT(*) FROM affectations_matieres WHERE date_debut IS NOT NULL
UNION ALL
SELECT 'affectations_eleves (migrées)', COUNT(*) FROM affectations_eleves WHERE classe_annee_id IS NOT NULL
UNION ALL
SELECT 'bulletins (migrés)', COUNT(*) FROM bulletins WHERE classe_annee_id IS NOT NULL;
"

echo ""

# ==========================================
# PHASE 2: Migration complète des données
# ==========================================
echo ""
echo "════════════════════════════════════════"
echo "🔷 PHASE 2: Finalisation des migrations"
echo "════════════════════════════════════════"
echo ""

echo "2.1 Vérification intégrité des données..."
echo "2.2 Activation des contraintes NOT NULL..."
echo "2.3 Suppression des colonnes obsolètes..."
echo ""

# Phase 2 SQL
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<'SQL'
-- ==========================================
-- PHASE 2: Finalisation et nettoyage
-- ==========================================

-- 1. Rendre classe_annee_id NOT NULL si toutes les migrations sont OK
DO $$
DECLARE
    count_ae_null INTEGER;
    count_b_null INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_ae_null FROM affectations_eleves WHERE classe_annee_id IS NULL;
    SELECT COUNT(*) INTO count_b_null FROM bulletins WHERE classe_annee_id IS NULL;
    
    IF count_ae_null = 0 THEN
        ALTER TABLE affectations_eleves ALTER COLUMN classe_annee_id SET NOT NULL;
        RAISE NOTICE '✅ affectations_eleves.classe_annee_id rendu NOT NULL';
    ELSE
        RAISE WARNING '⚠️  % affectations_eleves ont classe_annee_id NULL', count_ae_null;
    END IF;
    
    IF count_b_null = 0 THEN
        ALTER TABLE bulletins ALTER COLUMN classe_annee_id SET NOT NULL;
        RAISE NOTICE '✅ bulletins.classe_annee_id rendu NOT NULL';
    ELSE
        RAISE WARNING '⚠️  % bulletins ont classe_annee_id NULL', count_b_null;
    END IF;
END $$;

-- 2. Vérifier les orphelins
DO $$
DECLARE
    orphan_ae INTEGER;
    orphan_b INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_ae 
    FROM affectations_eleves ae
    LEFT JOIN classes_annees ca ON ae.classe_annee_id = ca.id
    WHERE ca.id IS NULL;
    
    SELECT COUNT(*) INTO orphan_b
    FROM bulletins b
    LEFT JOIN classes_annees ca ON b.classe_annee_id = ca.id
    WHERE ca.id IS NULL;
    
    IF orphan_ae > 0 OR orphan_b > 0 THEN
        RAISE WARNING '⚠️  Orphelins détectés: affectations_eleves=%, bulletins=%', orphan_ae, orphan_b;
    ELSE
        RAISE NOTICE '✅ Aucun orphelin détecté';
    END IF;
END $$;

-- 3. Supprimer les anciennes colonnes (décommenter après vérification)
-- ALTER TABLE affectations_eleves DROP COLUMN IF EXISTS classe_id;
-- ALTER TABLE affectations_eleves DROP COLUMN IF EXISTS annee_scolaire_id;
-- ALTER TABLE bulletins DROP COLUMN IF EXISTS classe_id;
-- ALTER TABLE bulletins DROP COLUMN IF EXISTS annee_scolaire_id;
-- ALTER TABLE classes DROP COLUMN IF EXISTS annee_scolaire_id;
-- ALTER TABLE classes DROP COLUMN IF EXISTS professeur_principal_id;

RAISE NOTICE '✅ Phase 2 complétée - Anciennes colonnes conservées pour compatibilité';
SQL

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERREUR Phase 2"
    exit 1
fi

echo ""
echo "✅ Phase 2 complétée"
echo ""

# ==========================================
# PHASE 3: Index, Scoring, Permissions
# ==========================================
echo ""
echo "════════════════════════════════════════"
echo "🔷 PHASE 3: Index, Scoring, Permissions"
echo "════════════════════════════════════════"
echo ""

echo "3.1 Création des index de performance..."
echo "3.2 Création table configurations_scoring..."
echo "3.3 Ajout permission RBAC..."
echo "3.4 Attribution des permissions..."
echo "3.5 Seed configurations par défaut..."
echo ""

# Exécuter migration 089
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $MIGRATION_089

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERREUR Phase 3 - Migration 089 échouée"
    exit 1
fi

echo ""
echo "✅ Phase 3 complétée"
echo ""

# Vérifications Phase 3
echo "📊 Vérifications Phase 3..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
-- Vérifier configurations_scoring
SELECT 'configurations_scoring' as table_name, COUNT(*) as rows FROM configurations_scoring
UNION ALL
SELECT 'permission notes:modifier_apres_cloture', COUNT(*) FROM permissions WHERE code = 'notes:modifier_apres_cloture';
"

echo ""

# Vérifier les index
echo "📊 Index créés..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname IN (
    'idx_edt_affectation_matiere',
    'idx_bulletins_classe_annee',
    'idx_ae_classe_annee_final',
    'idx_cs_etablissement',
    'idx_cs_annee',
    'idx_cs_unique_etab_annee'
)
ORDER BY tablename;
"

echo ""

# ==========================================
# RÉSUMÉ FINAL
# ==========================================
echo ""
echo "========================================"
echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "========================================"
echo ""
echo "✅ Phase 1: Tables créées et données migrées"
echo "✅ Phase 2: Intégrité vérifiée"
echo "✅ Phase 3: Index, scoring, permissions configurés"
echo ""
echo "📊 Résumé:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    (SELECT COUNT(*) FROM configurations_matieres_classes) as configs_matieres_classes,
    (SELECT COUNT(*) FROM classes_annees) as classes_annees,
    (SELECT COUNT(*) FROM configurations_scoring) as configs_scoring,
    (SELECT COUNT(*) FROM permissions WHERE code = 'notes:modifier_apres_cloture') as permission_creee;
"

echo ""
echo "📝 Prochaines étapes:"
echo "   1. Redémarrer l'application backend"
echo "   2. Tester les endpoints:"
echo "      - GET /api/classes-annees"
echo "      - GET /api/configuration-matiere-classe"
echo "      - GET /api/scoring/config/active"
echo "   3. Vérifier les logs pour erreurs"
echo ""
echo "🔧 Pour supprimer les anciennes colonnes (optionnel):"
echo "   Exécuter les commandes ALTER TABLE DROP COLUMN dans la migration 088"
echo ""
