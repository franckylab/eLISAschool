/**
 * ==================================
 * eLISAschool - Force Configuration Seed
 * ==================================
 * Script forcer la réinitialisation des paramètres de configuration
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';
import { logger } from '@common/utils/logger.util';

// Charger .env depuis la racine du projet
dotenv.config({ path: '../../.env' });

// Fallback si variables non chargées
if (!process.env.DB_PASSWORD) {
    process.env.DB_PASSWORD = 'elisaschool_password';
    process.env.DB_USER = 'elisaschool_user';
    process.env.DB_NAME = 'elisaschool';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '7002';
    process.env.JWT_SECRET = 'dev_jwt_secret_32_caracteres_minimum';
    process.env.ENCRYPTION_KEY = 'dev_encryption_key_32chars_ok_xx';
}

async function main(): Promise<void> {
    try {
        logger.info('🔌 Connexion à la base de données...');
        
        const SeedDataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER || 'elisaschool_user',
            password: process.env.DB_PASSWORD || 'elisaschool_password',
            database: process.env.DB_NAME || 'elisaschool',
            synchronize: false,
            logging: false,
            entities: [__dirname + '/../../modules/**/entities/*.entity.{js,ts}'],
        });
        
        await SeedDataSource.initialize();
        logger.info('✅ Connexion établie');

        // Injecter dans AppDataSource
        const { AppDataSource } = require('../data-source');
        Object.assign(AppDataSource, SeedDataSource);

        // Exécuter le seed avec force=true
        const seedService = new ConfigurationSeedService();
        logger.info('🌱 Exécution du seed de configuration (FORCE)...');
        
        const result = await seedService.runAllSeeds(undefined, true); // force=true
        
        logger.info(`✅ Seed terminé: Modules=${result.modules}, Params=${result.parametres}`);

        await SeedDataSource.destroy();
        logger.info('🔌 Connexion fermée');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur lors de l\'exécution du seed:', error);
        process.exit(1);
    }
}

main();
