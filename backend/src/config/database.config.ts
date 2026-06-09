/**
 * ==================================
 * eLISAschool - Configuration de la base de données
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { DataSourceOptions } from 'typeorm';
import { envConfig } from './env.config';
import path from 'path';

/**
 * Détermine les chemins des entités et migrations selon l'environnement
 * En développement: chemins vers les fichiers .ts (src/)
 * En production: chemins vers les fichiers .js compilés (dist/)
 */
const isProduction = envConfig.app.isProduction;
const basePath = isProduction ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');

/**
 * Options de configuration TypeORM
 */
export const databaseConfig: DataSourceOptions = {
    type: 'postgres',
    host: envConfig.database.host,
    port: envConfig.database.port,
    username: envConfig.database.user,
    password: envConfig.database.password,
    database: envConfig.database.name,

    // Synchronisation automatique (désactivée en production)
    // NOTE: synchronize désactivé temporairement - mismatch snake_case/camelCase dans entités finances
    synchronize: false,

    // Journalisation des requêtes SQL
    logging: envConfig.app.isDevelopment ? ['query', 'error', 'warn'] : ['error'],

    // Entités (chemins adaptés selon dev/prod)
    entities: isProduction
        ? [path.join(basePath, 'modules', '**', 'entities', '*.entity.js')]
        : [path.join(basePath, 'modules', '**', 'entities', '*.entity.ts')],

    // Migrations
    migrations: isProduction
        ? [path.join(basePath, 'database', 'migrations', '*.js')]
        : [path.join(basePath, 'database', 'migrations', '*.ts')],

    // Subscribers
    subscribers: isProduction
        ? [path.join(basePath, 'database', 'subscribers', '*.js')]
        : [path.join(basePath, 'database', 'subscribers', '*.ts')],

    // Pool de connexions
    poolSize: envConfig.app.isProduction ? 20 : 5,

    // SSL en production (certificats valides requis)
    ssl: envConfig.app.isProduction ? { rejectUnauthorized: true } : false,

    // Options supplémentaires PostgreSQL
    extra: {
        // Timeout de connexion (30 secondes)
        connectionTimeoutMillis: 30000,
        // Timeout d'inactivité (10 minutes)
        idleTimeoutMillis: 600000,
    },
};

export default databaseConfig;
