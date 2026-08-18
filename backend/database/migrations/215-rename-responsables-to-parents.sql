-- ==================================
-- eLISAschool - Migration 215
-- ==================================
-- Renommage module responsables-eleves → parents
-- Table: responsables_eleves → parents
-- Version: 3.0.0
-- Auteur: franck arlos chendjou
-- ==================================

BEGIN;

-- ==================================
-- 1. Renommer la table (ou migrer données si parents existe déjà via synchronize)
-- ==================================
DO $$
DECLARE
    old_exists boolean;
    new_exists boolean;
    row_count integer;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'responsables_eleves') INTO old_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parents') INTO new_exists;

    IF old_exists AND NOT new_exists THEN
        -- Cas normal : rename
        ALTER TABLE responsables_eleves RENAME TO parents;
        RAISE NOTICE 'Table responsables_eleves renommée en parents';
    ELSIF old_exists AND new_exists THEN
        -- synchronize a créé parents (vide) + ancienne table existe encore
        -- Migrer les données de l'ancienne vers la nouvelle
        SELECT COUNT(*) INTO row_count FROM responsables_eleves;
        IF row_count > 0 THEN
            -- Copier les données (en évitant les conflts sur id)
            INSERT INTO parents SELECT * FROM responsables_eleves ON CONFLICT (id) DO NOTHING;
            RAISE NOTICE '% lignes migrées de responsables_eleves vers parents', row_count;
        ELSE
            RAISE NOTICE 'Table responsables_eleves vide — aucune donnée à migrer';
        END IF;
        -- Supprimer l'ancienne table
        DROP TABLE responsables_eleves;
        RAISE NOTICE 'Ancienne table responsables_eleves supprimée';
    ELSIF NOT old_exists AND new_exists THEN
        RAISE NOTICE 'Table parents déjà existante (synchronize) — skip rename';
    ELSE
        RAISE NOTICE 'Aucune table parents/responsables_eleves trouvée — synchronize la créera';
    END IF;
END $$;

-- ==================================
-- 2. Renommer les index manuels
-- ==================================
ALTER INDEX IF EXISTS idx_responsables_eleves_actif RENAME TO idx_parents_actif;
ALTER INDEX IF EXISTS idx_responsables_eleves_lien_parente RENAME TO idx_parents_lien_parente;
ALTER INDEX IF EXISTS idx_responsables_profession RENAME TO idx_parents_profession;
ALTER INDEX IF EXISTS idx_responsables_autorisation_sortie RENAME TO idx_parents_autorisation_sortie;
ALTER INDEX IF EXISTS idx_responsables_autorisation_medicale RENAME TO idx_parents_autorisation_medicale;

-- ==================================
-- 3. Renommer les index TypeORM (générés automatiquement)
-- ==================================
-- Les index TypeORM ont des noms auto-générés du type "IDX_{hash}_{colonne}"
-- On les renomme proprement via une boucle dynamique
DO $$
DECLARE
    idx record;
    new_name text;
BEGIN
    FOR idx IN
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'parents'
          AND indexname LIKE 'IDX_%'
    LOOP
        -- Renommer avec un nom lisible
        IF idx.indexdef LIKE '%enfantId%' AND idx.indexdef LIKE '%utilisateurId%' AND idx.indexdef LIKE '%UNIQUE%' THEN
            new_name := 'idx_parents_enfant_utilisateur_unique';
        ELSIF idx.indexdef LIKE '%enfantId%' AND idx.indexdef NOT LIKE '%UNIQUE%' THEN
            new_name := 'idx_parents_enfant_id';
        ELSIF idx.indexdef LIKE '%utilisateurId%' AND idx.indexdef NOT LIKE '%UNIQUE%' THEN
            new_name := 'idx_parents_utilisateur_id';
        ELSE
            -- Garder le nom existant pour les autres
            CONTINUE;
        END IF;

        EXECUTE format('ALTER INDEX IF EXISTS %I RENAME TO %I', idx.indexname, new_name);
        RAISE NOTICE 'Index % renommé en %', idx.indexname, new_name;
    END LOOP;
END $$;

-- ==================================
-- 4. Mettre à jour les vues dépendantes
-- ==================================
-- Recréer la vue de statistiques de migration avec le nouveau nom de table
DROP VIEW IF EXISTS v_preinscriptions_non_migrees;
DROP VIEW IF EXISTS v_stats_migration_parents;
DROP FUNCTION IF EXISTS fn_eleves_a_migrer();

-- Vue pour statistiques de migration (mise à jour avec nouveau nom)
CREATE OR REPLACE VIEW v_stats_migration_parents AS
SELECT
    COUNT(*) as total_eleves,
    COUNT(CASE WHEN "estPreinscription" = true THEN 1 END) as preinscriptions,
    COUNT(CASE WHEN "estPreinscription" = false THEN 1 END) as inscriptions,
    COUNT(CASE WHEN "estPreinscription" = false AND "utilisateurId" IS NOT NULL THEN 1 END) as avec_utilisateur,
    COUNT(CASE WHEN "nomPere" IS NOT NULL OR "nomMere" IS NOT NULL THEN 1 END) as avec_champs_directs,
    (SELECT COUNT(DISTINCT p."enfantId")
     FROM parents p
     WHERE p.actif = true) as avec_parents
FROM eleves;

-- ==================================
-- 5. Commentaires
-- ==================================
COMMENT ON TABLE parents IS 'Module Parents — gestion des relations parent-élève (module payant, activable/désactivable)';

-- ==================================
-- 6. Module catalogue — seed module parents
-- ==================================
INSERT INTO modules_catalogue (code, nom, "nomEn", description, categorie, icone,
    "prixMensuel", "prixAnnuel", "estFacturable", "estSouscriptible", "actifParDefaut",
    "planMinimal", dependencies, ordre, "estSysteme", config)
VALUES (
    'parents', 'Parents', 'Parents',
    'Portail parent : suivi enfants, notes, bulletins, paiements',
    'PAYANT', 'Users',
    0, 0, false, true, false,
    'starter', ARRAY['eleves']::varchar[], 15, false,
    '{"enablePortal": true, "allowPayments": true, "notificationEnabled": true}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    nom = EXCLUDED.nom,
    "nomEn" = EXCLUDED."nomEn",
    description = EXCLUDED.description,
    categorie = EXCLUDED.categorie,
    icone = EXCLUDED.icone,
    "estSouscriptible" = EXCLUDED."estSouscriptible",
    "planMinimal" = EXCLUDED."planMinimal",
    dependencies = EXCLUDED.dependencies,
    config = EXCLUDED.config;

-- ==================================
-- 7. Permissions RBAC — seed permissions parents
-- ==================================
INSERT INTO permissions (code, libelle, description, module, action, actif, "createdAt", "updatedAt")
VALUES
    ('parents:view', 'Voir parents', 'Consulter la liste des parents et leurs relations', 'parents', 'view', true, NOW(), NOW()),
    ('parents:create', 'Créer parents', 'Créer une relation parent-élève', 'parents', 'create', true, NOW(), NOW()),
    ('parents:edit', 'Modifier parents', 'Modifier une relation parent-élève', 'parents', 'edit', true, NOW(), NOW()),
    ('parents:delete', 'Supprimer parents', 'Supprimer une relation parent-élève', 'parents', 'delete', true, NOW(), NOW()),
    ('parents:view-enfants', 'Voir enfants', 'Voir les enfants liés (portal parent)', 'parents', 'view-enfants', true, NOW(), NOW()),
    ('parents:view-notes', 'Voir notes enfants', 'Consulter les notes des enfants (portal parent)', 'parents', 'view-notes', true, NOW(), NOW()),
    ('parents:view-bulletins', 'Voir bulletins enfants', 'Consulter les bulletins des enfants (portal parent)', 'parents', 'view-bulletins', true, NOW(), NOW()),
    ('parents:pay', 'Payer pour enfants', 'Effectuer des paiements pour les enfants', 'parents', 'pay', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Attribution des permissions portal au rôle PARENT
DO $$
DECLARE
    parent_role_id UUID;
    portal_perms TEXT[] := ARRAY['parents:view-enfants', 'parents:view-notes', 'parents:view-bulletins', 'parents:pay'];
    perm_code TEXT;
BEGIN
    SELECT id INTO parent_role_id FROM roles WHERE code = 'PARENT';
    IF parent_role_id IS NOT NULL THEN
        FOREACH perm_code IN ARRAY portal_perms LOOP
            INSERT INTO role_permissions ("roleId", "permissionId")
            SELECT parent_role_id, p.id
            FROM permissions p
            WHERE p.code = perm_code
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

COMMIT;
