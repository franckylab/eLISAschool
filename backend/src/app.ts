/**
 * ==================================
 * eLISAschool Backend - Configuration Express
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { envConfig } from '@config/env.config';
import { logger } from '@common/utils/logger.util';
import { errorHandler } from '@common/filters/error.filter';
import { notFoundHandler } from '@common/filters/not-found.filter';
import { requestLogger } from '@common/interceptors/request-logger.interceptor';

// Import des routes des modules
import { authController } from '@modules/auth';
import { utilisateursController } from '@modules/utilisateurs';
import { configurationController } from '@modules/configuration';
import { notificationsController } from '@modules/notifications';
import { notesController } from '@modules/notes';
import { messagerieController } from '@modules/messagerie';
import { cantineController } from '@modules/cantine';
import { transportController } from '@modules/transport';
import { gamificationController } from '@modules/gamification';
import { requetesController } from '@modules/requetes';
import { clubsController } from '@modules/clubs';
import { materielController } from '@modules/materiel';
import { cartesController } from '@modules/cartes';

/**
 * Crée et configure l'application Express
 */
export function createApp(): Application {
    const app = express();

    // ==================================
    // Middlewares de sécurité
    // ==================================

    // Protection des en-têtes HTTP (XSS, Clickjacking, etc.)
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "blob:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));

    // Configuration CORS
    app.use(cors({
        origin: envConfig.app.frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Limitation du taux de requêtes (protection DDoS basique)
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 requêtes par fenêtre
        message: {
            success: false,
            message: 'Trop de requêtes, veuillez réessayer plus tard.',
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);

    // ==================================
    // Middlewares de parsing
    // ==================================

    // Compression gzip des réponses
    app.use(compression());

    // Parsing JSON avec limite de taille
    app.use(express.json({ limit: '10mb' }));

    // Parsing des données URL-encoded
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ==================================
    // Middlewares de logging
    // ==================================

    // Journalisation des requêtes
    app.use(requestLogger);

    // ==================================
    // Routes de base
    // ==================================

    // Route de santé (health check)
    app.get('/api/health', (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            message: 'eLISAschool API opérationnelle',
            version: envConfig.app.version,
            timestamp: new Date().toISOString(),
        });
    });

    // Route d'information
    app.get('/api', (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            name: 'eLISAschool API',
            description: 'API de gestion scolaire avancée',
            version: envConfig.app.version,
            author: 'xAI Éducation',
            documentation: '/api/docs',
        });
    });

    // ==================================
    // Montage des routes des modules
    // ==================================

    // Modules critiques
    app.use('/api/auth', authController);
    app.use('/api/utilisateurs', utilisateursController);
    app.use('/api/configuration', configurationController);
    app.use('/api/notifications', notificationsController);
    app.use('/api/notes', notesController);

    // Modules communication
    app.use('/api/messagerie', messagerieController);
    app.use('/api/requetes', requetesController);

    // Modules logistiques
    app.use('/api/cantine', cantineController);
    app.use('/api/transport', transportController);
    app.use('/api/materiel', materielController);

    // Modules activités
    app.use('/api/clubs', clubsController);
    app.use('/api/gamification', gamificationController);
    app.use('/api/cartes', cartesController);

    // ==================================
    // Gestion des erreurs
    // ==================================

    // Route non trouvée (404)
    app.use(notFoundHandler);

    // Gestionnaire d'erreurs global
    app.use(errorHandler);

    return app;
}
