-- ==================================
-- eLISAschool — Migration 207: Consolidation Modules SaaS v9
-- ==================================
-- Refonte : suppression des redondances, cohérence ParametreSysteme
-- Nettoyage des entrées orphelines pour les modules désactivés
--
-- Contexte v9 :
--   - marketplace = point d'entrée unique côté tenant
--   - platform.modules = page unifiée (Catalogue + Builder + Résolution)
--   - 6 routes frontend vides supprimées
--   - toggles ON/OFF via PUT /api/billing/marketplace/:code/toggle
-- ==================================

-- 1. Vérifier et nettoyer les paramètres système orphelines
--    (modules qui n'existent plus dans le catalogue)
DO $$
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- Supprimer les paramètres de modules qui ne sont plus dans le catalogue
    -- et qui ne correspondent à aucun module connu du système
    WITH known_modules AS (
        SELECT code FROM modules_catalogue
        UNION
        SELECT unnest(ARRAY[
            'etablissements', 'groupes-etablissements', 'classes', 'matieres',
            'niveaux', 'cycles', 'filieres', 'specialites', 'periodes',
            'eleves', 'responsables-eleves', 'notes', 'bulletins',
            'emploi-du-temps', 'salles', 'personnel', 'contrats', 'paie',
            'finances', 'communication', 'transport', 'bibliotheque',
            'cms', 'organisation', 'examens-nationaux', 'diplomes-eleves',
            'competences', 'recrutement', 'sondages', 'annonces'
        ]) AS code
    )
    DELETE FROM parametres_systeme
    WHERE cle LIKE 'modules.%.actif'
      AND split_part(cle, '.', 2) NOT IN (SELECT code FROM known_modules)
      AND etablissementId IS NOT NULL;

    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RAISE NOTICE 'Migration 207: % paramètres système orphelins nettoyés', cleaned_count;
END $$;

-- 2. Assurer la cohérence des modules critiques
--    Les modules critiques doivent toujours avoir actifParDefaut = true
UPDATE modules_catalogue
SET actifParDefaut = true
WHERE categorie = 'CRITIQUE'
  AND actifParDefaut = false;

-- 3. Index pour optimiser les requêtes de résolution de modules
CREATE INDEX IF NOT EXISTS idx_parametres_systeme_modules_actif
    ON parametres_systeme (etablissementId, cle)
    WHERE cle LIKE 'modules.%.actif';

-- 4. Vérification finale
DO $$
DECLARE
    total_catalogue INTEGER;
    total_params INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_catalogue FROM modules_catalogue WHERE estActif = true;
    SELECT COUNT(DISTINCT etablissementId) INTO total_params
    FROM parametres_systeme
    WHERE cle LIKE 'modules.%.actif' AND etablissementId IS NOT NULL;

    RAISE NOTICE 'Migration 207 terminée: % modules actifs au catalogue, % établissements avec paramètres modules',
        total_catalogue, total_params;
END $$;
