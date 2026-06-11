/**
 * ==================================
 * eLISAschool - Script d'exécution des seeds
 * ==================================
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { runSeeds } from './initial.seed';
import { logger } from '@common/utils/logger.util';

dotenv.config();

async function main(): Promise<void> {
    try {
        logger.info('🔌 Connexion à la base de données...');
        
        // Créer une DataSource sans synchronize pour les seeds
        const SeedDataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER || 'elisaschool_user',
            password: process.env.DB_PASSWORD || 'elisaschool_password',
            database: process.env.DB_NAME || 'elisaschool',
            synchronize: false,  // Désactivé pour les seeds
            logging: false,      // Réduire les logs
            entities: [__dirname + '/../../modules/**/entities/*.entity.{js,ts}'],
        });
        
        await SeedDataSource.initialize();
        logger.info('✅ Connexion établie');

        // Injecter dans AppDataSource pour les services de seeds
        const { AppDataSource } = require('../data-source');
        Object.assign(AppDataSource, SeedDataSource);

        await runSeeds();

        await SeedDataSource.destroy();
        logger.info('🔌 Connexion fermée');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur lors de l\'exécution des seeds:', error);
        process.exit(1);
    }
}

main();
