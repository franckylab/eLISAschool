-- ==================================
-- eLISAschool - Partitionnement Hash par etablissementId
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Phase H.1 — Refonte SaaS v3
-- Partitionnement HASH sur 16 partitions pour les tables à fort volume.
-- Améliore les performances des requêtes multi-tenant en distribuant
-- les données uniformément sur les partitions.
--
-- Tables ciblées : eleves, notes, bulletins, heures_cours,
--   creneaux_horaires, absences_personnel, paiements, factures
--
-- IMPORTANT : Le partitionnement est transparent pour l'application.
-- PostgreSQL redirige automatiquement les INSERT/SELECT vers la bonne
-- partition selon la valeur de "etablissementId".
--
-- Prérequis : Migrations 152-153 (RLS) déjà appliquées.

-- =============================================
-- 1. ELEVES — Table à plus fort volume
-- =============================================

DO $$
BEGIN
    -- Vérifier si la table n'est pas déjà partitionnée
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'eleves'::regclass
    ) THEN
        -- Créer la table partitionnée (copie de structure)
        EXECUTE '
            CREATE TABLE eleves_partitioned (
                LIKE eleves INCLUDING ALL
            ) PARTITION BY HASH ("etablissementId")';

        -- Créer 16 partitions
        FOR i IN 0..15 LOOP
            EXECUTE format(
                'CREATE TABLE eleves_p%s PARTITION OF eleves_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
                i, i
            );
        END LOOP;

        -- Migrer les données
        EXECUTE 'INSERT INTO eleves_partitioned SELECT * FROM eleves';

        -- Index sur les partitions
        FOR i IN 0..15 LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_eleves_p%s_etab ON eleves_p%s ("etablissementId")', i, i);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_eleves_p%s_classe ON eleves_p%s ("classeId")', i, i);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_eleves_p%s_annee ON eleves_p%s ("anneeScolaireId")', i, i);
        END LOOP;

        -- Swap : renommer l'ancienne table, puis la nouvelle
        ALTER TABLE eleves RENAME TO eleves_legacy;
        ALTER TABLE eleves_partitioned RENAME TO eleves;

        -- Recréer les contraintes FK (si nécessaire)
        -- Les FK referencing eleves doivent être recréées
        RAISE NOTICE 'Partitionnement eleves terminé (16 partitions)';
    END IF;
END $$;

-- =============================================
-- 2. NOTES — Volume élevé (notes × élèves × matières)
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'notes'::regclass
    ) THEN
        EXECUTE '
            CREATE TABLE notes_partitioned (
                LIKE notes INCLUDING ALL
            ) PARTITION BY HASH ("etablissementId")';

        FOR i IN 0..15 LOOP
            EXECUTE format(
                'CREATE TABLE notes_p%s PARTITION OF notes_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
                i, i
            );
        END LOOP;

        EXECUTE 'INSERT INTO notes_partitioned SELECT * FROM notes';

        FOR i IN 0..15 LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_notes_p%s_etab ON notes_p%s ("etablissementId")', i, i);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_notes_p%s_eleve ON notes_p%s ("eleveId")', i, i);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_notes_p%s_periode ON notes_p%s ("periodeId")', i, i);
        END LOOP;

        ALTER TABLE notes RENAME TO notes_legacy;
        ALTER TABLE notes_partitioned RENAME TO notes;

        RAISE NOTICE 'Partitionnement notes terminé (16 partitions)';
    END IF;
END $$;

-- =============================================
-- 3. BULLETINS
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'bulletins'::regclass
    ) THEN
        EXECUTE '
            CREATE TABLE bulletins_partitioned (
                LIKE bulletins INCLUDING ALL
            ) PARTITION BY HASH ("etablissementId")';

        FOR i IN 0..15 LOOP
            EXECUTE format(
                'CREATE TABLE bulletins_p%s PARTITION OF bulletins_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
                i, i
            );
        END LOOP;

        EXECUTE 'INSERT INTO bulletins_partitioned SELECT * FROM bulletins';

        FOR i IN 0..15 LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_bulletins_p%s_etab ON bulletins_p%s ("etablissementId")', i, i);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_bulletins_p%s_eleve ON bulletins_p%s ("eleveId")', i, i);
        END LOOP;

        ALTER TABLE bulletins RENAME TO bulletins_legacy;
        ALTER TABLE bulletins_partitioned RENAME TO bulletins;

        RAISE NOTICE 'Partitionnement bulletins terminé (16 partitions)';
    END IF;
END $$;

-- =============================================
-- 4. HEURES_COURS
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'heures_cours'::regclass
    ) THEN
        EXECUTE '
            CREATE TABLE heures_cours_partitioned (
                LIKE heures_cours INCLUDING ALL
            ) PARTITION BY HASH ("etablissementId")';

        FOR i IN 0..15 LOOP
            EXECUTE format(
                'CREATE TABLE heures_cours_p%s PARTITION OF heures_cours_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
                i, i
            );
        END LOOP;

        EXECUTE 'INSERT INTO heures_cours_partitioned SELECT * FROM heures_cours';

        FOR i IN 0..15 LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_heures_cours_p%s_etab ON heures_cours_p%s ("etablissementId")', i, i);
        END LOOP;

        ALTER TABLE heures_cours RENAME TO heures_cours_legacy;
        ALTER TABLE heures_cours_partitioned RENAME TO heures_cours;

        RAISE NOTICE 'Partitionnement heures_cours terminé (16 partitions)';
    END IF;
END $$;

-- =============================================
-- 5. CRENEAUX_HORAIRES
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'creneaux_horaires'::regclass
    ) THEN
        EXECUTE '
            CREATE TABLE creneaux_horaires_partitioned (
                LIKE creneaux_horaires INCLUDING ALL
            ) PARTITION BY HASH ("etablissementId")';

        FOR i IN 0..15 LOOP
            EXECUTE format(
                'CREATE TABLE creneaux_horaires_p%s PARTITION OF creneaux_horaires_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
                i, i
            );
        END LOOP;

        EXECUTE 'INSERT INTO creneaux_horaires_partitioned SELECT * FROM creneaux_horaires';

        FOR i IN 0..15 LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_creneaux_p%s_etab ON creneaux_horaires_p%s ("etablissementId")', i, i);
        END LOOP;

        ALTER TABLE creneaux_horaires RENAME TO creneaux_horaires_legacy;
        ALTER TABLE creneaux_horaires_partitioned RENAME TO creneaux_horaires;

        RAISE NOTICE 'Partitionnement creneaux_horaires terminé (16 partitions)';
    END IF;
END $$;

-- =============================================
-- 6. ABSENCES_PERSONNEL
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'absences_personnel'::regclass
    ) THEN
        EXECUTE '
            CREATE TABLE absences_personnel_partitioned (
                LIKE absences_personnel INCLUDING ALL
            ) PARTITION BY HASH ("etablissementId")';

        FOR i IN 0..15 LOOP
            EXECUTE format(
                'CREATE TABLE absences_personnel_p%s PARTITION OF absences_personnel_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
                i, i
            );
        END LOOP;

        EXECUTE 'INSERT INTO absences_personnel_partitioned SELECT * FROM absences_personnel';

        FOR i IN 0..15 LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_absences_p%s_etab ON absences_personnel_p%s ("etablissementId")', i, i);
        END LOOP;

        ALTER TABLE absences_personnel RENAME TO absences_personnel_legacy;
        ALTER TABLE absences_personnel_partitioned RENAME TO absences_personnel;

        RAISE NOTICE 'Partitionnement absences_personnel terminé (16 partitions)';
    END IF;
END $$;

-- =============================================
-- 7. PAIEMENTS
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'paiements'::regclass
    ) THEN
        EXECUTE '
            CREATE TABLE paiements_partitioned (
                LIKE paiements INCLUDING ALL
            ) PARTITION BY HASH ("etablissementId")';

        FOR i IN 0..15 LOOP
            EXECUTE format(
                'CREATE TABLE paiements_p%s PARTITION OF paiements_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
                i, i
            );
        END LOOP;

        EXECUTE 'INSERT INTO paiements_partitioned SELECT * FROM paiements';

        FOR i IN 0..15 LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_paiements_p%s_etab ON paiements_p%s ("etablissementId")', i, i);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_paiements_p%s_eleve ON paiements_p%s ("eleveId")', i, i);
        END LOOP;

        ALTER TABLE paiements RENAME TO paiements_legacy;
        ALTER TABLE paiements_partitioned RENAME TO paiements;

        RAISE NOTICE 'Partitionnement paiements terminé (16 partitions)';
    END IF;
END $$;

-- =============================================
-- 8. FACTURES (Phase facturation OHADA)
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'factures'::regclass
    ) THEN
        EXECUTE '
            CREATE TABLE factures_partitioned (
                LIKE factures INCLUDING ALL
            ) PARTITION BY HASH ("etablissementId")';

        FOR i IN 0..15 LOOP
            EXECUTE format(
                'CREATE TABLE factures_p%s PARTITION OF factures_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
                i, i
            );
        END LOOP;

        EXECUTE 'INSERT INTO factures_partitioned SELECT * FROM factures';

        FOR i IN 0..15 LOOP
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_factures_p%s_etab ON factures_p%s ("etablissementId")', i, i);
        END LOOP;

        ALTER TABLE factures RENAME TO factures_legacy;
        ALTER TABLE factures_partitioned RENAME TO factures;

        RAISE NOTICE 'Partitionnement factures terminé (16 partitions)';
    END IF;
END $$;

-- =============================================
-- 9. NETTOYAGE — Supprimer les tables legacy
-- =============================================
-- Décommenter après vérification des données migrées :
-- DROP TABLE IF EXISTS eleves_legacy;
-- DROP TABLE IF EXISTS notes_legacy;
-- DROP TABLE IF EXISTS bulletins_legacy;
-- DROP TABLE IF EXISTS heures_cours_legacy;
-- DROP TABLE IF EXISTS creneaux_horaires_legacy;
-- DROP TABLE IF EXISTS absences_personnel_legacy;
-- DROP TABLE IF EXISTS paiements_legacy;
-- DROP TABLE IF EXISTS factures_legacy;

-- =============================================
-- 10. STATISTIQUES — Vérification
-- =============================================

-- Vue de monitoring des partitions
CREATE OR REPLACE VIEW v_partition_stats AS
SELECT
    parent.relname AS table_parent,
    child.relname AS partition,
    pg_size_pretty(pg_relation_size(child.oid)) AS taille,
    (SELECT count(*) FROM pg_class c WHERE c.relname = child.relname) AS existe
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname IN ('eleves', 'notes', 'bulletins', 'heures_cours',
                         'creneaux_horaires', 'absences_personnel', 'paiements', 'factures')
ORDER BY parent.relname, child.relname;
