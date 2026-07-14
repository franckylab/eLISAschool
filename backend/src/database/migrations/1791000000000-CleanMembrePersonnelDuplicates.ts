import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanMembrePersonnelDuplicates1791000000000 implements MigrationInterface {
    name = 'CleanMembrePersonnelDuplicates1791000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Vérifier si les colonnes dupliquées existent encore avant backfill
        const hasDuplicates = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'membres_personnel' AND column_name = 'nom'
            ) as exists
        `);

        if (hasDuplicates[0]?.exists) {
            // Créer ProfilUtilisateur pour les membres qui ont un utilisateurId mais pas de profil
            await queryRunner.query(`
                INSERT INTO profils_utilisateurs ("utilisateurId", nom, prenom, "dateNaissance", genre, telephone, adresse)
                SELECT m."utilisateurId", m.nom, m.prenom, m."dateNaissance",
                       CASE WHEN m.sexe = 'M' THEN 'M' WHEN m.sexe = 'F' THEN 'F' ELSE NULL END,
                       m.telephone, m.adresse
                FROM membres_personnel m
                WHERE m."utilisateurId" IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM profils_utilisateurs p WHERE p."utilisateurId" = m."utilisateurId")
            `);
        }

        // 2. Supprimer les colonnes dupliquées (IF EXISTS = safe si déjà supprimées)
        await queryRunner.query(`
            ALTER TABLE "membres_personnel"
            DROP COLUMN IF EXISTS nom,
            DROP COLUMN IF EXISTS prenom,
            DROP COLUMN IF EXISTS "dateNaissance",
            DROP COLUMN IF EXISTS sexe,
            DROP COLUMN IF EXISTS email,
            DROP COLUMN IF EXISTS telephone,
            DROP COLUMN IF EXISTS adresse,
            DROP COLUMN IF EXISTS "etablissementOrigine"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "membres_personnel"
            ADD COLUMN IF NOT EXISTS nom varchar(100) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS prenom varchar(100) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "dateNaissance" date DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS sexe varchar(10) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS email varchar(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS telephone varchar(50) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS adresse text DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "etablissementOrigine" varchar(200) DEFAULT NULL
        `);
    }
}
