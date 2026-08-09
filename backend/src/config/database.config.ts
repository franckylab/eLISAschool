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

    // Synchronisation automatique (activée pour le développement)
    // NOTE: Désactiver en production ou après migration
    synchronize: envConfig.app.isDevelopment,

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

    // Subscribers (Phase H.2 — tenant-isolation + subscribers legacy)
    subscribers: isProduction
        ? [
            path.join(basePath, 'database', 'subscribers', '*.js'),
            path.join(basePath, 'common', 'subscribers', '*.js'),
        ]
        : [
            path.join(basePath, 'database', 'subscribers', '*.ts'),
            path.join(basePath, 'common', 'subscribers', '*.ts'),
        ],

    // Pool de connexions
    // Dynamique selon environnement + recyclage pour éviter les connexions stale
    poolSize: envConfig.app.isProduction
        ? parseInt(process.env.DB_POOL_SIZE || '20', 10)
        : 5,

    // SSL en production (certificats valides requis)
    ssl: envConfig.app.isProduction ? { rejectUnauthorized: true } : false,

    // Options supplémentaires PostgreSQL
    extra: {
        // Timeout de connexion (30 secondes)
        connectionTimeoutMillis: 30000,
        // Timeout d'inactivité (10 minutes)
        idleTimeoutMillis: 600000,
        // Recyclage des connexions après N utilisations (évite fuites mémoire PG)
        // Phase P3.1 — Refonte SaaS v6
        maxUses: parseInt(process.env.DB_POOL_MAX_USES || '1000', 10),
    },
};

export default databaseConfig;
