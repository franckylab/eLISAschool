/**
 * ==================================
 * eLISAschool - Migration 038: Index Performance Gamification & Suivi
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Ajout d'index stratégiques pour optimiser les requêtes de gamification et suivi
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexPerformanceGamificationSuivi038 implements MigrationInterface {
    name = 'IndexPerformanceGamificationSuivi038';

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🚀 Migration 038: Ajout index performance gamification & suivi...');

        // ========================================
        // INDEX GAMIFICATION
        // ========================================
        
        // Index sur historique_points.utilisateurId pour requêtes rapides par utilisateur
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_points_utilisateur 
            ON historique_points("utilisateurId")
        `);
        console.log('✅ Index idx_historique_points_utilisateur créé');

        // Index sur historique_points.action pour filtrage par type d'action
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_points_action 
            ON historique_points("action")
        `);
        console.log('✅ Index idx_historique_points_action créé');

        // Index composite pour requêtes combinées utilisateur + action
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_points_utilisateur_action 
            ON historique_points("utilisateurId", "action")
        `);
        console.log('✅ Index idx_historique_points_utilisateur_action créé');

        // Index sur historique_points.createdAt pour tri chronologique
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_points_created_at 
            ON historique_points("createdAt")
        `);
        console.log('✅ Index idx_historique_points_created_at créé');

        // Index sur historique_points.sourceModule pour traçabilité
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_points_source_module 
            ON historique_points("sourceModule")
        `);
        console.log('✅ Index idx_historique_points_source_module créé');

        // Index sur points_utilisateurs.utilisateurId (déjà unique implicitement mais explicitons-le)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_points_utilisateurs_utilisateur_unique 
            ON points_utilisateurs("utilisateurId")
        `);
        console.log('✅ Index idx_points_utilisateurs_utilisateur_unique créé');

        // Index sur points_utilisateurs.pointsTotal pour classement
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_points_utilisateurs_points_total 
            ON points_utilisateurs("pointsTotal" DESC)
        `);
        console.log('✅ Index idx_points_utilisateurs_points_total créé');

        // Index sur points_utilisateurs.niveau pour filtrage par niveau
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_points_utilisateurs_niveau 
            ON points_utilisateurs("niveau")
        `);
        console.log('✅ Index idx_points_utilisateurs_niveau créé');

        // ========================================
        // INDEX SUIVI-ÉLÈVES
        // ========================================

        // Index sur incident_eleve.eleveId pour requêtes par élève
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_incident_eleve_eleve 
            ON incident_eleve("eleveId")
        `);
        console.log('✅ Index idx_incident_eleve_eleve créé');

        // Index composite incident_eleve pour filtrage multi-critères
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_incident_eleve_eleve_annee 
            ON incident_eleve("eleveId", "anneeScolaireId")
        `);
        console.log('✅ Index idx_incident_eleve_eleve_annee créé');

        // Index sur incident_eleve.gravite pour filtrage
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_incident_eleve_gravite 
            ON incident_eleve("gravite")
        `);
        console.log('✅ Index idx_incident_eleve_gravite créé');

        // Index sur observation_eleve.eleveId
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_observation_eleve_eleve 
            ON observation_eleve("eleveId")
        `);
        console.log('✅ Index idx_observation_eleve_eleve créé');

        // Index composite observation_eleve
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_observation_eleve_eleve_annee 
            ON observation_eleve("eleveId", "anneeScolaireId")
        `);
        console.log('✅ Index idx_observation_eleve_eleve_annee créé');

        // Index sur observation_eleve.type (POSITIVE/NEGATIVE/NEUTRE)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_observation_eleve_type 
            ON observation_eleve("type")
        `);
        console.log('✅ Index idx_observation_eleve_type créé');

        // Index sur felicitation_eleve.eleveId
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_felicitation_eleve_eleve 
            ON felicitation_eleve("eleveId")
        `);
        console.log('✅ Index idx_felicitation_eleve_eleve créé');

        // Index composite felicitation_eleve
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_felicitation_eleve_eleve_annee 
            ON felicitation_eleve("eleveId", "anneeScolaireId")
        `);
        console.log('✅ Index idx_felicitation_eleve_eleve_annee créé');

        // Index sur sanction_eleve.eleveId
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_sanction_eleve_eleve 
            ON sanction_eleve("eleveId")
        `);
        console.log('✅ Index idx_sanction_eleve_eleve créé');

        // Index sur sanction_eleve.statut pour filtrage
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_sanction_eleve_statut 
            ON sanction_eleve("statut")
        `);
        console.log('✅ Index idx_sanction_eleve_statut créé');

        // ========================================
        // INDEX SUIVI-PERSONNEL
        // ========================================

        // Index sur incident_personnel.membrePersonnelId
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_incident_personnel_membre 
            ON incident_personnel("membrePersonnelId")
        `);
        console.log('✅ Index idx_incident_personnel_membre créé');

        // Index composite incident_personnel
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_incident_personnel_membre_annee 
            ON incident_personnel("membrePersonnelId", "anneeScolaireId")
        `);
        console.log('✅ Index idx_incident_personnel_membre_annee créé');

        // Index sur evaluation_personnel.membrePersonnelId
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_evaluation_personnel_membre 
            ON evaluation_personnel("membrePersonnelId")
        `);
        console.log('✅ Index idx_evaluation_personnel_membre créé');

        // Index sur evaluation_personnel.noteGlobale pour agrégations
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_evaluation_personnel_note 
            ON evaluation_personnel("noteGlobale")
        `);
        console.log('✅ Index idx_evaluation_personnel_note créé');

        // ========================================
        // INDEX NOTES (pour gamification)
        // ========================================

        // Index sur notes.eleveId pour requêtes rapides
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_eleve 
            ON notes("eleveId")
        `);
        console.log('✅ Index idx_notes_eleve créé');

        // Index composite notes pour requêtes par élève + année
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_eleve_annee 
            ON notes("eleveId", "anneeScolaireId")
        `);
        console.log('✅ Index idx_notes_eleve_annee créé');

        // Index sur notes.valeur pour filtrage par performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_valeur 
            ON notes("valeur")
        `);
        console.log('✅ Index idx_notes_valeur créé');

        // Index sur notes.bareme pour calcul ratio
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_bareme 
            ON notes("bareme")
        `);
        console.log('✅ Index idx_notes_bareme créé');

        console.log('✅ Migration 038 terminée avec succès !');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Rollback Migration 038...');

        // Supprimer tous les index créés
        await queryRunner.query(`DROP INDEX IF EXISTS idx_historique_points_utilisateur`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_historique_points_action`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_historique_points_utilisateur_action`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_historique_points_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_historique_points_source_module`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_points_utilisateurs_utilisateur_unique`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_points_utilisateurs_points_total`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_points_utilisateurs_niveau`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS idx_incident_eleve_eleve`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_incident_eleve_eleve_annee`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_incident_eleve_gravite`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_observation_eleve_eleve`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_observation_eleve_eleve_annee`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_observation_eleve_type`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_felicitation_eleve_eleve`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_felicitation_eleve_eleve_annee`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sanction_eleve_eleve`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_sanction_eleve_statut`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS idx_incident_personnel_membre`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_incident_personnel_membre_annee`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_evaluation_personnel_membre`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_evaluation_personnel_note`);
        
        await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_eleve`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_eleve_annee`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_valeur`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_bareme`);

        console.log('✅ Rollback Migration 038 terminé');
    }
}
