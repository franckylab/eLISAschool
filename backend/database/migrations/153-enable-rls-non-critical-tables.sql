-- ==================================
-- Migration 153 — Enable RLS on Non-Critical Tables
-- ==================================
-- Phase A.3 — Refonte SaaS v2
-- 
-- Extension progressive des politiques RLS aux tables non-critiques.
-- Migration idempotente — peut être relancée sans erreur.
--
-- Tables ciblées :
--   1. paiements — Paiements financiers
--   2. factures — Factures de facturation
--   3. sondages — Sondages et enquêtes
--   4. factures_fournisseur — Factures fournisseurs
--   5. depenses — Dépenses
--   6. budgets — Budgets
--
-- NOTE : La table `notifications` est exclue car elle n'a pas de colonne
-- `etablissementId` (elle est scopée par utilisateur via `destinataireId`).
-- ==================================

DO $$
DECLARE
    v_super_admin_uuid CONSTANT uuid := '00000000-0000-0000-0000-000000000000'::uuid;
    v_table record;
BEGIN
    -- Liste des tables à activer RLS
    FOR v_table IN
        SELECT unnest(ARRAY[
            'paiements',
            'factures',
            'sondages',
            'factures_fournisseur',
            'depenses',
            'budgets'
        ]) AS table_name
    LOOP
        -- Activer RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', v_table.table_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', v_table.table_name);

        -- Supprimer l'ancienne policy si elle existe
        EXECUTE format(
            'DROP POLICY IF EXISTS rls_%s_tenant ON %I',
            v_table.table_name,
            v_table.table_name
        );

        -- Créer la policy RLS
        EXECUTE format(
            'CREATE POLICY rls_%s_tenant ON %I FOR ALL USING (
                "etablissementId" = current_setting(''app.current_tenant'')::uuid
                OR current_setting(''app.current_tenant'')::uuid = $1
            ) WITH CHECK (
                "etablissementId" = current_setting(''app.current_tenant'')::uuid
                OR current_setting(''app.current_tenant'')::uuid = $1
            )',
            v_table.table_name,
            v_table.table_name
        );

        -- Créer l'index de performance si nécessaire
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_rls_%s_etablissement ON %I("etablissementId")',
            v_table.table_name,
            v_table.table_name
        );

        RAISE NOTICE '✅ RLS activé sur table %', v_table.table_name;
    END LOOP;

    RAISE NOTICE '✅ RLS activé sur 6 tables non-critiques avec bypass SUPER_ADMIN';
END $$;

-- ==========================================
-- Mise à jour des vues de diagnostic
-- ==========================================
DROP VIEW IF EXISTS v_rls_status;
CREATE OR REPLACE VIEW v_rls_status AS
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as rls_forced
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        -- Tables critiques (migration 152)
        'eleves', 'notes', 'bulletins', 'membres_personnel',
        'heures_cours', 'creneaux_horaires', 'absences_personnel',
        'parametres_systeme',
        -- Tables non-critiques (migration 153)
        'paiements', 'factures', 'sondages', 'factures_fournisseur',
        'depenses', 'budgets'
    )
ORDER BY tablename;

DROP VIEW IF EXISTS v_rls_policies;
CREATE OR REPLACE VIEW v_rls_policies AS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'eleves', 'notes', 'bulletins', 'membres_personnel',
        'heures_cours', 'creneaux_horaires', 'absences_personnel',
        'parametres_systeme',
        'paiements', 'factures', 'sondages', 'factures_fournisseur',
        'depenses', 'budgets'
    )
ORDER BY tablename, policyname;
