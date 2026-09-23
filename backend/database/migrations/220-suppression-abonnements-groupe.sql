-- =============================================
-- eLISAschool - Suppression table abonnements_groupe
-- =============================================
-- Suppression brutale, totale, directe (décision grilling R3) :
-- plus de facturation groupe. La dégressivité groupe est calculée
-- au vol (barème membres) et appliquée en ligne REMISE sur chaque
-- facture individuelle. La Vue Consolidée est une agrégation lecture seule.
-- =============================================

DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_name = 'abonnements_groupe';
    RAISE NOTICE 'Table abonnements_groupe présente : %', (v_count > 0);
END $$;

DROP TABLE IF EXISTS "abonnements_groupe" CASCADE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'abonnements_groupe') THEN
        RAISE EXCEPTION 'ERREUR: table abonnements_groupe toujours présente';
    ELSE
        RAISE NOTICE 'OK: table abonnements_groupe supprimée';
    END IF;
END $$;
