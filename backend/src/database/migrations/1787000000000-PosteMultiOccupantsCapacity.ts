import { MigrationInterface, QueryRunner } from 'typeorm';

export class PosteMultiOccupantsCapacity1787000000000 implements MigrationInterface {
    name = 'PosteMultiOccupantsCapacity1787000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter occupantsCount aux postes (idempotent)
        await queryRunner.query(`
            ALTER TABLE postes
            ADD COLUMN IF NOT EXISTS "occupantsCount" INTEGER NOT NULL DEFAULT 0
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_postes_occupants_count
            ON postes("occupantsCount")
        `);

        // 2. Synchroniser occupantsCount depuis les affectations actives
        await queryRunner.query(`
            UPDATE postes SET "occupantsCount" = (
                SELECT COUNT(*) FROM affectations_postes
                WHERE "posteId" = postes.id AND statut = 'ACTIF'
            )
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_postes_occupants_count`);
        await queryRunner.query(`ALTER TABLE postes DROP COLUMN IF EXISTS "occupantsCount"`);
    }
}
