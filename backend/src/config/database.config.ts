/**
 * ==================================
 * eLISAschool - Configuration de la base de données
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { DataSourceOptions } from 'typeorm';
import { envConfig } from './env.config';

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
    synchronize: envConfig.app.isDevelopment,

    // Journalisation des requêtes SQL
    logging: envConfig.app.isDevelopment ? ['query', 'error', 'warn'] : ['error'],

    // Entités (ajoutées dynamiquement lors de l'import des modules)
    entities: ['src/modules/**/entities/*.entity.{ts,js}'],

    // Migrations
    migrations: ['src/database/migrations/*.{ts,js}'],

    // Subscribers
    subscribers: ['src/database/subscribers/*.{ts,js}'],

    // Pool de connexions
    poolSize: envConfig.app.isProduction ? 20 : 5,

    // SSL en production
    ssl: envConfig.app.isProduction ? { rejectUnauthorized: false } : false,

    // Options supplémentaires PostgreSQL
    extra: {
        // Timeout de connexion (30 secondes)
        connectionTimeoutMillis: 30000,
        // Timeout d'inactivité (10 minutes)
        idleTimeoutMillis: 600000,
    },
};

export default databaseConfig;
