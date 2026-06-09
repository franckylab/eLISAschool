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
import { configurationController, backupController } from '@modules/configuration';
import { notificationsController, notificationProviderController } from '@modules/notifications';
import { notesController } from '@modules/notes';
import { messagerieController } from '@modules/messagerie';
import { cantineController } from '@modules/cantine';
import { transportController } from '@modules/transport';
import { gamificationController } from '@modules/gamification';
import { requetesController } from '@modules/requetes';
import { clubsController } from '@modules/clubs';
import { materielController } from '@modules/materiel';
import { financesController } from '@modules/finances';
import { cartesController } from '@modules/cartes';
import { suiviElevesController } from '@modules/suivi-eleves';
import { suiviPersonnelController } from '@modules/suivi-personnel';
import { santeController } from '@modules/sante';
import { orientationController } from '@modules/orientation';
import { impressionsController } from '@modules/impressions';
import { scoringService } from '@modules/scoring';
import { etablissementController } from '@modules/etablissement';
import { cyclesController } from '@modules/cycles';
import { niveauxController } from '@modules/niveaux';
import { anneesScolairesController } from '@modules/annees-scolaires';
import { personnelController, contratController, heureCoursController, absencePersonnelController, evaluationController, progressionProgrammeController, bulletinPaieController, personnelDashboardController } from '@modules/personnel';
import { classesController } from '@modules/classes';
import { matieresController } from '@modules/matieres';
import { periodesController } from '@modules/periodes';
import { elevesController } from '@modules/eleves';
import { bulletinsController } from '@modules/bulletins';
import { responsablesElevesController } from '@modules/responsables-eleves';
import { monitoringController } from '@modules/monitoring';
import rbacController from '@modules/rbac';
import { auditController } from '@modules/audit';
import { dashboardController } from '@modules/dashboard';
import { validationWorkflowController } from '@modules/validation-workflow';
import { groupesController } from '@modules/groupes-etablissements';
import { requireModuleActive } from '@modules/configuration/middlewares/module-active.middleware';
import { typesEnumController } from '@modules/types-enum';

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
    app.use(compression({
        level: 6, // Équilibre entre CPU et ratio de compression
        threshold: 1024, // Ne compresser que les réponses > 1KB
    }) as any);

    // ETag pour le cache HTTP
    app.set('etag', 'strong');

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

    // Documentation API interactive (Swagger UI) - Cache 1h
    app.use('/api/docs', (req, res, next) => {
        res.set('Cache-Control', 'public, max-age=3600'); // 1 heure
        next();
    }, swaggerUi.serve as any, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'eLISAschool API Docs',
    }) as any);

    // Route JSON de la spécification OpenAPI - Cache 1h
    app.get('/api/docs.json', (req, res: Response) => {
        res.set('Cache-Control', 'public, max-age=3600');
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
    app.use('/api/backups', backupController);
    app.use('/api/notifications', notificationsController);
    app.use('/api/notification-providers', notificationProviderController);
    app.use('/api/notes', requireModuleActive('notes'), notesController);
    app.use('/api/rbac', rbacController);

    // Modules communication
    app.use('/api/messagerie', messagerieController);
    app.use('/api/requetes', requetesController);

    // Modules académiques
    app.use('/api/bulletins', requireModuleActive('bulletins'), bulletinsController);
    app.use('/api/cantine', requireModuleActive('cantine'), cantineController);
    app.use('/api/transport', requireModuleActive('transport'), transportController);
    app.use('/api/materiel', requireModuleActive('materiel'), materielController);
    app.use('/api/finances', requireModuleActive('finances'), financesController);

    // Modules activités
    app.use('/api/clubs', requireModuleActive('clubs'), clubsController);
    app.use('/api/gamification', requireModuleActive('gamification'), gamificationController);
    app.use('/api/cartes', requireModuleActive('cartes'), cartesController);

    // Modules suivi (nouveau v2.0)
    app.use('/api/suivi-eleves', requireModuleActive('suivi-eleves'), suiviElevesController);
    app.use('/api/suivi-personnel', requireModuleActive('suivi-personnel'), suiviPersonnelController);

    // Module santé (nouveau v2.0) - Accès sécurisé
    app.use('/api/sante', requireModuleActive('sante'), santeController);

    // Modules système
    app.use('/api/orientation', requireModuleActive('orientation'), orientationController);
    app.use('/api/impressions', requireModuleActive('impressions'), impressionsController);
    app.use('/api/monitoring', requireModuleActive('monitoring'), monitoringController);
    app.use('/api/dashboard', requireModuleActive('dashboard'), dashboardController);
    app.use('/api/validation-workflows', validationWorkflowController);
    app.use('/api/groupes', groupesController);
    app.use('/api/types-enum', typesEnumController);

    // Modules académiques (multi-établissements)
    app.use('/api/etablissements', etablissementController);
    app.use('/api/cycles', cyclesController);
    app.use('/api/niveaux', niveauxController);
    app.use('/api/annees-scolaires', anneesScolairesController);
    app.use('/api/personnel', personnelController);
    app.use('/api/personnel/contrats', contratController);
    app.use('/api/personnel/heures-cours', heureCoursController);
    app.use('/api/personnel/absences', requireModuleActive('personnel'), absencePersonnelController);
    app.use('/api/personnel/evaluations', requireModuleActive('personnel'), evaluationController);
    app.use('/api/personnel/progressions', requireModuleActive('personnel'), progressionProgrammeController);
    app.use('/api/personnel/bulletins', requireModuleActive('personnel'), bulletinPaieController);
    app.use('/api/personnel/dashboard', requireModuleActive('personnel'), personnelDashboardController);
    app.use('/api/classes', classesController);
    app.use('/api/matieres', matieresController);
    app.use('/api/periodes', periodesController);
    app.use('/api/eleves', elevesController);
    app.use('/api/bulletins', bulletinsController);
    app.use('/api/responsables-eleves', responsablesElevesController);

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
