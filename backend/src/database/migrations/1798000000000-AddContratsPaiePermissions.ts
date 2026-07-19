import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContratsPaiePermissions1798000000000 implements MigrationInterface {
    name = 'AddContratsPaiePermissions1798000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Insérer les permissions contrats (9)
        const contratsPerms = [
            { code: 'contrats:view', libelle: 'Voir les contrats', module: 'contrats', action: 'view' },
            { code: 'contrats:create', libelle: 'Créer un contrat', module: 'contrats', action: 'create' },
            { code: 'contrats:edit', libelle: 'Modifier un contrat', module: 'contrats', action: 'edit' },
            { code: 'contrats:delete', libelle: 'Supprimer un contrat', module: 'contrats', action: 'delete' },
            { code: 'contrats:export', libelle: 'Exporter les contrats', module: 'contrats', action: 'export' },
            { code: 'contrats:config:view', libelle: 'Voir les types de contrat', module: 'contrats', action: 'config:view' },
            { code: 'contrats:config:create', libelle: 'Créer un type de contrat', module: 'contrats', action: 'config:create' },
            { code: 'contrats:config:edit', libelle: 'Modifier un type de contrat', module: 'contrats', action: 'config:edit' },
            { code: 'contrats:config:delete', libelle: 'Supprimer un type de contrat', module: 'contrats', action: 'config:delete' },
        ];

        // 2. Insérer les permissions paie (11)
        const paiePerms = [
            { code: 'paie:view', libelle: 'Voir la paie', module: 'paie', action: 'view' },
            { code: 'paie:create', libelle: 'Créer un bulletin', module: 'paie', action: 'create' },
            { code: 'paie:edit', libelle: 'Modifier un bulletin', module: 'paie', action: 'edit' },
            { code: 'paie:delete', libelle: 'Supprimer un bulletin', module: 'paie', action: 'delete' },
            { code: 'paie:generer', libelle: 'Générer les bulletins', module: 'paie', action: 'generer' },
            { code: 'paie:valider', libelle: 'Valider un bulletin', module: 'paie', action: 'valider' },
            { code: 'paie:export', libelle: 'Exporter les bulletins', module: 'paie', action: 'export' },
            { code: 'paie:config:view', libelle: 'Voir la configuration paie', module: 'paie', action: 'config:view' },
            { code: 'paie:config:create', libelle: 'Créer une configuration paie', module: 'paie', action: 'config:create' },
            { code: 'paie:config:edit', libelle: 'Modifier la configuration paie', module: 'paie', action: 'config:edit' },
            { code: 'paie:config:delete', libelle: 'Supprimer une configuration paie', module: 'paie', action: 'config:delete' },
        ];

        const allPerms = [...contratsPerms, ...paiePerms];

        for (const perm of allPerms) {
            await queryRunner.query(`
                INSERT INTO "permissions" ("code", "libelle", "module", "action", "actif")
                SELECT $1, $2, $3, $4, true
                WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "code" = $1)
            `, [perm.code, perm.libelle, perm.module, perm.action]);
        }

        // 3. Rattacher aux rôles

        // Rôles ADMIN et CHEF_ETABLISSEMENT → toutes les permissions
        const fullAccessRoles = ['ADMIN', 'CHEF_ETABLISSEMENT'];
        for (const roleCode of fullAccessRoles) {
            for (const perm of allPerms) {
                await queryRunner.query(`
                    INSERT INTO "role_permissions" ("roleId", "permissionId")
                    SELECT r.id, p.id
                    FROM "roles" r, "permissions" p
                    WHERE r.code = $1 AND p.code = $2
                      AND NOT EXISTS (
                          SELECT 1 FROM "role_permissions" rp
                          WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
                      )
                `, [roleCode, perm.code]);
            }
        }

        // Rôle RH → toutes contrats + paie:view
        const allContratsCodes = contratsPerms.map(p => p.code);
        const rhCodes = [...allContratsCodes, 'paie:view'];
        for (const code of rhCodes) {
            await queryRunner.query(`
                INSERT INTO "role_permissions" ("roleId", "permissionId")
                SELECT r.id, p.id
                FROM "roles" r, "permissions" p
                WHERE r.code = 'RH' AND p.code = $1
                  AND NOT EXISTS (
                      SELECT 1 FROM "role_permissions" rp
                      WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
                  )
            `, [code]);
        }

        // Rôle GESTIONNAIRE_PAIE → tout paie sauf valider
        const gestionnaireCodes = paiePerms
            .filter(p => p.code !== 'paie:valider')
            .map(p => p.code);
        for (const code of gestionnaireCodes) {
            await queryRunner.query(`
                INSERT INTO "role_permissions" ("roleId", "permissionId")
                SELECT r.id, p.id
                FROM "roles" r, "permissions" p
                WHERE r.code = 'GESTIONNAIRE_PAIE' AND p.code = $1
                  AND NOT EXISTS (
                      SELECT 1 FROM "role_permissions" rp
                      WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
                  )
            `, [code]);
        }

        // Rôle COMPTABLE → paie opérationnel (sans delete, valider, config CRUD)
        const comptableCodes = ['paie:view', 'paie:create', 'paie:edit', 'paie:generer', 'paie:export', 'paie:config:view'];
        for (const code of comptableCodes) {
            await queryRunner.query(`
                INSERT INTO "role_permissions" ("roleId", "permissionId")
                SELECT r.id, p.id
                FROM "roles" r, "permissions" p
                WHERE r.code = 'COMPTABLE' AND p.code = $1
                  AND NOT EXISTS (
                      SELECT 1 FROM "role_permissions" rp
                      WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
                  )
            `, [code]);
        }

        // Rôle VALIDATEUR_PAIE → view + valider + export
        const validateurCodes = ['paie:view', 'paie:valider', 'paie:export'];
        for (const code of validateurCodes) {
            await queryRunner.query(`
                INSERT INTO "role_permissions" ("roleId", "permissionId")
                SELECT r.id, p.id
                FROM "roles" r, "permissions" p
                WHERE r.code = 'VALIDATEUR_PAIE' AND p.code = $1
                  AND NOT EXISTS (
                      SELECT 1 FROM "role_permissions" rp
                      WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
                  )
            `, [code]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const allCodes = [
            'contrats:view', 'contrats:create', 'contrats:edit', 'contrats:delete', 'contrats:export',
            'contrats:config:view', 'contrats:config:create', 'contrats:config:edit', 'contrats:config:delete',
            'paie:view', 'paie:create', 'paie:edit', 'paie:delete', 'paie:generer', 'paie:valider', 'paie:export',
            'paie:config:view', 'paie:config:create', 'paie:config:edit', 'paie:config:delete',
        ];

        for (const code of allCodes) {
            await queryRunner.query(`
                DELETE FROM "role_permissions"
                WHERE "permissionId" = (SELECT id FROM "permissions" WHERE "code" = $1)
            `, [code]);
            await queryRunner.query(`
                DELETE FROM "permissions" WHERE "code" = $1
            `, [code]);
        }
    }
}
