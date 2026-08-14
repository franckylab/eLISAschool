-- ==================================
-- eLISAschool - Permissions RBAC pour module CMS
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- 18 permissions CMS :
-- - pages: view, create, edit, publish, delete
-- - sections: view, create, edit, delete
-- - medias: view, upload, delete
-- - themes: view, manage
-- - menus: manage
-- - widgets: manage
-- - versions: view, restore
-- Attribution : ADMIN + CHEF_ETAB (toutes), DIRECTEUR (sauf themes/widgets/restore)
-- ==================================

DO $$
DECLARE
    perms text[] := ARRAY[
        'cms:pages:view', 'cms:pages:create', 'cms:pages:edit',
        'cms:pages:publish', 'cms:pages:delete',
        'cms:sections:view', 'cms:sections:create', 'cms:sections:edit',
        'cms:sections:delete',
        'cms:medias:view', 'cms:medias:upload', 'cms:medias:delete',
        'cms:themes:view', 'cms:themes:manage',
        'cms:menus:manage',
        'cms:widgets:manage',
        'cms:versions:view', 'cms:versions:restore'
    ];
    p text;
BEGIN
    -- Création des permissions
    FOREACH p IN ARRAY perms
    LOOP
        INSERT INTO permissions (code, libelle, action, module)
        VALUES (
            p,
            'CMS — ' || initcap(split_part(p, ':', 2)) || ' — ' || split_part(p, ':', 3),
            split_part(p, ':', 3),
            'cms'
        )
        ON CONFLICT (code) DO NOTHING;
    END LOOP;

    -- Attribution ADMIN + CHEF_ETABLISSEMENT (toutes permissions CMS)
    INSERT INTO role_permissions ("roleId", "permissionId")
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.code IN ('ADMIN', 'CHEF_ETABLISSEMENT')
      AND p.module = 'cms'
    ON CONFLICT DO NOTHING;

    -- Attribution DIRECTEUR (sauf themes:manage, widgets:manage, versions:restore)
    INSERT INTO role_permissions ("roleId", "permissionId")
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.code = 'DIRECTEUR'
      AND p.module = 'cms'
      AND p.code NOT IN ('cms:themes:manage', 'cms:widgets:manage', 'cms:versions:restore')
    ON CONFLICT DO NOTHING;
END $$;
