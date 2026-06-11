/**
 * ==================================
 * eLISAschool - Migration 043: Correction Dossier Medical FK
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Description: Ajout des colonnes eleveId et personnelId pour séparer les FK
 *   au lieu d'utiliser patientId pour deux relations différentes
 * ==================================
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CorrectionDossierMedicalFk043 implements MigrationInterface {
    name = 'CorrectionDossierMedicalFk043';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajouter la colonne eleveId
        await queryRunner.query(`
            ALTER TABLE dossiers_medicaux 
            ADD COLUMN IF NOT EXISTS eleve_id UUID REFERENCES eleves(id) ON DELETE SET NULL
        `);

        // Ajouter la colonne personnelId
        await queryRunner.query(`
            ALTER TABLE dossiers_medicaux 
            ADD COLUMN IF NOT EXISTS personnel_id UUID REFERENCES membres_personnel(id) ON DELETE SET NULL
        `);

        // Créer les index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_dossiers_medicaux_eleve 
            ON dossiers_medicaux(eleve_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_dossiers_medicaux_personnel 
            ON dossiers_medicaux(personnel_id)
        `);

        // Migrer les données existantes : copier patientId vers eleve_id ou personnel_id selon type_patient
        await queryRunner.query(`
            UPDATE dossiers_medicaux 
            SET eleve_id = patient_id 
            WHERE type_patient = 'ELEVE'
        `);

        await queryRunner.query(`
            UPDATE dossiers_medicaux 
            SET personnel_id = patient_id 
            WHERE type_patient = 'PERSONNEL'
        `);

        // NOTE: patient_id est conservé pour compatibilité ascendante
        // Les nouvelles créations utiliseront eleve_id ou personnel_id directement
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les index
        await queryRunner.query(`DROP INDEX IF EXISTS idx_dossiers_medicaux_eleve`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_dossiers_medicaux_personnel`);

        // Supprimer les colonnes
        await queryRunner.query(`ALTER TABLE dossiers_medicaux DROP COLUMN IF EXISTS eleve_id`);
        await queryRunner.query(`ALTER TABLE dossiers_medicaux DROP COLUMN IF EXISTS personnel_id`);
    }
}
