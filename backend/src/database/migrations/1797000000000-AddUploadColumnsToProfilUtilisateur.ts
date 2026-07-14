import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUploadColumnsToProfilUtilisateur1797000000000 implements MigrationInterface {
    name = 'AddUploadColumnsToProfilUtilisateur1797000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Renommer photo → photoUrl (si elle existe)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'profils_utilisateurs' AND column_name = 'photo'
                ) THEN
                    ALTER TABLE "profils_utilisateurs" RENAME COLUMN "photo" TO "photoUrl";
                END IF;
            END $$;
        `);

        // Renommer pieceIdentite → pieceRectoUrl (si elle existe)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'profils_utilisateurs' AND column_name = 'pieceIdentite'
                ) THEN
                    ALTER TABLE "profils_utilisateurs" RENAME COLUMN "pieceIdentite" TO "pieceRectoUrl";
                END IF;
            END $$;
        `);

        // Ajouter les nouvelles colonnes (sans conflit avec les colonnes renommées ci-dessus)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'profils_utilisateurs' AND column_name = 'photoUrl'
                ) THEN
                    ALTER TABLE "profils_utilisateurs" ADD COLUMN "photoUrl" character varying(500);
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            ALTER TABLE "profils_utilisateurs" ADD COLUMN IF NOT EXISTS "photoThumbnail" character varying(500);
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'profils_utilisateurs' AND column_name = 'pieceRectoUrl'
                ) THEN
                    ALTER TABLE "profils_utilisateurs" ADD COLUMN "pieceRectoUrl" character varying(500);
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            ALTER TABLE "profils_utilisateurs" ADD COLUMN IF NOT EXISTS "pieceVersoUrl" character varying(500);
        `);

        await queryRunner.query(`
            ALTER TABLE "profils_utilisateurs" ADD COLUMN IF NOT EXISTS "typePieceIdentite" character varying(100);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profils_utilisateurs" DROP COLUMN IF EXISTS "typePieceIdentite"`);
        await queryRunner.query(`ALTER TABLE "profils_utilisateurs" DROP COLUMN IF EXISTS "pieceVersoUrl"`);
        await queryRunner.query(`ALTER TABLE "profils_utilisateurs" DROP COLUMN IF EXISTS "pieceRectoUrl"`);
        await queryRunner.query(`ALTER TABLE "profils_utilisateurs" DROP COLUMN IF EXISTS "photoThumbnail"`);
        await queryRunner.query(`ALTER TABLE "profils_utilisateurs" DROP COLUMN IF EXISTS "photoUrl"`);
        // Restaurer les anciens noms
        await queryRunner.query(`ALTER TABLE "profils_utilisateurs" ADD COLUMN IF NOT EXISTS "photo" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "profils_utilisateurs" ADD COLUMN IF NOT EXISTS "pieceIdentite" character varying(255)`);
    }
}
