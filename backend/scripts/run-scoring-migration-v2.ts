/**
 * ==================================
 * eLISAschool - Script Migration Scoring Personnel (sans SSL)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ScoringPersonnel1720000000000 } from '../database/migrations/039-scoring-personnel';

// Configuration minimale sans SSL
const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'elisaschool_user',
    password: process.env.DB_PASSWORD || 'elisaschool_dev_2024',
    database: process.env.DB_NAME || 'elisaschool',
    ssl: false,
    synchronize: false,
    logging: ['error'],
    entities: [],
    migrations: [],
});

async function runMigration(): Promise<void> {
    try {
        console.log('🔌 Connexion à la base de données...');
        await dataSource.initialize();
        console.log('✅ Connexion établie');

        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        console.log('📊 Exécution de la migration scoring personnel...');
        const migration = new ScoringPersonnel1720000000000();
        await migration.up(queryRunner);
        await queryRunner.commitTransaction();
        await queryRunner.release();

        console.log('✅ Migration scoring personnel exécutée avec succès');

        // Vérification
        const verifyRunner = dataSource.createQueryRunner();
        await verifyRunner.connect();

        const tables = await verifyRunner.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('scores_personnel', 'regles_scoring_personnel', 'historique_scores_personnel')
            ORDER BY table_name
        `);

        console.log('📋 Tables créées:', tables.map((t: any) => t.table_name).join(', '));

        const indexes = await verifyRunner.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename IN ('scores_personnel', 'regles_scoring_personnel', 'historique_scores_personnel')
            ORDER BY indexname
        `);

        console.log(`📇 ${indexes.length} index créés`);

        await verifyRunner.release();
        await dataSource.destroy();

        console.log('✅ Migration et vérification terminées avec succès');
    } catch (error: unknown) {
        console.error('❌ Erreur migration:', (error as Error).message);
        process.exit(1);
    }
}

runMigration();
