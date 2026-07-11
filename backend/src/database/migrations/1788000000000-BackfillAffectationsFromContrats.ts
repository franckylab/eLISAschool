import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillAffectationsFromContrats1788000000000 implements MigrationInterface {
    name = 'BackfillAffectationsFromContrats1788000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Créer les AffectationPoste manquantes pour les contrats qui ont un posteId
        // mais aucune affectation active existante pour ce membre + poste
        await queryRunner.query(`
            INSERT INTO affectations_postes (
                id,
                "membrePersonnelId",
                "posteId",
                "contratId",
                "uniteOrganisationnelleId",
                "dateDebut",
                statut,
                "typeMutation",
                "salaireAssocie",
                "etablissementId",
                "createdAt",
                "updatedAt"
            )
            SELECT
                uuid_generate_v4(),
                c."membrePersonnelId",
                c."posteId",
                c.id,
                p."uniteOrganisationnelleId",
                c."dateDebut",
                'ACTIF',
                'NOUVELLE',
                c."salaireBase",
                c."etablissementId",
                NOW(),
                NOW()
            FROM contrats_personnel c
            JOIN postes p ON p.id = c."posteId"
            WHERE c."posteId" IS NOT NULL
              AND c.statut = 'ACTIF'
              AND NOT EXISTS (
                SELECT 1 FROM affectations_postes a
                WHERE a."membrePersonnelId" = c."membrePersonnelId"
                  AND a."posteId" = c."posteId"
                  AND a.statut = 'ACTIF'
              )
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
        // Supprimer les affectations créées par cette migration
        await queryRunner.query(`
            DELETE FROM affectations_postes
            WHERE id IN (
                SELECT a.id FROM affectations_postes a
                JOIN contrats_personnel c ON c.id = a."contratId"
                WHERE a."contratId" IS NOT NULL
                  AND c."posteId" = a."posteId"
                  AND c."membrePersonnelId" = a."membrePersonnelId"
                  AND a.statut = 'ACTIF'
                  AND c.statut = 'ACTIF'
            )
        `);

        await queryRunner.query(`
            UPDATE postes SET "occupantsCount" = (
                SELECT COUNT(*) FROM affectations_postes
                WHERE "posteId" = postes.id AND statut = 'ACTIF'
            )
        `);
    }
}
