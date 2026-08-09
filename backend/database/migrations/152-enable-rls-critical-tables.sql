-- ==================================
-- Migration 152 — Enable RLS on Critical Tables
-- ==================================
-- Phase A.1 — Refonte SaaS v2
-- 
-- Defense-in-depth : Active les politiques Row-Level Security sur les 8 tables
-- critiques comme couche de sécurité supplémentaire. Même si le code applicatif
-- a un bug, la DB refuse les accès cross-tenant.
--
-- Tables ciblées :
--   1. eleves
--   2. notes
--   3. bulletins
--   4. membres_personnel
--   5. heures_cours
--   6. creneaux_horaires
--   7. absences_personnel
--   8. parametres_systeme (nullable — global params)
--
-- Fonctionnement :
--   - SUPER_ADMIN : app.current_tenant = '00000000-0000-0000-0000-000000000000' → bypass
--   - Autres : filtrage automatique par "etablissementId"
--
-- Migration idempotente — peut être relancée sans erreur.
-- ==================================

-- Fonction helper pour définir le contexte tenant (utilisée par le middleware RLS)
CREATE OR REPLACE FUNCTION set_tenant(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_tenant(uuid) IS 
    'Définit le contexte tenant pour la transaction courante. Appelée par le middleware RLS.';

-- Fonction helper pour récupérer le tenant courant
CREATE OR REPLACE FUNCTION current_tenant()
RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(
        current_setting('app.current_tenant', true),
        ''
    )::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION current_tenant() IS 
    'Retourne l''UUID du tenant courant. NULL si non défini.';

-- UUID sentinelle pour le SUPER_ADMIN (bypass RLS)
-- Doit correspondre à la constante SUPER_ADMIN_TENANT dans rls.middleware.ts
DO $$
DECLARE
    v_super_admin_uuid CONSTANT uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
    -- ==========================================
    -- 1. eleves — Élèves scolarisés
    -- ==========================================
    EXECUTE 'ALTER TABLE eleves ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE eleves FORCE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS rls_eleves_tenant ON eleves;
    CREATE POLICY rls_eleves_tenant ON eleves
        FOR ALL
        USING (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        )
        WITH CHECK (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        );

    -- ==========================================
    -- 2. notes — Notes académiques
    -- ==========================================
    EXECUTE 'ALTER TABLE notes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE notes FORCE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS rls_notes_tenant ON notes;
    CREATE POLICY rls_notes_tenant ON notes
        FOR ALL
        USING (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        )
        WITH CHECK (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        );

    -- ==========================================
    -- 3. bulletins — Bulletins scolaires
    -- ==========================================
    EXECUTE 'ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE bulletins FORCE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS rls_bulletins_tenant ON bulletins;
    CREATE POLICY rls_bulletins_tenant ON bulletins
        FOR ALL
        USING (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        )
        WITH CHECK (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        );

    -- ==========================================
    -- 4. membres_personnel — Personnel de l'établissement
    -- ==========================================
    EXECUTE 'ALTER TABLE membres_personnel ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE membres_personnel FORCE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS rls_membres_personnel_tenant ON membres_personnel;
    CREATE POLICY rls_membres_personnel_tenant ON membres_personnel
        FOR ALL
        USING (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        )
        WITH CHECK (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        );

    -- ==========================================
    -- 5. heures_cours — Heures de cours (emploi du temps)
    -- ==========================================
    EXECUTE 'ALTER TABLE heures_cours ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE heures_cours FORCE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS rls_heures_cours_tenant ON heures_cours;
    CREATE POLICY rls_heures_cours_tenant ON heures_cours
        FOR ALL
        USING (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        )
        WITH CHECK (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        );

    -- ==========================================
    -- 6. creneaux_horaires — Créneaux horaires
    -- ==========================================
    EXECUTE 'ALTER TABLE creneaux_horaires ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE creneaux_horaires FORCE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS rls_creneaux_horaires_tenant ON creneaux_horaires;
    CREATE POLICY rls_creneaux_horaires_tenant ON creneaux_horaires
        FOR ALL
        USING (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        )
        WITH CHECK (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        );

    -- ==========================================
    -- 7. absences_personnel — Absences du personnel
    -- ==========================================
    EXECUTE 'ALTER TABLE absences_personnel ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE absences_personnel FORCE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS rls_absences_personnel_tenant ON absences_personnel;
    CREATE POLICY rls_absences_personnel_tenant ON absences_personnel
        FOR ALL
        USING (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        )
        WITH CHECK (
            "etablissementId" = current_setting('app.current_tenant')::uuid
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        );

    -- ==========================================
    -- 8. parametres_systeme — Paramètres de configuration
    -- ==========================================
    -- NOTE : etablissementId est NULLABLE ici.
    -- NULL = paramètre global (visible par tous les tenants).
    -- UUID = override spécifique à un établissement.
    EXECUTE 'ALTER TABLE parametres_systeme ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE parametres_systeme FORCE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS rls_parametres_systeme_tenant ON parametres_systeme;
    CREATE POLICY rls_parametres_systeme_tenant ON parametres_systeme
        FOR ALL
        USING (
            -- Paramètres globaux (etablissementId IS NULL) visibles par tous
            "etablissementId" IS NULL
            -- Paramètres scopés à l'établissement courant
            OR "etablissementId" = current_setting('app.current_tenant')::uuid
            -- SUPER_ADMIN voit tout
            OR current_setting('app.current_tenant')::uuid = v_super_admin_uuid
        )
        WITH CHECK (
            -- Seul le SUPER_ADMIN peut modifier les paramètres globaux
            current_setting('app.current_tenant')::uuid = v_super_admin_uuid
            -- Ou les paramètres de son propre établissement
            OR "etablissementId" = current_setting('app.current_tenant')::uuid
        );

    RAISE NOTICE '✅ RLS activé sur 8 tables critiques avec bypass SUPER_ADMIN';
END $$;

-- ==========================================
-- Index de performance pour le RLS
-- ==========================================
-- Ces index accélèrent le filtrage RLS sur les tables qui n'en ont pas encore
CREATE INDEX IF NOT EXISTS idx_rls_eleves_etablissement ON eleves("etablissementId");
CREATE INDEX IF NOT EXISTS idx_rls_notes_etablissement ON notes("etablissementId");
CREATE INDEX IF NOT EXISTS idx_rls_bulletins_etablissement ON bulletins("etablissementId");
CREATE INDEX IF NOT EXISTS idx_rls_membres_personnel_etablissement ON membres_personnel("etablissementId");
CREATE INDEX IF NOT EXISTS idx_rls_heures_cours_etablissement ON heures_cours("etablissementId");
CREATE INDEX IF NOT EXISTS idx_rls_creneaux_horaires_etablissement ON creneaux_horaires("etablissementId");
CREATE INDEX IF NOT EXISTS idx_rls_absences_personnel_etablissement ON absences_personnel("etablissementId");
CREATE INDEX IF NOT EXISTS idx_rls_parametres_systeme_etablissement ON parametres_systeme("etablissementId");

-- ==========================================
-- Vues de diagnostic RLS
-- ==========================================
-- Vue pour vérifier le statut RLS des tables
CREATE OR REPLACE VIEW v_rls_status AS
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as rls_forced
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'eleves', 'notes', 'bulletins', 'membres_personnel',
        'heures_cours', 'creneaux_horaires', 'absences_personnel',
        'parametres_systeme'
    )
ORDER BY tablename;

COMMENT ON VIEW v_rls_status IS 
    'Vue de diagnostic — vérifie le statut RLS des tables critiques.';

-- Vue pour lister les policies actives
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
        'parametres_systeme'
    )
ORDER BY tablename, policyname;

COMMENT ON VIEW v_rls_policies IS 
    'Vue de diagnostic — liste les policies RLS actives sur les tables critiques.';
