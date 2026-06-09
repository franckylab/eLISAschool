/**
 * ==================================
 * eLISAschool - Script Migration Scoring Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { AppDataSource } from '../src/database/data-source';
import { ScoringPersonnel1720000000000 } from '../database/migrations/039-scoring-personnel';

async function runMigration(): Promise<void> {
    try {
        console.log('🔌 Connexion à la base de données...');
        await AppDataSource.initialize();
        console.log('✅ Connexion établie');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        console.log('📊 Exécution de la migration scoring personnel...');
        const migration = new ScoringPersonnel1720000000000();
        await migration.up(queryRunner);
        await queryRunner.commitTransaction();
        await queryRunner.release();

        console.log('✅ Migration scoring personnel exécutée avec succès');

        // Vérification
        const verifyRunner = AppDataSource.createQueryRunner();
        await verifyRunner.connect();

        const tables = await verifyRunner.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('scores_personnel', 'regles_scoring_personnel', 'historique_scores_personnel')
            ORDER BY table_name
        `);

        console.log('📋 Tables créées:', tables.map((t: any) => t.table_name).join(', '));

        // Vérifier les index
        const indexes = await verifyRunner.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename IN ('scores_personnel', 'regles_scoring_personnel', 'historique_scores_personnel')
            ORDER BY indexname
        `);

        console.log(`📇 ${indexes.length} index créés`);

        await verifyRunner.release();
        await AppDataSource.destroy();

        console.log('✅ Migration et vérification terminées avec succès');
    } catch (error: unknown) {
        console.error('❌ Erreur migration:', (error as Error).message);
        process.exit(1);
    }
}

runMigration();
