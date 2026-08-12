/**
 * ==================================
 * eLISAschool - DataSource TypeORM
 * ==================================
 * Version: 1.1.0
 * - Pré-nettoyage orphelins heures_cours avant synchronize
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseConfig } from '@config/database.config';
import { envConfig } from '@config/env.config';
import { cleanOrphanHeuresCours, cleanDeprecatedRoles } from './pre-sync-cleanup';
import { applyPartialIndexes } from './post-sync-indexes';
import { logger } from '@common/utils/logger.util';

export const AppDataSource = new DataSource(databaseConfig);

export async function initializeDatabase(): Promise<DataSource> {
    if (!AppDataSource.isInitialized) {
        if (databaseConfig.synchronize) {
            logger.info('🧹 Pré-nettoyage avant synchronize...');
            await cleanOrphanHeuresCours({
                host: envConfig.database.host,
                port: envConfig.database.port,
                user: envConfig.database.user,
                password: envConfig.database.password,
                database: envConfig.database.name,
            });
            // Nettoyer les rôles obsolètes (PLATEFORME_SUPER_ADMIN, etc.)
            // avant que TypeORM ne tente d'ALTER COLUMN enum
            await cleanDeprecatedRoles({
                host: envConfig.database.host,
                port: envConfig.database.port,
                user: envConfig.database.user,
                password: envConfig.database.password,
                database: envConfig.database.name,
            });
        }
        await AppDataSource.initialize();

        // Re-créer les index partiels que synchronize ne gère pas
        await applyPartialIndexes(AppDataSource);
    }
    return AppDataSource;
}

export async function closeDatabase(): Promise<void> {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
}

export default AppDataSource;