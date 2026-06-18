/**
 * ==================================
 * eLISAschool - Migration 072: Scoping Cycles et Niveaux par établissement
 * ==================================
 * 
 * Ajoute etablissementId aux tables cycles et niveaux pour le multi-tenant.
 * Duplique les données existantes (une copie par établissement).
 * Transforme les contraintes UNIQUE globales en UNIQUE composites.
 * 
 * Migration idempotente (peut être rejouée sans erreur).
 */

DO $$
DECLARE
    v_etab RECORD;
    v_old_cycle RECORD;
    v_old_niveau RECORD;
    v_new_cycle_id UUID;
    v_cycle_mapping RECORD;
BEGIN
    RAISE NOTICE '=== MIGRATION 072: Scoping Cycles + Niveaux ===';

    -- ==========================================
    -- ÉTAPE 1: Ajouter etablissementId (nullable temporairement) à cycles
    -- ==========================================
    RAISE NOTICE 'Étape 1/7: Ajout colonne etablissementId sur cycles...';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cycles' AND column_name = 'etablissementId'
    ) THEN
        ALTER TABLE "cycles" ADD COLUMN "etablissementId" UUID;
        RAISE NOTICE '  ✓ Colonne etablissementId ajoutée sur cycles';
    ELSE
        RAISE NOTICE '  - Colonne etablissementId existe déjà sur cycles';
    END IF;

    -- ==========================================
    -- ÉTAPE 2: Ajouter etablissementId (nullable temporairement) à niveaux
    -- ==========================================
    RAISE NOTICE 'Étape 2/7: Ajout colonne etablissementId sur niveaux...';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'niveaux' AND column_name = 'etablissementId'
    ) THEN
        ALTER TABLE "niveaux" ADD COLUMN "etablissementId" UUID;
        RAISE NOTICE '  ✓ Colonne etablissementId ajoutée sur niveaux';
    ELSE
        RAISE NOTICE '  - Colonne etablissementId existe déjà sur niveaux';
    END IF;

    -- ==========================================
    -- ÉTAPE 3: Dupliquer les cycles existants pour chaque établissement
    -- ==========================================
    RAISE NOTICE 'Étape 3/7: Duplication des cycles par établissement...';
    
    FOR v_etab IN SELECT id FROM etablissements WHERE actif = true LOOP
        FOR v_old_cycle IN SELECT * FROM "cycles" WHERE "etablissementId" IS NULL LOOP
            -- Vérifier si ce cycle existe déjà pour cet établissement
            IF NOT EXISTS (
                SELECT 1 FROM "cycles" 
                WHERE code = v_old_cycle.code AND "etablissementId" = v_etab.id
            ) THEN
                INSERT INTO "cycles" (id, nom, code, description, ordre, dureeannees, diplomesanctionnant, actif, "etablissementId", "createdAt", "updatedAt")
                VALUES (
                    gen_random_uuid(),
                    v_old_cycle.nom,
                    v_old_cycle.code,
                    v_old_cycle.description,
                    v_old_cycle.ordre,
                    v_old_cycle.dureeannees,
                    v_old_cycle.diplomesanctionnant,
                    v_old_cycle.actif,
                    v_etab.id,
                    NOW(),
                    NOW()
                )
                ON CONFLICT DO NOTHING;
                RAISE NOTICE '  ✓ Cycle % dupliqué pour établissement %', v_old_cycle.code, v_etab.id;
            END IF;
        END LOOP;
    END LOOP;

    -- ==========================================
    -- ÉTAPE 4: Mettre à jour les FK cycleId dans niveaux
    -- pour pointer vers les nouveaux cycles scopés
    -- ==========================================
    RAISE NOTICE 'Étape 4/7: Mise à jour des FK cycleId dans niveaux...';
    
    FOR v_etab IN SELECT id FROM etablissements WHERE actif = true LOOP
        -- Dupliquer les niveaux pour cet établissement
        FOR v_old_niveau IN 
            SELECT n.* FROM "niveaux" n 
            WHERE n."etablissementId" IS NULL 
        LOOP
            -- Trouver le cycle scopé correspondant
            SELECT id INTO v_new_cycle_id FROM "cycles" 
            WHERE code = (SELECT code FROM "cycles" WHERE id = v_old_niveau."cycleId") 
            AND "etablissementId" = v_etab.id;
            
            IF v_new_cycle_id IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM "niveaux"
                    WHERE code = v_old_niveau.code 
                    AND "sousSysteme" = v_old_niveau."sousSysteme"
                    AND "etablissementId" = v_etab.id
                ) THEN
                    INSERT INTO "niveaux" (id, nom, code, "cycleId", "examenNationalId", "estClasseExamen", "sousSysteme", ordre, actif, "etablissementId", "createdAt", "updatedAt")
                    VALUES (
                        gen_random_uuid(),
                        v_old_niveau.nom,
                        v_old_niveau.code,
                        v_new_cycle_id,
                        v_old_niveau."examenNationalId",
                        v_old_niveau."estClasseExamen",
                        v_old_niveau."sousSysteme",
                        v_old_niveau.ordre,
                        v_old_niveau.actif,
                        v_etab.id,
                        NOW(),
                        NOW()
                    )
                    ON CONFLICT DO NOTHING;
                    RAISE NOTICE '  ✓ Niveau % dupliqué pour établissement % (cycle: %)', v_old_niveau.code, v_etab.id, v_new_cycle_id;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    -- ==========================================
    -- ÉTAPE 5: Mettre à jour les FK dans les tables dépendantes
    -- (classes, filieres, frais_scolarite, competences, matieres_niveaux, etc.)
    -- pour pointer vers les nouveaux IDs scopés
    -- ==========================================
    RAISE NOTICE 'Étape 5/7: Mise à jour des FK dans les tables dépendantes...';
    
    FOR v_etab IN SELECT id FROM etablissements WHERE actif = true LOOP
        -- classes.niveauId → pointer vers le niveau scopé de cet établissement
        UPDATE "classes" c
        SET "niveauId" = new_n.id
        FROM "niveaux" old_n, "niveaux" new_n
        WHERE c."niveauId" = old_n.id
        AND old_n."etablissementId" IS NULL
        AND new_n.code = old_n.code
        AND new_n."sousSysteme" = old_n."sousSysteme"
        AND new_n."etablissementId" = v_etab.id
        AND c."etablissementId" = v_etab.id;

        -- filieres.cycleId → pointer vers le cycle scopé de cet établissement
        UPDATE "filieres" f
        SET "cycleId" = new_c.id
        FROM "cycles" old_c, "cycles" new_c
        WHERE f."cycleId" = old_c.id
        AND old_c."etablissementId" IS NULL
        AND new_c.code = old_c.code
        AND new_c."etablissementId" = v_etab.id
        AND f."etablissementId" = v_etab.id;

        -- frais_scolarite.cycleId → pointer vers le cycle scopé
        UPDATE "frais_scolarite" fs
        SET "cycleId" = new_c.id
        FROM "cycles" old_c, "cycles" new_c
        WHERE fs."cycleId" = old_c.id
        AND old_c."etablissementId" IS NULL
        AND new_c.code = old_c.code
        AND new_c."etablissementId" = v_etab.id
        AND fs."etablissementId" = v_etab.id;

        -- frais_scolarite.niveauId → pointer vers le niveau scopé
        UPDATE "frais_scolarite" fs
        SET "niveauId" = new_n.id
        FROM "niveaux" old_n, "niveaux" new_n
        WHERE fs."niveauId" = old_n.id
        AND old_n."etablissementId" IS NULL
        AND new_n.code = old_n.code
        AND new_n."sousSysteme" = old_n."sousSysteme"
        AND new_n."etablissementId" = v_etab.id
        AND fs."etablissementId" = v_etab.id;

        -- competences.niveauId → pointer vers le niveau scopé
        UPDATE "competences" comp
        SET "niveauId" = new_n.id
        FROM "niveaux" old_n, "niveaux" new_n
        WHERE comp."niveauId" = old_n.id
        AND old_n."etablissementId" IS NULL
        AND new_n.code = old_n.code
        AND new_n."sousSysteme" = old_n."sousSysteme"
        AND new_n."etablissementId" = v_etab.id
        AND comp."etablissementId" = v_etab.id;

        -- matieres_niveaux.niveauId → pointer vers le niveau scopé
        -- (pas d'etablissementId sur matieres_niveaux, on utilise la matière parente)
        UPDATE "matieres_niveaux" mn
        SET "niveauId" = new_n.id
        FROM "niveaux" old_n, "niveaux" new_n
        WHERE mn."niveauId" = old_n.id
        AND old_n."etablissementId" IS NULL
        AND new_n.code = old_n.code
        AND new_n."sousSysteme" = old_n."sousSysteme"
        AND new_n."etablissementId" = v_etab.id;

        -- remises.cycleId → pointer vers le cycle scopé
        UPDATE "remises" r
        SET "cycleId" = new_c.id
        FROM "cycles" old_c, "cycles" new_c
        WHERE r."cycleId" = old_c.id
        AND old_c."etablissementId" IS NULL
        AND new_c.code = old_c.code
        AND new_c."etablissementId" = v_etab.id
        AND r."etablissementId" = v_etab.id;

        RAISE NOTICE '  ✓ FK mises à jour pour établissement %', v_etab.id;
    END LOOP;

    -- ==========================================
    -- ÉTAPE 6: Supprimer les anciennes lignes globales (etablissementId IS NULL)
    -- ==========================================
    RAISE NOTICE 'Étape 6/7: Suppression des anciennes lignes globales...';

    -- D'abord, supprimer les références dans examens_nationaux
    DELETE FROM "examens_nationaux" WHERE "niveauId" IN (
        SELECT id FROM "niveaux" WHERE "etablissementId" IS NULL
    );
    RAISE NOTICE '  ✓ Références examens_nationaux supprimées';

    -- Supprimer d'abord les niveaux globaux (dépendent des cycles)
    DELETE FROM "niveaux" WHERE "etablissementId" IS NULL;
    RAISE NOTICE '  ✓ Anciens niveaux globaux supprimés';

    -- Puis les cycles globaux
    DELETE FROM "cycles" WHERE "etablissementId" IS NULL;
    RAISE NOTICE '  ✓ Anciens cycles globaux supprimés';

    -- ==========================================
    -- ÉTAPE 7: Rendre etablissementId NOT NULL + index composites
    -- ==========================================
    RAISE NOTICE 'Étape 7/7: Contraintes NOT NULL et index composites...';

    -- Cycles: NOT NULL
    ALTER TABLE "cycles" ALTER COLUMN "etablissementId" SET NOT NULL;
    
    -- Cycles: FK vers etablissements
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_cycles_etablissementId'
    ) THEN
        ALTER TABLE "cycles" ADD CONSTRAINT "FK_cycles_etablissementId" 
            FOREIGN KEY ("etablissementId") REFERENCES "etablissements"(id) ON DELETE CASCADE;
    END IF;

    -- Cycles: Supprimer les anciennes contraintes UNIQUE globales
    ALTER TABLE "cycles" DROP CONSTRAINT IF EXISTS "UQ_cycles_nom";
    ALTER TABLE "cycles" DROP CONSTRAINT IF EXISTS "UQ_cycles_code";
    -- Les anciennes contraintes unique: true de TypeORM créent des index nommés différemment
    DROP INDEX IF EXISTS "IDX_cycles_nom";
    DROP INDEX IF EXISTS "IDX_cycles_code";

    -- Cycles: Créer les index composites uniques
    CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cycles_code_etablissementId" ON "cycles" (code, "etablissementId");
    CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cycles_nom_etablissementId" ON "cycles" (nom, "etablissementId");
    CREATE INDEX IF NOT EXISTS "IDX_cycles_etablissementId" ON "cycles" ("etablissementId");

    -- Niveaux: NOT NULL
    ALTER TABLE "niveaux" ALTER COLUMN "etablissementId" SET NOT NULL;
    
    -- Niveaux: FK vers etablissements
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_niveaux_etablissementId'
    ) THEN
        ALTER TABLE "niveaux" ADD CONSTRAINT "FK_niveaux_etablissementId" 
            FOREIGN KEY ("etablissementId") REFERENCES "etablissements"(id) ON DELETE CASCADE;
    END IF;

    -- Niveaux: Créer les index composites
    CREATE INDEX IF NOT EXISTS "IDX_niveaux_etablissementId" ON "niveaux" ("etablissementId");
    CREATE INDEX IF NOT EXISTS "IDX_niveaux_cycleId_etablissementId" ON "niveaux" ("cycleId", "etablissementId");
    CREATE UNIQUE INDEX IF NOT EXISTS "IDX_niveaux_code_sousSysteme_etablissementId" ON "niveaux" (code, "sousSysteme", "etablissementId");

    RAISE NOTICE '  ✓ Contraintes et index créés';

    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION 072 TERMINÉE AVEC SUCCÈS ===';
END $$;
