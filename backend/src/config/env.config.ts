/**
 * ==================================
 * eLISAschool - Configuration des variables d'environnement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * Charger .env AVANT toute validation
 * Chercher dans l'ordre : processus.cwd()/../../.env, processus.cwd()/.env, __dirname/../../.env
 */
const envSearchPaths = [
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), 'backend/.env'),
];

const envFile = envSearchPaths.find(p => fs.existsSync(p));
if (envFile) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config(); // Fallback
}

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
    APP_PORT: z.string().transform(Number).default('7000'),
    APP_URL: z.string().url().optional().default('http://localhost:7000'),

    // Base de données
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.string().transform(Number).default('7002'),
    DB_NAME: z.string().default('elisaschool'),
    DB_USER: z.string().default('elisaschool_user'),
    DB_PASSWORD: z.string().default(''),

    // JWT
    JWT_SECRET: z.string().min(32, 'Le secret JWT doit faire au moins 32 caractères'),
    JWT_SECRET_PLATFORM: z.string().min(32).optional(),
    JWT_SECRET_TENANT: z.string().min(32).optional(),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // Chiffrement
    ENCRYPTION_KEY: z.string().length(32, 'La clé de chiffrement doit faire exactement 32 caractères'),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().transform(Number).default('7003'),
    REDIS_PASSWORD: z.string().optional().default(''),

    // Email
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.string().transform(Number).optional().default('587'),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASSWORD: z.string().optional().default(''),
    SMTP_FROM: z.string().optional().default('noreply@elisaschool.cm'),

    // Frontend
    FRONTEND_URL: z.string().url().default('http://localhost:7001'),
    ALLOWED_ORIGINS: z.string().optional().default(''),

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
            
            // CRITIQUE: Utiliser process.env.JWT_SECRET si présent, sinon générer
            // Cela garantit que le secret reste le même entre les redémarrages
            const jwtSecret = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
                ? process.env.JWT_SECRET
                : generateDevSecret(64);
            
            // JWT secrets par plan (ADR-005) — TOUJOURS distincts
            const jwtSecretPlatform = process.env.JWT_SECRET_PLATFORM && process.env.JWT_SECRET_PLATFORM.length >= 32
                ? process.env.JWT_SECRET_PLATFORM
                : generateDevSecret(64);
            const jwtSecretTenant = process.env.JWT_SECRET_TENANT && process.env.JWT_SECRET_TENANT.length >= 32
                ? process.env.JWT_SECRET_TENANT
                : generateDevSecret(64);
            
            const encryptionKey = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length === 32
                ? process.env.ENCRYPTION_KEY
                : generateDevSecret(32);
            
            if (!process.env.JWT_SECRET) {
                console.warn('⚠️ JWT_SECRET non défini, génération d\'un valeur aléatoire (tokens invalidés au prochain redémarrage)');
            }
            if (!process.env.JWT_SECRET_PLATFORM) {
                console.warn('⚠️ JWT_SECRET_PLATFORM non défini, génération d\'un secret dev distinct (tokens plateforme invalidés au redémarrage)');
            }
            if (!process.env.JWT_SECRET_TENANT) {
                console.warn('⚠️ JWT_SECRET_TENANT non défini, génération d\'un secret dev distinct (tokens tenant invalidés au redémarrage)');
            }
            
            return {
                NODE_ENV: 'development',
                APP_NAME: 'eLISAschool',
                APP_VERSION: '1.0.0',
                APP_PORT: 7000,
                APP_URL: 'http://localhost:7000',
                DB_HOST: 'localhost',
                DB_PORT: 7002,
                DB_NAME: 'elisaschool',
                DB_USER: 'elisaschool_user',
                DB_PASSWORD: 'dev_password',
                JWT_SECRET: jwtSecret, // ← Utiliser depuis process.env si valide
                JWT_EXPIRES_IN: '7d',
                JWT_REFRESH_EXPIRES_IN: '30d',
                ENCRYPTION_KEY: encryptionKey, // ← Utiliser depuis process.env si valide
                REDIS_HOST: 'localhost',
                REDIS_PORT: 7003,
                REDIS_PASSWORD: '',
                SMTP_HOST: '',
                SMTP_PORT: 587,
                SMTP_USER: '',
                SMTP_PASSWORD: '',
                SMTP_FROM: 'noreply@elisaschool.cm',
                FRONTEND_URL: 'http://localhost:7001',
                ALLOWED_ORIGINS: '',
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

// Log de démarrage pour diagnostiquer les problèmes de JWT
if (env.NODE_ENV === 'development') {
    console.log(`[ENV Config] JWT_SECRET utilisé: ${env.JWT_SECRET.substring(0, 15)}... (longueur: ${env.JWT_SECRET.length})`);
    console.log(`[ENV Config] JWT_SECRET source: ${process.env.JWT_SECRET ? '.env' : 'généré dynamiquement'}`);
}

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
        allowedOrigins: env.ALLOWED_ORIGINS,
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
        // ADR-005 — secrets TOUJOURS distincts (pas de fallback sur secret legacy)
        secretPlatform: process.env.JWT_SECRET_PLATFORM && process.env.JWT_SECRET_PLATFORM.length >= 32
            ? process.env.JWT_SECRET_PLATFORM
            : (env.NODE_ENV === 'production'
                ? (() => { console.error('❌ JWT_SECRET_PLATFORM requis en production'); process.exit(1); })()
                : env.JWT_SECRET),
        secretTenant: process.env.JWT_SECRET_TENANT && process.env.JWT_SECRET_TENANT.length >= 32
            ? process.env.JWT_SECRET_TENANT
            : (env.NODE_ENV === 'production'
                ? (() => { console.error('❌ JWT_SECRET_TENANT requis en production'); process.exit(1); })()
                : env.JWT_SECRET),
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
