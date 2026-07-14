import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeHeureCoursPeriodeIdNullable1789000000000 implements MigrationInterface {
    name = 'MakeHeureCoursPeriodeIdNullable1789000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "heures_cours" 
            ALTER COLUMN "periodeId" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "heures_cours" 
            ALTER COLUMN "periodeId" SET NOT NULL
        `);
    }
}
