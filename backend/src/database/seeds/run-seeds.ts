/**
 * ==================================
 * eLISAschool - Script d'exécution des seeds
 * ==================================
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';
import { runSeeds } from './initial.seed';
import { logger } from '@common/utils/logger.util';

// Charger le fichier .env depuis la racine du projet
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

async function main(): Promise<void> {
    try {
        logger.info('🔌 Connexion à la base de données...');
        
        // Créer une DataSource avec synchronize pour créer les tables
        const SeedDataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '7002'),
            username: process.env.DB_USER || 'elisaschool_user',
            password: process.env.DB_PASSWORD || 'elisaschool_password',
            database: process.env.DB_NAME || 'elisaschool',
            synchronize: true,  // Activé pour créer les tables initiales
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
