import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleChangePermission1796000000000 implements MigrationInterface {
    name = 'AddRoleChangePermission1796000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permCode = 'utilisateurs:role:change';

        await queryRunner.query(`
            INSERT INTO "permissions" ("code", "libelle", "module", "action", "actif")
            VALUES ($1, 'Changer le rôle des utilisateurs', 'utilisateurs', 'role:change', true)
            ON CONFLICT ("code") DO NOTHING
        `, [permCode]);

        const roleCodes = ['ADMIN', 'CHEF_ETABLISSEMENT'];

        for (const roleCode of roleCodes) {
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        const permCode = 'utilisateurs:role:change';

        await queryRunner.query(`
            DELETE FROM "role_permissions"
            WHERE "permissionId" = (SELECT id FROM "permissions" WHERE "code" = $1)
        `, [permCode]);

        await queryRunner.query(`
            DELETE FROM "permissions" WHERE "code" = $1
        `, [permCode]);
    }
}
