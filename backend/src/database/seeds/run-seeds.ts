/**
 * ==================================
 * eLISAschool - Script d'exécution des seeds
 * ==================================
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';
import { runSystemSeeds } from './initial.seed';
import { logger } from '@common/utils/logger.util';

const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

async function main(): Promise<void> {
    try {
        logger.info('🔌 Connexion à la base de données...');

        const SeedDataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '7002'),
            username: process.env.DB_USER || 'elisaschool_user',
            password: process.env.DB_PASSWORD || 'elisaschool_password',
            database: process.env.DB_NAME || 'elisaschool',
            synchronize: true,
            logging: false,
            entities: [__dirname + '/../../modules/**/entities/*.entity.{js,ts}'],
        });

        await SeedDataSource.initialize();
        logger.info('✅ Connexion établie');

        const { AppDataSource } = require('../data-source');
        Object.assign(AppDataSource, SeedDataSource);

        await runSystemSeeds();

        await SeedDataSource.destroy();
        logger.info('🔌 Connexion fermée');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur lors de l\'exécution des seeds système:', error);
        process.exit(1);
    }
}

main();
