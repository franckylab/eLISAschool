-- ==================================
-- Migration 164 — RLS Généralisé (Lot E v7)
-- ==================================
-- Refonte SaaS v7 — Lot E.1
--
-- Extension des politiques Row-Level Security à TOUTES les tables multi-tenant
-- disposant d'une colonne "etablissementId".
--
-- Approche dynamique : détection automatique via information_schema.
-- Migration idempotente — peut être relancée sans erreur.
--
-- Tables déjà couvertes (migrations 152 + 153) — ignorées :
--   eleves, notes, bulletins, membres_personnel, heures_cours,
--   creneaux_horaires, absences_personnel, parametres_systeme,
--   paiements, factures, sondages, factures_fournisseur, depenses, budgets
--
-- Tables globales EXCLUES (pas de colonne etablissementId) :
--   etablissements, users, roles, permissions, audit_logs,
--   plans_abonnement, modules_catalogue, providers_paiement,
--   provider_assignments, groupes_etablissements, etc.
--
-- Politique :
--   - SUPER_ADMIN bypass via UUID sentinelle '00000000-...'
--   - Autres : filtrage automatique par etablissementId
--   - Tables avec etablissementId NULLABLE : NULL = visible par tous (global)
--
-- ==================================

DO $$
DECLARE
    v_super_admin_uuid CONSTANT uuid := '00000000-0000-0000-0000-000000000000'::uuid;
    v_group_sentinel_uuid CONSTANT uuid := '00000000-0000-0000-0000-000000000001'::uuid;
    v_table record;
    v_has_nullable_etab boolean;
    v_policy_name text;
    v_count integer := 0;
    v_tables_exclus text[] := ARRAY[
        -- Tables déjà couvertes par migrations 152 + 153
        'eleves', 'notes', 'bulletins', 'membres_personnel',
        'heures_cours', 'creneaux_horaires', 'absences_personnel',
        'parametres_systeme', 'paiements', 'factures', 'sondages',
        'factures_fournisseur', 'depenses', 'budgets',
        -- Tables de partitionnement (migration 155 — héritent RLS des parents)
        'eleves_partitioned', 'notes_partitioned', 'bulletins_partitioned',
        'heures_cours_partitioned', 'creneaux_horaires_partitioned',
        'absences_personnel_partitioned', 'paiements_partitioned',
        'factures_partitioned'
    ];
BEGIN
    -- ==========================================
    -- Détection dynamique des tables multi-tenant
    -- ==========================================
    FOR v_table IN
        SELECT DISTINCT
            c.table_name,
            -- Détecter si etablissementId est nullable
            MAX(CASE WHEN c.is_nullable = 'YES' THEN 1 ELSE 0 END)::boolean AS is_nullable
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.column_name = 'etablissementId'
          AND c.table_name != ALL(v_tables_exclus)
          -- Exclure les vues
          AND c.table_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
        GROUP BY c.table_name
        ORDER BY c.table_name
    LOOP
        v_count := v_count + 1;
        v_policy_name := 'rls_' || v_table.table_name || '_tenant';

        -- Activer RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', v_table.table_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', v_table.table_name);

        -- Supprimer l'ancienne policy si elle existe
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I',
            v_policy_name,
            v_table.table_name
        );

        -- Créer la policy RLS adaptée
        -- $1 = SUPER_ADMIN sentinel, $2 = GROUP sentinel (embeddés comme littéraux)
        IF v_table.is_nullable THEN
            -- etablissementId NULLABLE : NULL = global (visible par tous)
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR ALL USING (
                    "etablissementId" IS NULL
                    OR "etablissementId" = current_setting(''app.current_tenant'')::uuid
                    OR current_setting(''app.current_tenant'')::uuid = %L::uuid
                    OR current_setting(''app.current_tenant'')::uuid = %L::uuid
                ) WITH CHECK (
                    current_setting(''app.current_tenant'')::uuid = %L::uuid
                    OR current_setting(''app.current_tenant'')::uuid = %L::uuid
                    OR "etablissementId" = current_setting(''app.current_tenant'')::uuid
                )',
                v_policy_name,
                v_table.table_name,
                v_super_admin_uuid,
                v_group_sentinel_uuid,
                v_super_admin_uuid,
                v_group_sentinel_uuid
            );
        ELSE
            -- etablissementId NOT NULL : isolation stricte
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR ALL USING (
                    "etablissementId" = current_setting(''app.current_tenant'')::uuid
                    OR current_setting(''app.current_tenant'')::uuid = %L::uuid
                    OR current_setting(''app.current_tenant'')::uuid = %L::uuid
                ) WITH CHECK (
                    "etablissementId" = current_setting(''app.current_tenant'')::uuid
                    OR current_setting(''app.current_tenant'')::uuid = %L::uuid
                    OR current_setting(''app.current_tenant'')::uuid = %L::uuid
                )',
                v_policy_name,
                v_table.table_name,
                v_super_admin_uuid,
                v_group_sentinel_uuid,
                v_super_admin_uuid,
                v_group_sentinel_uuid
            );
        END IF;

        -- Index de performance pour le filtrage RLS
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_rls_%s_etablissement ON %I("etablissementId")',
            replace(v_table.table_name, '-', '_'),
            v_table.table_name
        );

        RAISE NOTICE '✅ RLS activé sur table % (nullable=%)', v_table.table_name, v_table.is_nullable;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS généralisé : % nouvelles tables protégées', v_count;
    RAISE NOTICE '========================================';
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
    AND rowsecurity = true
ORDER BY tablename;

COMMENT ON VIEW v_rls_status IS
    'Vue de diagnostic — liste TOUTES les tables avec RLS actif.';

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
ORDER BY tablename, policyname;

COMMENT ON VIEW v_rls_policies IS
    'Vue de diagnostic — liste TOUTES les policies RLS actives.';

-- ==========================================
-- Vue synthétique : tables multi-tenant SANS RLS (devrait être vide)
-- ==========================================
DROP VIEW IF EXISTS v_rls_missing;
CREATE OR REPLACE VIEW v_rls_missing AS
SELECT
    c.table_name,
    c.column_name,
    COALESCE(pt.rowsecurity, false) as rls_enabled
FROM information_schema.columns c
LEFT JOIN pg_tables pt ON pt.tablename = c.table_name AND pt.schemaname = 'public'
WHERE c.table_schema = 'public'
  AND c.column_name = 'etablissementId'
  AND (pt.rowsecurity = false OR pt.rowsecurity IS NULL)
ORDER BY c.table_name;

COMMENT ON VIEW v_rls_missing IS
    'Tables avec etablissementId mais SANS RLS — devrait retourner 0 lignes après migration 164.';
