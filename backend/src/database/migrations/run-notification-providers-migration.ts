/**
 * ==================================
 * eLISAschool - Script Migration Notification Providers
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Exécute la migration des notification providers
 */

import { AppDataSource } from '../data-source';
import { logger } from '../../common/utils/logger.util';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    logger.info('🚀 Démarrage de la migration notification providers...');

    try {
        // Initialiser la connexion
        await AppDataSource.initialize();
        logger.info('✅ Connecté à la base de données');

        // Lire le fichier SQL
        const migrationPath = path.join(__dirname, '../migrations/010-notification-providers.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        // Exécuter la migration
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
            await queryRunner.startTransaction();
            
            // Diviser le SQL en requêtes individuelles
            const queries = sql
                .split(';')
                .map(q => q.trim())
                .filter(q => q.length > 0 && !q.startsWith('--'));

            logger.info(`📝 Exécution de ${queries.length} requêtes...`);

            for (const query of queries) {
                if (query.trim()) {
                    await queryRunner.query(query);
                }
            }

            await queryRunner.commitTransaction();
            logger.info('✅ Migration notification providers complétée avec succès');

            // Vérifier que la table existe
            const result = await queryRunner.query(
                "SELECT COUNT(*) FROM notification_providers"
            );
            logger.info(`📊 Providers existants: ${result[0].count}`);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('❌ Échec de la migration', error);
            throw error;
        } finally {
            await queryRunner.release();
        }

    } catch (error) {
        logger.error('❌ Erreur lors de la migration', error);
        process.exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        process.exit(0);
    }
}

// Exécuter (UNIQUEMENT via commande CLI, PAS par import)
// Pour exécuter: npx ts-node -r tsconfig-paths/register src/database/migrations/run-notification-providers-migration.ts
// runMigration();
