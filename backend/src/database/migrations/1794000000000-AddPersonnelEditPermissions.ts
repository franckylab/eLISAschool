import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonnelEditPermissions1794000000000 implements MigrationInterface {
    name = 'AddPersonnelEditPermissions1794000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Insérer les 3 nouvelles permissions
        const permissions = [
            { code: 'personnel:edit:type', libelle: 'Modifier le type de personnel', module: 'personnel', action: 'edit:type' },
            { code: 'personnel:edit:identity', libelle: 'Modifier le statut et la date d\'entrée', module: 'personnel', action: 'edit:identity' },
            { code: 'personnel:edit:competences', libelle: 'Modifier les compétences', module: 'personnel', action: 'edit:competences' },
        ];

        for (const perm of permissions) {
            await queryRunner.query(`
                INSERT INTO "permissions" ("code", "libelle", "module", "action", "actif")
                SELECT $1, $2, $3, $4, true
                WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE "code" = $1)
            `, [perm.code, perm.libelle, perm.module, perm.action]);
        }

        // 2. Rattacher les permissions aux rôles ADMIN et CHEF_ETABLISSEMENT
        const roleCodes = ['ADMIN', 'CHEF_ETABLISSEMENT'];
        const permCodes = permissions.map(p => p.code);

        for (const roleCode of roleCodes) {
            for (const permCode of permCodes) {
                await queryRunner.query(`
                    INSERT INTO "role_permissions" ("roleId", "permissionId")
                    SELECT r.id, p.id
                    FROM "roles" r, "permissions" p
                    WHERE r.code = $1
                      AND p.code = $2
                      AND NOT EXISTS (
                          SELECT 1 FROM "role_permissions" rp
                          WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
                      )
                `, [roleCode, permCode]);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const permCodes = ['personnel:edit:type', 'personnel:edit:identity', 'personnel:edit:competences'];

        for (const code of permCodes) {
            // Supprimer les liaisons role_permissions
            await queryRunner.query(`
                DELETE FROM "role_permissions"
                WHERE "permissionId" = (SELECT id FROM "permissions" WHERE "code" = $1)
            `, [code]);

            // Supprimer la permission
            await queryRunner.query(`
                DELETE FROM "permissions" WHERE "code" = $1
            `, [code]);
        }
    }
}
