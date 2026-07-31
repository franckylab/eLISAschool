/**
 * ==================================
 * eLISAschool - Intercepteur de journalisation des requêtes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@common/utils/logger.util';
import { getClientIP } from '@common/utils/client-ip.util';

/**
 * Middleware de journalisation des requêtes HTTP
 * Enregistre les informations sur chaque requête entrante et sortante
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Log de la requête entrante
    logger.info(`➡️  ${req.method} ${req.path}`, {
        ip: getClientIP(req),
        userAgent: req.get('User-Agent')?.substring(0, 50),
    });

    // Interception de la fin de la requête pour logger la réponse
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Choix du niveau de log selon le code de statut
        const logMethod = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

        logger[logMethod](`⬅️  ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
    });

    next();
}

export default requestLogger;
