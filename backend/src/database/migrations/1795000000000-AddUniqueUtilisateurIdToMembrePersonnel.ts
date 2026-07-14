import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueUtilisateurIdToMembrePersonnel1795000000000 implements MigrationInterface {
    name = 'AddUniqueUtilisateurIdToMembrePersonnel1795000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM membres_personnel mp1
            USING membres_personnel mp2
            WHERE mp1.id > mp2.id
            AND mp1."utilisateurId" IS NOT NULL
            AND mp1."utilisateurId" = mp2."utilisateurId"
        `);

        await queryRunner.query(`
            ALTER TABLE "membres_personnel"
            ADD CONSTRAINT "uq_membre_utilisateur" UNIQUE ("utilisateurId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "membres_personnel"
            DROP CONSTRAINT IF EXISTS "uq_membre_utilisateur"
        `);
    }
}
