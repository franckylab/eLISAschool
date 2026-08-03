-- ==================================
-- eLISAschool - Permissions granulaires heures-cours
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Remplace les permissions grossières personnel:view/manage
-- par des permissions fines heures-cours:* sur le controller
-- heure-cours.controller.ts.
-- ==================================

-- 1. Insérer les 5 nouvelles permissions (idempotent)
-- Convention rbac.seed : module = premier segment du code, action = reste.
INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES
    ('heures-cours:view', 'Consulter les heures de cours', 'Voir les créneaux, EDT enseignant, volume horaire', 'heures-cours', 'view', true),
    ('heures-cours:create', 'Créer une heure de cours', 'Créer un nouveau créneau de cours', 'heures-cours', 'create', true),
    ('heures-cours:edit', 'Modifier une heure de cours', 'Modifier un créneau existant', 'heures-cours', 'edit', true),
    ('heures-cours:delete', 'Supprimer une heure de cours', 'Supprimer un créneau de cours', 'heures-cours', 'delete', true),
    ('heures-cours:generate', 'Générer heures de cours depuis EDT', 'Générer en masse depuis les créneaux EDT', 'heures-cours', 'generate', true)
ON CONFLICT (code) DO NOTHING;

-- 2. Attribuer les permissions aux rôles appropriés
-- ADMIN, CHEF_ETABLISSEMENT, PROVISEUR, PRINCIPAL : toutes les 5
DO $$
DECLARE
    roles_complet TEXT[] := ARRAY['ADMIN', 'CHEF_ETABLISSEMENT', 'PROVISEUR', 'PRINCIPAL'];
    perms_complet TEXT[] := ARRAY['heures-cours:view', 'heures-cours:create', 'heures-cours:edit', 'heures-cours:delete', 'heures-cours:generate'];
    roles_sans_generate TEXT[] := ARRAY['DIRECTEUR', 'CENSEUR', 'SECRETAIRE_DIRECTION'];
    perms_sans_generate TEXT[] := ARRAY['heures-cours:view', 'heures-cours:create', 'heures-cours:edit', 'heures-cours:delete'];
    roles_lecture TEXT[] := ARRAY['ENSEIGNANT', 'SURVEILLANT'];
    r TEXT;
    p TEXT;
    perm_id UUID;
    role_id UUID;
BEGIN
    -- Rôles avec toutes les permissions
    FOREACH r IN ARRAY roles_complet LOOP
        SELECT id INTO role_id FROM roles WHERE code = r;
        IF role_id IS NOT NULL THEN
            FOREACH p IN ARRAY perms_complet LOOP
                SELECT id INTO perm_id FROM permissions WHERE code = p;
                IF perm_id IS NOT NULL THEN
                    INSERT INTO role_permissions ("roleId", "permissionId")
                    VALUES (role_id, perm_id)
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    -- Rôles sans génération
    FOREACH r IN ARRAY roles_sans_generate LOOP
        SELECT id INTO role_id FROM roles WHERE code = r;
        IF role_id IS NOT NULL THEN
            FOREACH p IN ARRAY perms_sans_generate LOOP
                SELECT id INTO perm_id FROM permissions WHERE code = p;
                IF perm_id IS NOT NULL THEN
                    INSERT INTO role_permissions ("roleId", "permissionId")
                    VALUES (role_id, perm_id)
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    -- Rôles lecture seule
    FOREACH r IN ARRAY roles_lecture LOOP
        SELECT id INTO role_id FROM roles WHERE code = r;
        IF role_id IS NOT NULL THEN
            SELECT id INTO perm_id FROM permissions WHERE code = 'heures-cours:view';
            IF perm_id IS NOT NULL THEN
                INSERT INTO role_permissions ("roleId", "permissionId")
                VALUES (role_id, perm_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END $$;
