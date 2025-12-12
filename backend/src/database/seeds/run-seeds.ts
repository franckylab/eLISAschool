/**
 * ==================================
 * eLISAschool - Script d'exécution des seeds
 * ==================================
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../data-source';
import { runSeeds } from './initial.seed';
import { logger } from '@common/utils/logger.util';

dotenv.config();

async function main(): Promise<void> {
    try {
        logger.info('🔌 Connexion à la base de données...');
        await AppDataSource.initialize();
        logger.info('✅ Connexion établie');

        await runSeeds();

        await AppDataSource.destroy();
        logger.info('🔌 Connexion fermée');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur lors de l\'exécution des seeds:', error);
        process.exit(1);
    }
}

main();
