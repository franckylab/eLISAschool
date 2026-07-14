import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEstSystemeToTypePersonnel1793000000000 implements MigrationInterface {
    name = 'AddEstSystemeToTypePersonnel1793000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "types_personnel"
            ADD COLUMN IF NOT EXISTS "estSysteme" boolean DEFAULT false NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "types_personnel"
            SET "estSysteme" = true
            WHERE code IN ('ENSEIGNANT', 'DIRECTION', 'ADMINISTRATIF', 'TECHNIQUE', 'SERVICE', 'STAGE', 'TEMPORAIRE', 'AUTRE')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "types_personnel"
            DROP COLUMN IF EXISTS "estSysteme"
        `);
    }
}
