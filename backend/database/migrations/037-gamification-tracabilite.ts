/**
 * ==================================
 * eLISAschool - Migration 037: Gamification Traçabilité
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Ajoute les colonnes sourceModule et sourceId à la table historique_points
 * pour permettre la traçabilité complète des points de gamification.
 * 
 * Contexte: Les points peuvent être attribués par différents modules
 * (suivi-eleves, notes, assiduité, etc.). Cette migration permet de
 * tracer l'origine exacte de chaque attribution de points.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class GamificationTracabilite1720000000000 implements MigrationInterface {
    name = 'GamificationTracabilite1720000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Vérifier si les colonnes existent déjà (idempotence)
        const columnSourceModule = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'historique_points' 
            AND column_name = 'sourceModule'
        `);

        const columnSourceId = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'historique_points' 
            AND column_name = 'sourceId'
        `);

        // Ajouter sourceModule si n'existe pas
        if (columnSourceModule.length === 0) {
            await queryRunner.query(`
                ALTER TABLE historique_points 
                ADD COLUMN IF NOT EXISTS "sourceModule" varchar(50) NULL
            `);
            console.log('[Migration 037] Colonne sourceModule ajoutée à historique_points');
        }

        // Ajouter sourceId si n'existe pas
        if (columnSourceId.length === 0) {
            await queryRunner.query(`
                ALTER TABLE historique_points 
                ADD COLUMN IF NOT EXISTS "sourceId" uuid NULL
            `);
            console.log('[Migration 037] Colonne sourceId ajoutée à historique_points');
        }

        // Ajouter index sur sourceModule pour filtrage par module
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_points_sourceModule 
            ON historique_points("sourceModule")
        `);

        // Ajouter index composite pour traçabilité complète
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_points_source 
            ON historique_points("sourceModule", "sourceId")
        `);

        console.log('[Migration 037] Index de traçabilité créés');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les index
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_historique_points_sourceModule
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_historique_points_source
        `);

        // Supprimer les colonnes
        await queryRunner.query(`
            ALTER TABLE historique_points 
            DROP COLUMN IF EXISTS "sourceModule"
        `);
        await queryRunner.query(`
            ALTER TABLE historique_points 
            DROP COLUMN IF EXISTS "sourceId"
        `);

        console.log('[Migration 037] Rollback effectué');
    }
}
