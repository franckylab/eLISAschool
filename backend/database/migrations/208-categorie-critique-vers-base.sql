-- ==========================================
-- eLISAschool - Migration 208 : Renommage catégorie CRITIQUE → BASE
-- ==========================================
-- Refonte SaaS v10 — Terminologie positive (meilleures pratiques SaaS)
--
-- Contexte :
--   La catégorie 'CRITIQUE' a une connotation négative. Elle est renommée 'BASE'
--   pour refléter son rôle : modules fondamentaux toujours inclus.
--
-- Changements :
--   1. UPDATE modules_catalogue : categorie 'CRITIQUE' → 'BASE'
--   2. Idempotent : ne fait rien si 'BASE' existe déjà
-- ==========================================

-- 1. Renommer la catégorie dans le catalogue
DO $$
DECLARE
    nb_maj INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_maj FROM modules_catalogue WHERE categorie = 'CRITIQUE';

    IF nb_maj > 0 THEN
        UPDATE modules_catalogue SET categorie = 'BASE' WHERE categorie = 'CRITIQUE';
        RAISE NOTICE '✅ % modules renommés CRITIQUE → BASE', nb_maj;
    ELSE
        RAISE NOTICE 'ℹ️  Aucun module en catégorie CRITIQUE (déjà migré ou inexistant)';
    END IF;
END $$;

-- 2. Vérification
DO $$
DECLARE
    nb_base INTEGER;
    nb_critique INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_base FROM modules_catalogue WHERE categorie = 'BASE';
    SELECT COUNT(*) INTO nb_critique FROM modules_catalogue WHERE categorie = 'CRITIQUE';

    RAISE NOTICE '📊 Résultat : % modules BASE, % modules CRITIQUE restants', nb_base, nb_critique;
END $$;
