/**
 * ==================================
 * eLISAschool Backend - Configuration Express
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Support multi-établissements + réponses API standardisées
 */

import express, { Application, Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { envConfig } from '@config/env.config';
import { logger } from '@common/utils/logger.util';
import { errorHandler } from '@common/filters/error.filter';
import { notFoundHandler } from '@common/filters/not-found.filter';
import { requestLogger } from '@common/interceptors/request-logger.interceptor';
import { tenantMiddleware } from '@common/middlewares/tenant.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@config/swagger.config';

// Import des routes des modules
import { authController, preferencesController } from '@modules/auth';
import { authMiddleware } from '@modules/auth/middlewares';
import utilisateurEtablissementController from '@modules/auth/controllers/utilisateur-etablissement.controller';
import { utilisateursController } from '@modules/utilisateurs';
import { configurationController, backupController } from '@modules/configuration';
import { ElevesService } from '@modules/eleves/services';
import { notificationsController, notificationProviderController } from '@modules/notifications';
import { notesController } from '@modules/notes';
import { messagerieController } from '@modules/messagerie';
import { sondagesController } from '@modules/sondages';
import { annoncesController } from '@modules/annonces';
import { cantineController } from '@modules/cantine';
import { transportController } from '@modules/transport';
import { gamificationController } from '@modules/gamification';
import { requetesController } from '@modules/requetes';
import { clubsController } from '@modules/clubs';
import { materielController } from '@modules/materiel';
import { financesController } from '@modules/finances';
import { cartesController } from '@modules/cartes';
import { suiviElevesController } from '@modules/suivi-eleves';
import { suiviPersonnelController, scoringPersonnelController } from '@modules/suivi-personnel';
import { santeController } from '@modules/sante';
import { orientationController } from '@modules/orientation';
import { impressionsController } from '@modules/impressions';
import { scoringService } from '@modules/scoring';
import { etablissementController } from '@modules/etablissement';
import { cyclesController } from '@modules/cycles';
import { niveauxController } from '@modules/niveaux';
import { filieresController } from '@modules/filieres';
import { specialitesController } from '@modules/specialites';
import { competencesController } from '@modules/competences';
import { examensNationauxController } from '@modules/examens-nationaux';
import { diplomesElevesController } from '@modules/diplomes-eleves';
import { anneesScolairesController } from '@modules/annees-scolaires';
import { personnelController, contratController, typeContratController, affectationController, parcoursPersonnelController, heureCoursController, absencePersonnelController, evaluationController, progressionProgrammeController, bulletinPaieController, personnelDashboardController } from '@modules/personnel';
import { classesController, classesAnneesController } from '@modules/classes';
import { matieresController, configurationMatiereClasseController } from '@modules/matieres';
import { configurationScoringController } from '@modules/scoring';
import { periodesController, templatesPeriodeController, niveauxPeriodeController, usagesNiveauController } from '@modules/periodes';
import { programmesController } from '@modules/programmes';
import { elevesController } from '@modules/eleves';
import { bulletinsController } from '@modules/bulletins';
import { emploiDuTempsModuleController } from '@modules/emploi-du-temps';
import { sallesController } from '@modules/salles';
import { optionsController } from '@modules/options';
import { responsablesElevesController } from '@modules/responsables-eleves';
import { monitoringController } from '@modules/monitoring';
import rbacController from '@modules/rbac';
import { auditController } from '@modules/audit';
import { dashboardController } from '@modules/dashboard';
import { validationWorkflowController } from '@modules/validation-workflow';
import { groupesController } from '@modules/groupes-etablissements';
import { requireModuleActive } from '@modules/configuration/middlewares/module-active.middleware';
import { filterByEtablissement } from '@modules/auth/middlewares/etablissement.middleware';
import { typesEnumController } from '@modules/types-enum';
import { organisationController } from '@modules/organisation';
import { recrutementController } from '@modules/recrutement';
import { parkingController } from '@modules/parking';
import { apparenceController } from '@modules/apparence';

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
                // Autoriser chargement des images SVG du catalogue (cross-origin backend)
                imgSrc: ["'self'", "data:", "blob:", "http://localhost:*", "https://*"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));

    // Configuration CORS
    const allowedOrigins = envConfig.app.allowedOrigins
        ? envConfig.app.allowedOrigins.split(',').map(o => o.trim()).filter(Boolean)
        : [];
    const origins = [envConfig.app.frontendUrl, ...allowedOrigins].filter(Boolean);

    // Fonction de validation CORS dynamique
    // Accepte les origines explicites + sous-réseau local 10.0.0.0/24
    const isOriginAllowed = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // 1. Pas d'origine (requêtes server-to-server, curl, etc.) → autoriser
        if (!origin) {
            callback(null, true);
            return;
        }

        // 2. Origine dans la liste explicite → autoriser
        if (origins.includes(origin)) {
            callback(null, true);
            return;
        }

        // 3. Développement : accepter tout le sous-réseau 10.0.0.0/24
        if (envConfig.app.isDevelopment) {
            const localSubnetRegex = /^https?:\/\/10\.0\.0\.\d{1,3}(:\d+)?$/;
            if (localSubnetRegex.test(origin)) {
                callback(null, true);
                return;
            }

            // 4. localhost et 127.0.0.1 avec n'importe quel port
            const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/;
            if (localhostRegex.test(origin)) {
                callback(null, true);
                return;
            }
        }

        // 5. Origine non reconnue → bloquer
        callback(new Error(`CORS: Origine ${origin} non autorisée`));
    };

    app.use(cors({
        origin: isOriginAllowed,
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

    // Rate limiting STRICT pour l'authentification (protection brute force)
    const authLimiter = rateLimit({
        windowMs: 2 * 60 * 1000, // 2 minutes
        max: 20, // 20 tentatives de login par 15 minutes par IP
        message: {
            success: false,
            error: {
                code: 'TOO_MANY_REQUESTS',
                message: 'Trop de tentatives de connexion. Veuillez patienter 2 minutes.',
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            // Limiter par IP + identifiant (si disponible)
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const bodyIdentifiant = req.body?.identifiant || req.body?.email || '';
            return bodyIdentifiant ? `${ip}:${bodyIdentifiant}` : ip;
        },
        skipSuccessfulRequests: false, // Compter même les succès
    });

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
    // Fichiers statiques (uploads)
    // ==================================

    // Servir les fichiers uploadés (fonds d'écran, logos, documents, etc.)
    const uploadsDir = path.join(process.cwd(), 'uploads');
    app.use('/uploads', express.static(uploadsDir, {
        maxAge: '7d', // Cache 7 jours pour les fichiers statiques
        setHeaders: (res, filePath) => {
            // Headers CORS pour les fichiers SVG
            if (filePath.endsWith('.svg')) {
                res.setHeader('Content-Type', 'image/svg+xml');
                res.setHeader('Cache-Control', 'public, max-age=604800');
            }
        },
    }));

    // Servir les fonds d'écran du catalogue (fichiers système)
    const fondsCatalogueDir = path.join(process.cwd(), '..', 'public', 'fonds-catalogue');
    app.use('/fonds-catalogue', express.static(fondsCatalogueDir, {
        maxAge: '30d', // Cache 30 jours pour les fichiers système (rarement modifiés)
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.svg')) {
                res.setHeader('Content-Type', 'image/svg+xml');
                res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
                // Headers CORS pour permettre le chargement cross-origin des SVG
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            }
        },
    }));

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

    // ==================================
    // Routes publiques de préinscription (AVANT tenantMiddleware)
    // ==================================
    const preinscriptionRouter = Router();
    const elevesServicePublic = new ElevesService();

    preinscriptionRouter.post('/api/eleves/preinscription', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { validateDto } = await import('@common/utils');
            const { preinscriptionSchema } = await import('@modules/eleves/dto');
            const { Etablissement } = await import('@modules/etablissement/entities');
            const { AppDataSource } = await import('@database/data-source');
            const { AppError } = await import('@common/filters/error.filter');

            const dto = validateDto(preinscriptionSchema, req.body);

            // Résoudre l'établissement depuis le code
            const etablissementRepo = AppDataSource.getRepository(Etablissement);
            const etablissement = await etablissementRepo.createQueryBuilder('e')
                .where('e.code = :code OR e.nom LIKE :code', { code: dto.codeEtablissement })
                .getOne();

            if (!etablissement) {
                throw new AppError('Code établissement invalide', 400, 'INVALID_CODE_ETABLISSEMENT');
            }

            const preinscription = await elevesServicePublic.createPreinscription(dto, etablissement.id);
            res.status(201).json({
                success: true,
                data: preinscription,
                message: 'Préinscription soumise avec succès. Elle sera traitée par l\'établissement.'
            });
        } catch (error) { next(error); }
    });

    app.use(preinscriptionRouter);

    // Route d'information
    app.get('/api', (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            name: 'eLISAschool API',
            description: 'API de gestion scolaire avancée — Multi-établissements',
            version: envConfig.app.version,
            author: 'franck arlos chendjou',
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

    // Modules critiques avec filtrage multi-tenant
    // IMPORTANT: authLimiter sur login/register pour protéger contre brute force
    app.use('/api/auth/login', authLimiter as any);
    app.use('/api/auth/register', authLimiter as any);
    app.use('/api/auth', authController);
    app.use('/api/preferences', authMiddleware, filterByEtablissement(), preferencesController);
    app.use('/api/utilisateurs', authMiddleware, utilisateurEtablissementController); // Multi-établissements (v2.0)
    app.use('/api/utilisateurs', authMiddleware, filterByEtablissement(), utilisateursController);
    app.use('/api/configuration', configurationController);
    app.use('/api/backups', authMiddleware, filterByEtablissement(), backupController);
    app.use('/api/notifications', authMiddleware, filterByEtablissement(), notificationsController);
    app.use('/api/notification-providers', authMiddleware, filterByEtablissement(), notificationProviderController);
    app.use('/api/notes', authMiddleware, requireModuleActive('notes'), filterByEtablissement(), notesController);
    app.use('/api/rbac', rbacController);

    // Modules communication avec filtrage multi-tenant
    app.use('/api/messagerie', authMiddleware, filterByEtablissement(), messagerieController);
    app.use('/api/requetes', authMiddleware, filterByEtablissement(), requetesController);
    app.use('/api/sondages', authMiddleware, requireModuleActive('sondages'), filterByEtablissement(), sondagesController);
    app.use('/api/annonces', authMiddleware, requireModuleActive('annonces'), filterByEtablissement(), annoncesController);

    // Modules académiques avec filtrage multi-tenant
    app.use('/api/bulletins', authMiddleware, requireModuleActive('bulletins'), filterByEtablissement(), bulletinsController);
    app.use('/api/emploi-du-temps', authMiddleware, requireModuleActive('emploi-du-temps'), filterByEtablissement(), emploiDuTempsModuleController);
    app.use('/api/salles', authMiddleware, requireModuleActive('salles'), filterByEtablissement(), sallesController);
    app.use('/api/options', authMiddleware, requireModuleActive('options'), filterByEtablissement(), optionsController);
    app.use('/api/cantine', authMiddleware, requireModuleActive('cantine'), filterByEtablissement(), cantineController);
    app.use('/api/transport', authMiddleware, requireModuleActive('transport'), filterByEtablissement(), transportController);
    app.use('/api/parking', authMiddleware, requireModuleActive('parking'), filterByEtablissement(), parkingController);
    app.use('/api/materiel', authMiddleware, requireModuleActive('materiel'), filterByEtablissement(), materielController);
    app.use('/api/finances', authMiddleware, requireModuleActive('finances'), filterByEtablissement(), financesController);

    // Modules activités avec filtrage multi-tenant
    app.use('/api/clubs', authMiddleware, requireModuleActive('clubs'), filterByEtablissement(), clubsController);
    app.use('/api/gamification', authMiddleware, requireModuleActive('gamification'), filterByEtablissement(), gamificationController);
    app.use('/api/cartes', authMiddleware, requireModuleActive('cartes'), filterByEtablissement(), cartesController);

    // Module RH & Recrutement avec filtrage multi-tenant
    app.use('/api/recrutement', authMiddleware, requireModuleActive('recrutement'), filterByEtablissement(), recrutementController);

    // Modules suivi avec filtrage multi-tenant
    app.use('/api/suivi-eleves', authMiddleware, requireModuleActive('suivi-eleves'), filterByEtablissement(), suiviElevesController);
    app.use('/api/suivi-personnel', authMiddleware, requireModuleActive('suivi-personnel'), filterByEtablissement(), suiviPersonnelController);
    app.use('/api/scoring-personnel', authMiddleware, requireModuleActive('suivi-personnel'), filterByEtablissement(), scoringPersonnelController);

    // Module santé avec filtrage multi-tenant
    app.use('/api/sante', authMiddleware, requireModuleActive('sante'), filterByEtablissement(), santeController);

    // Modules système avec filtrage multi-tenant
    app.use('/api/orientation', authMiddleware, requireModuleActive('orientation'), filterByEtablissement(), orientationController);
    app.use('/api/impressions', authMiddleware, requireModuleActive('impressions'), filterByEtablissement(), impressionsController);
    app.use('/api/monitoring', authMiddleware, requireModuleActive('monitoring'), monitoringController); // Monitoring peut être global
    app.use('/api/dashboard', authMiddleware, requireModuleActive('dashboard'), filterByEtablissement(), dashboardController);
    app.use('/api/validation-workflows', authMiddleware, filterByEtablissement(), validationWorkflowController);
    app.use('/api/apparence/fonds', authMiddleware, filterByEtablissement(), apparenceController);
    app.use('/api/groupes-etablissements', authMiddleware, filterByEtablissement(), groupesController);
    app.use('/api/types-enum', typesEnumController); // Types enum sont globaux
    
    // Module organisation (critique - toujours actif avec filtrage)
    app.use('/api/organisation', authMiddleware, filterByEtablissement(), organisationController);

    // Modules académiques multi-établissements avec filtrage
    app.use('/api/etablissements', authMiddleware, filterByEtablissement({ allowSuperAdminOverride: true }), etablissementController);
    app.use('/api/cycles', authMiddleware, filterByEtablissement(), cyclesController);
    app.use('/api/niveaux', authMiddleware, filterByEtablissement(), niveauxController);
    app.use('/api/filieres', authMiddleware, filterByEtablissement(), filieresController);
    app.use('/api/specialites', authMiddleware, filterByEtablissement(), specialitesController);
    app.use('/api/competences', authMiddleware, filterByEtablissement(), competencesController);
    app.use('/api/examens-nationaux', authMiddleware, filterByEtablissement(), examensNationauxController);
    app.use('/api/diplomes-eleves', authMiddleware, filterByEtablissement(), diplomesElevesController);
    app.use('/api/annees-scolaires', authMiddleware, filterByEtablissement(), anneesScolairesController);
    app.use('/api/personnel', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), personnelController);
    app.use('/api/personnel/contrats', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), contratController);
    app.use('/api/personnel/types-contrat', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), typeContratController);
    app.use('/api/personnel/affectations', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), affectationController);
    app.use('/api/personnel/parcours', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), parcoursPersonnelController);
    app.use('/api/personnel/heures-cours', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), heureCoursController);
    app.use('/api/personnel/absences', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), absencePersonnelController);
    app.use('/api/personnel/evaluations', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), evaluationController);
    app.use('/api/personnel/progressions', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), progressionProgrammeController);
    app.use('/api/personnel/bulletins', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), bulletinPaieController);
    app.use('/api/personnel/dashboard', requireModuleActive('personnel'), authMiddleware, filterByEtablissement(), personnelDashboardController);
    app.use('/api/classes', authMiddleware, filterByEtablissement(), classesController);
    app.use('/api/classes-annees', authMiddleware, filterByEtablissement(), classesAnneesController);
    app.use('/api/configuration-matiere-classe', authMiddleware, filterByEtablissement(), configurationMatiereClasseController);
    app.use('/api/scoring/config', authMiddleware, filterByEtablissement(), configurationScoringController);
    app.use('/api/matieres', authMiddleware, filterByEtablissement(), matieresController);
    app.use('/api/periodes', authMiddleware, filterByEtablissement(), periodesController);
    app.use('/api/periodes-templates', authMiddleware, filterByEtablissement(), templatesPeriodeController);
    app.use('/api/niveaux-periode', authMiddleware, filterByEtablissement(), niveauxPeriodeController);
    app.use('/api/usages-niveau', authMiddleware, filterByEtablissement(), usagesNiveauController);
    app.use('/api/programmes', requireModuleActive('programmes'), authMiddleware, filterByEtablissement(), programmesController);
    app.use('/api/eleves', authMiddleware, filterByEtablissement(), elevesController);
    app.use('/api/bulletins', authMiddleware, filterByEtablissement(), bulletinsController);
    app.use('/api/responsables-eleves', authMiddleware, filterByEtablissement(), responsablesElevesController);

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
