-- ==================================
-- eLISAschool - Migration 115
-- Description: Rendre postes.fonctionId NOT NULL (le type attendu est dérivé via fonction.typePersonnel)
-- ==================================

-- 1. Backfill : toute fonctionId NULL reçoit la fonction AGENT-COMPTA (par catégorie ADMINISTRATIF)
DO $$
DECLARE
    rec record;
    def_fonction_id uuid;
BEGIN
    FOR rec IN
        SELECT p."id", uo."etablissementId"
        FROM postes p
        JOIN unites_organisationnelles uo ON uo."id" = p."uniteOrganisationnelleId"
        WHERE p."fonctionId" IS NULL
    LOOP
        SELECT f."id" INTO def_fonction_id
        FROM fonctions f
        WHERE f."code" = 'AGENT-COMPTA'
          AND f."etablissementId" = rec."etablissementId"
        LIMIT 1;

        IF def_fonction_id IS NOT NULL THEN
            UPDATE postes SET "fonctionId" = def_fonction_id WHERE id = rec.id;
        END IF;
    END LOOP;
END $$;

-- 2. Vérifier qu'il ne reste plus de NULL
DO $$
DECLARE
    cnt int;
BEGIN
    SELECT COUNT(*) INTO cnt FROM postes WHERE "fonctionId" IS NULL;
    IF cnt > 0 THEN
        RAISE EXCEPTION '% postes ont encore fonctionId=NULL après backfill', cnt;
    END IF;
END $$;

-- 3. Ajouter la contrainte NOT NULL
ALTER TABLE postes
    ALTER COLUMN "fonctionId" SET NOT NULL;
