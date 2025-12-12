/**
 * ==================================
 * eLISAschool - Gestionnaire d'erreurs global
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@common/utils/logger.util';

/**
 * Classe d'erreur personnalisée pour l'application
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details?: Record<string, unknown>;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        isOperational: boolean = true,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;

        // Capture la stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Erreurs prédéfinies courantes
 */
export const Errors = {
    // Authentification (401)
    UNAUTHORIZED: new AppError('Non autorisé', 401, 'UNAUTHORIZED'),
    INVALID_TOKEN: new AppError('Token invalide ou expiré', 401, 'INVALID_TOKEN'),

    // Autorisation (403)
    FORBIDDEN: new AppError('Accès refusé', 403, 'FORBIDDEN'),
    INSUFFICIENT_PERMISSIONS: new AppError('Permissions insuffisantes', 403, 'INSUFFICIENT_PERMISSIONS'),

    // Ressources (404)
    NOT_FOUND: new AppError('Ressource non trouvée', 404, 'NOT_FOUND'),
    USER_NOT_FOUND: new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND'),

    // Validation (400)
    BAD_REQUEST: new AppError('Requête invalide', 400, 'BAD_REQUEST'),
    VALIDATION_ERROR: new AppError('Erreur de validation', 400, 'VALIDATION_ERROR'),

    // Conflit (409)
    CONFLICT: new AppError('Conflit de données', 409, 'CONFLICT'),
    DUPLICATE_ENTRY: new AppError('Entrée en double', 409, 'DUPLICATE_ENTRY'),

    // Serveur (500)
    INTERNAL_ERROR: new AppError('Erreur interne du serveur', 500, 'INTERNAL_ERROR'),
    DATABASE_ERROR: new AppError('Erreur de base de données', 500, 'DATABASE_ERROR'),
};

/**
 * Interface pour la réponse d'erreur standardisée
 */
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        stack?: string;
    };
    timestamp: string;
    path: string;
}

/**
 * Middleware de gestion globale des erreurs
 */
export function errorHandler(
    error: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Détermination du type d'erreur
    const isAppError = error instanceof AppError;
    const statusCode = isAppError ? error.statusCode : 500;
    const code = isAppError ? error.code : 'INTERNAL_ERROR';
    const message = isAppError ? error.message : 'Une erreur inattendue est survenue';

    // Journalisation de l'erreur
    if (statusCode >= 500) {
        logger.error(`[${code}] ${message}`, {
            path: req.path,
            method: req.method,
            ip: req.ip,
            stack: error.stack,
        });
    } else {
        logger.warn(`[${code}] ${message}`, {
            path: req.path,
            method: req.method,
        });
    }

    // Construction de la réponse
    const response: ErrorResponse = {
        success: false,
        error: {
            code,
            message,
            details: isAppError ? error.details : undefined,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
    };

    // Ajout de la stack trace en développement
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = error.stack;
    }

    res.status(statusCode).json(response);
}

export default errorHandler;
