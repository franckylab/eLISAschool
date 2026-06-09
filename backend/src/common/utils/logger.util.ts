/**
 * ==================================
 * eLISAschool - Utilitaire de journalisation (Logger)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import winston from 'winston';
import path from 'path';

// Configuration des niveaux de log
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

// Couleurs pour l'affichage console
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};

winston.addColors(colors);

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
        let log = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

        // Ajout des métadonnées si présentes
        if (Object.keys(metadata).length > 0) {
            log += ` ${JSON.stringify(metadata)}`;
        }

        // Ajout de la stack trace si présente
        if (stack) {
            log += `\n${stack}`;
        }

        return log;
    })
);

// Format coloré pour la console
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    logFormat
);

// Création du logger
export const logger = winston.createLogger({
    levels,
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        // Console (toujours actif)
        new winston.transports.Console({
            format: consoleFormat,
        }),
        // Fichier pour les erreurs
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Fichier pour tous les logs
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// En développement, on ajoute plus de détails
if (process.env.NODE_ENV === 'development') {
    logger.level = 'debug';
}

// Export par défaut
export default logger;
