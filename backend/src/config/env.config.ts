/**
 * ==================================
 * eLISAschool - Configuration des variables d'environnement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import crypto from 'crypto';

/**
 * Génère un secret aléatoire pour le développement
 */
function generateDevSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
}

/**
 * Schéma de validation des variables d'environnement
 */
const envSchema = z.object({
    // Application
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_NAME: z.string().default('eLISAschool'),
    APP_VERSION: z.string().default('1.0.0'),
    APP_PORT: z.string().transform(Number).default('3000'),
    APP_URL: z.string().url().optional().default('http://localhost:3000'),

    // Base de données
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.string().transform(Number).default('5432'),
    DB_NAME: z.string().default('elisaschool'),
    DB_USER: z.string().default('elisaschool_user'),
    DB_PASSWORD: z.string().default(''),

    // JWT
    JWT_SECRET: z.string().min(32, 'Le secret JWT doit faire au moins 32 caractères'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // Chiffrement
    ENCRYPTION_KEY: z.string().length(32, 'La clé de chiffrement doit faire exactement 32 caractères'),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().transform(Number).default('6379'),
    REDIS_PASSWORD: z.string().optional().default(''),

    // Email
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.string().transform(Number).optional().default('587'),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASSWORD: z.string().optional().default(''),
    SMTP_FROM: z.string().optional().default('noreply@elisaschool.cm'),

    // Frontend
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),

    // Licence
    LICENSE_KEY: z.string().optional().default(''),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FILE: z.string().optional().default('logs/app.log'),
});

/**
 * Type inféré des variables d'environnement
 */
type EnvConfig = z.infer<typeof envSchema>;

/**
 * Fonction de chargement et validation des variables d'environnement
 */
function loadEnvConfig(): EnvConfig {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Erreur de configuration des variables d\'environnement:');
        console.error(result.error.format());

        // En développement, on utilise des valeurs par défaut sécurisées
        if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ Utilisation des valeurs par défaut en mode développement');
            return {
                NODE_ENV: 'development',
                APP_NAME: 'eLISAschool',
                APP_VERSION: '1.0.0',
                APP_PORT: 3000,
                APP_URL: 'http://localhost:3000',
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                DB_NAME: 'elisaschool',
                DB_USER: 'elisaschool_user',
                DB_PASSWORD: 'dev_password',
                JWT_SECRET: generateDevSecret(64), // Généré dynamiquement
                JWT_EXPIRES_IN: '7d',
                JWT_REFRESH_EXPIRES_IN: '30d',
                ENCRYPTION_KEY: generateDevSecret(32), // Généré dynamiquement
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_PASSWORD: '',
                SMTP_HOST: '',
                SMTP_PORT: 587,
                SMTP_USER: '',
                SMTP_PASSWORD: '',
                SMTP_FROM: 'noreply@elisaschool.cm',
                FRONTEND_URL: 'http://localhost:5173',
                LICENSE_KEY: '',
                LOG_LEVEL: 'debug',
                LOG_FILE: 'logs/app.log',
            };
        }

        process.exit(1);
    }

    return result.data;
}

// Chargement de la configuration
const env = loadEnvConfig();

/**
 * Objet de configuration exporté, structuré par domaine
 */
export const envConfig = {
    app: {
        nodeEnv: env.NODE_ENV,
        name: env.APP_NAME,
        version: env.APP_VERSION,
        port: env.APP_PORT,
        url: env.APP_URL,
        frontendUrl: env.FRONTEND_URL,
        isProduction: env.NODE_ENV === 'production',
        isDevelopment: env.NODE_ENV === 'development',
    },
    database: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        name: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
    },
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    encryption: {
        key: env.ENCRYPTION_KEY,
    },
    redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
    },
    email: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
        from: env.SMTP_FROM,
    },
    license: {
        key: env.LICENSE_KEY,
    },
    logging: {
        level: env.LOG_LEVEL,
        file: env.LOG_FILE,
    },
};

export type { EnvConfig };
