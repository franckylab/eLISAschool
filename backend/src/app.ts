/**
 * ==================================
 * eLISAschool Backend - Configuration Express
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Support multi-établissements + réponses API standardisées
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
import { tenantMiddleware } from '@common/middlewares/tenant.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@config/swagger.config';

// Import des routes des modules
import { authController } from '@modules/auth';
import utilisateurEtablissementController from '@modules/auth/controllers/utilisateur-etablissement.controller';
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
import { orientationController } from '@modules/orientation';
import { impressionsController } from '@modules/impressions';
import { scoringService } from '@modules/scoring';
import { etablissementController } from '@modules/etablissement';
import { cyclesController } from '@modules/cycles';
import { niveauxController } from '@modules/niveaux';
import { anneesScolairesController } from '@modules/annees-scolaires';
import { personnelController } from '@modules/personnel';
import { classesController } from '@modules/classes';
import { matieresController } from '@modules/matieres';
import { periodesController } from '@modules/periodes';
import { elevesController } from '@modules/eleves';
import { bulletinsController } from '@modules/bulletins';
import { monitoringController } from '@modules/monitoring';
import rbacController from '@modules/rbac';
import { auditController } from '@modules/audit';

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
    app.use('/api/', limiter as any);

    // ==================================
    // Middlewares de parsing
    // ==================================

    // Compression gzip des réponses
    app.use(compression() as any);

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
    // Routes publiques (SANS middleware tenant)
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
            description: 'API de gestion scolaire avancée — Multi-établissements',
            version: envConfig.app.version,
            author: 'xAI Éducation',
            documentation: '/api/docs',
        });
    });

    // Documentation API interactive (Swagger UI)
    app.use('/api/docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'eLISAschool API Docs',
    }) as any);

    // Route JSON de la spécification OpenAPI
    app.get('/api/docs.json', (_req: Request, res: Response) => {
        res.json(swaggerSpec);
    });

    // ==================================
    // Middleware Multi-Tenancy (APRÈS les routes publiques)
    // ==================================

    // Attache automatiquement l'etablissementId depuis le JWT
    // Les SUPER_ADMIN peuvent accéder à tous les établissements
    app.use('/api/', tenantMiddleware);

    // ==================================
    // Montage des routes des modules
    // ==================================

    // Modules critiques
    app.use('/api/auth', authController);
    app.use('/api/utilisateurs', utilisateurEtablissementController); // Multi-établissements (v2.0)
    app.use('/api/utilisateurs', utilisateursController);
    app.use('/api/configuration', configurationController);
    app.use('/api/notifications', notificationsController);
    app.use('/api/notes', notesController);
    app.use('/api/rbac', rbacController);

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

    // Nouveaux modules
    app.use('/api/orientation', orientationController);
    app.use('/api/impressions', impressionsController);
    app.use('/api/monitoring', monitoringController);

    // Modules académiques (multi-établissements)
    app.use('/api/etablissements', etablissementController);
    app.use('/api/cycles', cyclesController);
    app.use('/api/niveaux', niveauxController);
    app.use('/api/annees-scolaires', anneesScolairesController);
    app.use('/api/personnel', personnelController);
    app.use('/api/classes', classesController);
    app.use('/api/matieres', matieresController);
    app.use('/api/periodes', periodesController);
    app.use('/api/eleves', elevesController);
    app.use('/api/bulletins', bulletinsController);

    // Module audit (doit être après tenantMiddleware)
    app.use('/api/audit', auditController);

    // ==================================
    // Gestion des erreurs
    // ==================================

    // Route non trouvée (404)
    app.use(notFoundHandler);

    // Gestionnaire d'erreurs global
    app.use(errorHandler);

    return app;
}
