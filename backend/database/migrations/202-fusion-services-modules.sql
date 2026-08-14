-- =============================================
-- Migration 202 — Fusion des services modules
-- =============================================
-- Suppression de ModuleResolutionService (doublon avec EntitlementService)
-- EntitlementService devient la source unique de vérité pour le gating des modules.
--
-- Changements :
--   1. EntitlementService enrichi : getCatalogue(), isModuleFacturable(),
--      isModuleSouscrit(), getResolvedModules()
--   2. ConfigurationService.isModuleActive() → délégation directe à entitlementService
--   3. billing.controller.ts → toutes les routes utilisent entitlementService
--   4. Endpoint client /modules/catalogue filtré (Faille G1 corrigée)
--   5. Frontend : module-card.tsx → mes-module-card.tsx, ModuleCard.tsx → config-module-card.tsx
--   6. Nettoyage commentaires MODULE_REGISTRY résiduels
--
-- Aucune modification schema DB — pure refactorisation code.
-- =============================================

-- Vérification cohérence modules_catalogue
DO $$
DECLARE
    total_actif INTEGER;
    total_systeme INTEGER;
    total_critique INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_actif FROM modules_catalogue WHERE est_actif = true;
    SELECT COUNT(*) INTO total_systeme FROM modules_catalogue WHERE est_systeme = true;
    SELECT COUNT(*) INTO total_critique FROM modules_catalogue WHERE categorie = 'CRITIQUE';

    RAISE NOTICE 'Migration 202 — Vérification modules_catalogue :';
    RAISE NOTICE '  Total modules actifs : %', total_actif;
    RAISE NOTICE '  Total modules système : %', total_systeme;
    RAISE NOTICE '  Total modules critiques : %', total_critique;

    -- Vérifier que les modules critiques ont bien actifParDefaut = true
    PERFORM id FROM modules_catalogue
    WHERE categorie = 'CRITIQUE' AND actif_par_defaut = false AND est_actif = true;

    IF FOUND THEN
        RAISE NOTICE '  ⚠️  Attention : certains modules CRITIQUES n''ont pas actifParDefaut = true';
        RAISE NOTICE '  Correction automatique en cours...';
        UPDATE modules_catalogue
        SET actif_par_defaut = true
        WHERE categorie = 'CRITIQUE' AND actif_par_defaut = false AND est_actif = true;
        RAISE NOTICE '  ✓ Correction appliquée';
    ELSE
        RAISE NOTICE '  ✓ Cohérence modules critiques OK';
    END IF;
END $$;

-- Index pour optimiser les requêtes fréquentes du catalogue
CREATE INDEX IF NOT EXISTS idx_modules_catalogue_code_actif
    ON modules_catalogue (code) WHERE est_actif = true;

-- Commentaire de documentation
COMMENT ON INDEX idx_modules_catalogue_code_actif IS
    'Migration 202 — Index partiel pour accélérer getCatalogue() et check() dans EntitlementService';
