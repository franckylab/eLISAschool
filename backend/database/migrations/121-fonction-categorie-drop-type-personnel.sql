-- ==================================
-- eLISAschool - Migration 121 : Fonction.categorie + suppression TypePersonnel
-- ==================================
-- Contexte : le personnel est désormais catégorisé via la fonction (Fonction.categorie)
-- et non plus via l'entité TypePersonnel (obsolète).
-- Étapes :
--   1. Ajout fonctions.categorie (varchar 20) + backfill depuis types_personnel
--   2. Snapshot scores_personnel.categorie + backfill regles_scoring_personnel.categorieCible
--   3. Fallback orphelins : fonctions génériques GEN-<CATEGORIE> + membres_fonctions principale
--   4. Index anti-N+1 sur affectations_postes
--   5. Drops : colonnes typePersonnelId, table types_personnel, permission personnel:edit:type
-- SQL idempotent — ré-exécutable sans effet de bord.
-- ==================================

BEGIN;

-- ==================================
-- 1. fonctions.categorie
-- ==================================
ALTER TABLE fonctions ADD COLUMN IF NOT EXISTS categorie varchar(20) NOT NULL DEFAULT 'AUTRE';

-- Backfill depuis types_personnel (code TYPE_X → catégorie X)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'fonctions' AND column_name = 'typePersonnelId')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'types_personnel')
    THEN
        UPDATE fonctions f
        SET categorie = CASE
            WHEN tp.code IN ('TYPE_ENSEIGNANT', 'TYPE_DIRECTION', 'TYPE_ADMINISTRATIF', 'TYPE_TECHNIQUE',
                             'TYPE_SERVICE', 'TYPE_SANTE', 'TYPE_SOCIAL', 'TYPE_AUTRE')
                THEN replace(tp.code, 'TYPE_', '')
            ELSE 'AUTRE'
        END
        FROM types_personnel tp
        WHERE tp.id = f."typePersonnelId"
          AND f.categorie = 'AUTRE';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fonctions_categorie ON fonctions (categorie);

-- ==================================
-- 2. Scoring : snapshot categorie
-- ==================================
ALTER TABLE scores_personnel ADD COLUMN IF NOT EXISTS categorie varchar(20);

DO $$
BEGIN
    -- Backfill snapshot depuis l'ancien typePersonnelId du score
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'scores_personnel' AND column_name = 'typePersonnelId')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'types_personnel')
    THEN
        UPDATE scores_personnel s
        SET categorie = replace(tp.code, 'TYPE_', '')
        FROM types_personnel tp
        WHERE tp.id = s."typePersonnelId"
          AND s.categorie IS NULL;
    END IF;

    -- regles_scoring_personnel : copier typePersonnelCible → categorieCible si vide
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'regles_scoring_personnel' AND column_name = 'typePersonnelCible')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'types_personnel')
    THEN
        UPDATE regles_scoring_personnel r
        SET "categorieCible" = replace(tp.code, 'TYPE_', '')
        FROM types_personnel tp
        WHERE tp.id::text = r."typePersonnelCible"::text
          AND r."categorieCible" IS NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scores_personnel_categorie ON scores_personnel (categorie);
CREATE INDEX IF NOT EXISTS idx_scores_personnel_categorie_score ON scores_personnel (categorie, "scoreGlobal");

-- ==================================
-- 3. Fallback orphelins : membres avec typePersonnelId mais sans fonction active ni affectation ACTIF
-- ==================================
DO $$
DECLARE
    membre RECORD;
    v_fonction_id uuid;
    v_categorie varchar(20);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'membres_personnel' AND column_name = 'typePersonnelId')
       OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'types_personnel')
    THEN
        RETURN;
    END IF;

    FOR membre IN
        SELECT mp.id, mp."etablissementId", tp.code AS type_code
        FROM membres_personnel mp
        JOIN types_personnel tp ON tp.id = mp."typePersonnelId"
        WHERE NOT EXISTS (
            SELECT 1 FROM membres_fonctions mf
            WHERE mf."membrePersonnelId" = mp.id
              AND (mf."dateFin" IS NULL OR mf."dateFin" >= CURRENT_DATE)
        )
        AND NOT EXISTS (
            SELECT 1 FROM affectations_postes ap
            WHERE ap."membrePersonnelId" = mp.id AND ap.statut = 'ACTIF'
        )
    LOOP
        v_categorie := CASE
            WHEN membre.type_code IN ('TYPE_ENSEIGNANT', 'TYPE_DIRECTION', 'TYPE_ADMINISTRATIF', 'TYPE_TECHNIQUE',
                                      'TYPE_SERVICE', 'TYPE_SANTE', 'TYPE_SOCIAL', 'TYPE_AUTRE')
                THEN replace(membre.type_code, 'TYPE_', '')
            ELSE 'AUTRE'
        END;

        -- Fonction générique GEN-<CATEGORIE> par établissement (créée au besoin)
        SELECT id INTO v_fonction_id
        FROM fonctions
        WHERE code = 'GEN-' || v_categorie
          AND "etablissementId" = membre."etablissementId";

        IF v_fonction_id IS NULL THEN
            INSERT INTO fonctions (id, code, nom, description, categorie, "estSysteme", actif, "etablissementId", "createdAt", "updatedAt")
            VALUES (
                gen_random_uuid(),
                'GEN-' || v_categorie,
                'Fonction générique ' || initcap(lower(v_categorie)),
                'Fonction générique créée automatiquement lors de la migration TypePersonnel → Fonction.categorie',
                v_categorie,
                true,
                true,
                membre."etablissementId",
                now(),
                now()
            )
            RETURNING id INTO v_fonction_id;
        END IF;

        INSERT INTO membres_fonctions (id, "membrePersonnelId", "fonctionId", "dateDebut", "estPrincipale", "etablissementId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), membre.id, v_fonction_id, CURRENT_DATE, true, membre."etablissementId", now(), now());
    END LOOP;
END $$;

-- ==================================
-- 4. Index anti-N+1 (dérivation catégorie via affectations)
-- ==================================
CREATE INDEX IF NOT EXISTS idx_affectations_membre_statut
    ON affectations_postes ("membrePersonnelId", statut);

-- ==================================
-- 5. Drops
-- ==================================
ALTER TABLE fonctions DROP COLUMN IF EXISTS "typePersonnelId";
ALTER TABLE membres_personnel DROP COLUMN IF EXISTS "typePersonnelId";
ALTER TABLE scores_personnel DROP COLUMN IF EXISTS "typePersonnelId";
ALTER TABLE regles_scoring_personnel DROP COLUMN IF EXISTS "typePersonnelCible";

DROP TABLE IF EXISTS types_personnel CASCADE;

-- Permission obsolète (le type n'est plus éditable — la catégorie est dérivée)
DELETE FROM role_permissions
WHERE "permissionId" IN (SELECT id FROM permissions WHERE code = 'personnel:edit:type');
DELETE FROM permissions WHERE code = 'personnel:edit:type';

COMMIT;
