/**
 * ==================================
 * eLISAschool - Controller Dashboard
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Endpoints REST pour le système de dashboard dynamique
 */

import { Router, Request, Response, NextFunction } from 'express';
import { widgetResolverService } from '../services/widget-resolver.service';
import { dataAggregatorService } from '../services/data-aggregator.service';
import { dashboardCacheService } from '../services/dashboard-cache.service';
import { dashboardSSEService } from '../services/dashboard-sse.service';
import { widgetFiltersSchema, saveLayoutSchema, performanceParamsSchema } from '../dtos/dashboard.dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils';
import { logger } from '@common/utils/logger.util';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/dashboard/widgets
 * Récupère tous les widgets disponibles pour l'utilisateur connecté
 */
router.get('/widgets', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const filters = validateDto(widgetFiltersSchema, req.query);
        const etablissementId = filters.etablissementId || req.utilisateur?.etablissementId;

        const result = await widgetResolverService.resolveWidgetsForUser(
            utilisateurId,
            etablissementId
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/widget/:widgetId/data
 * Récupère les données d'un widget spécifique
 */
router.get('/widget/:widgetId/data', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const { widgetId } = req.params;
        const filters = validateDto(widgetFiltersSchema, req.query);

        // Vérifier l'accès au widget
        const hasAccess = await widgetResolverService.checkWidgetAccess(widgetId, utilisateurId);
        if (!hasAccess) {
            throw new AppError('Accès non autorisé à ce widget', 403, 'INSUFFICIENT_PERMISSIONS');
        }

        // Récupérer les données du widget
        const widgetData = await dataAggregatorService.getWidgetData(widgetId, {
            userId: utilisateurId,
            etablissementId: filters.etablissementId || req.utilisateur?.etablissementId,
            periode: filters.periode,
            anneeScolaire: filters.anneeScolaire,
            filters: {
                module: filters.module,
                type: filters.type,
            },
        });

        res.json({
            success: true,
            data: widgetData,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/dashboard/widget/:widgetId/refresh
 * Force le rafraîchissement d'un widget (invalide le cache)
 */
router.post('/widget/:widgetId/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const { widgetId } = req.params;
        const { forceRefresh } = req.body;

        // Vérifier l'accès
        const hasAccess = await widgetResolverService.checkWidgetAccess(widgetId, utilisateurId);
        if (!hasAccess) {
            throw new AppError('Accès non autorisé à ce widget', 403, 'INSUFFICIENT_PERMISSIONS');
        }

        // Invalider le cache
        const cacheKey = `widget:data:${widgetId}:*`;
        dashboardCacheService.invalidateByPattern(cacheKey);

        logger.info(`[Dashboard] Widget ${widgetId} rafraîchi par user ${utilisateurId}`);

        res.json({
            success: true,
            message: 'Widget rafraîchi avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/layout
 * Récupère le layout actuel de l'utilisateur
 */
router.get('/layout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const etablissementId = req.query.etablissementId as string || req.utilisateur?.etablissementId;

        const widgets = await widgetResolverService.resolveWidgetsForUser(utilisateurId, etablissementId);

        res.json({
            success: true,
            data: {
                layout: widgets.layout,
                metadata: widgets.metadata,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/dashboard/layout
 * Sauvegarde le layout de l'utilisateur
 */
router.post('/layout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const dto = validateDto(saveLayoutSchema, req.body);
        const etablissementId = dto.etablissementId || req.utilisateur?.etablissementId;

        const layout = await widgetResolverService.saveUserLayout(
            utilisateurId,
            {
                nom: dto.nom,
                widgets: dto.widgets,
                actif: dto.actif,
            },
            etablissementId
        );

        res.json({
            success: true,
            data: layout,
            message: 'Layout sauvegardé avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/dashboard/layout
 * Réinitialise le layout de l'utilisateur (retour aux valeurs par défaut)
 */
router.delete('/layout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const etablissementId = req.query.etablissementId as string || req.utilisateur?.etablissementId;

        await widgetResolverService.resetUserLayout(utilisateurId, etablissementId);

        res.json({
            success: true,
            message: 'Layout réinitialisé avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/performance
 * Récupère les statistiques de performance du dashboard (Admin uniquement)
 */
router.get('/performance', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        // Vérifier que c'est un admin (à améliorer avec requireRoles)
        const userRole = req.utilisateur?.role;
        if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole!)) {
            throw new AppError('Accès réservé aux administrateurs', 403, 'INSUFFICIENT_PERMISSIONS');
        }

        const params = validateDto(performanceParamsSchema, req.query);
        const stats = dataAggregatorService.getPerformanceStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/dashboard/cache/clear
 * Vide le cache du dashboard (Admin uniquement)
 */
router.post('/cache/clear', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const userRole = req.utilisateur?.role;
        if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole!)) {
            throw new AppError('Accès réservé aux administrateurs', 403, 'INSUFFICIENT_PERMISSIONS');
        }

        const { scope } = req.body; // 'all', 'user', 'widget'

        if (scope === 'all') {
            dashboardCacheService.clear();
        } else if (scope === 'user') {
            const context = `${utilisateurId}:*`;
            dashboardCacheService.invalidateByPattern(context);
        } else {
            dashboardCacheService.clear();
        }

        res.json({
            success: true,
            message: 'Cache vidé avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/cache/stats
 * Statistiques du cache (Admin uniquement)
 */
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const userRole = req.utilisateur?.role;
        if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole!)) {
            throw new AppError('Accès réservé aux administrateurs', 403, 'INSUFFICIENT_PERMISSIONS');
        }

        const stats = dashboardCacheService.getStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/modules
 * Liste les modules disponibles pour le dashboard
 */
router.get('/modules', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { getWidgetsByModule } = await import('../utils/widget-registry');
        // P2.3 v7 — Lire les modules depuis le catalogue DB
        const { AppDataSource } = await import('@database/data-source');
        const { ModuleCatalogue } = await import('@modules/billing/entities/module-catalogue.entity');
        const catalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        const modulesCatalogue = await catalogueRepo.find({
            where: { estActif: true },
            order: { ordre: 'ASC', code: 'ASC' },
        });

        const modules = modulesCatalogue.map(mc => ({
            id: mc.code,
            nom: mc.nom,
            description: mc.description || '',
            icon: mc.icone,
            widgetCount: getWidgetsByModule(mc.code).length,
            actif: mc.actifParDefaut,
        }));

        res.json({
            success: true,
            data: modules,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/stream
 * Connexion SSE pour mises à jour temps réel
 */
router.get('/stream', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        logger.info(`[Dashboard] Connexion SSE pour user ${utilisateurId}`);
        
        // Ajouter le client SSE
        dashboardSSEService.addClient(utilisateurId, res);
        
        // La connexion reste ouverte jusqu'à déconnexion du client
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dashboard/sse/stats
 * Statistiques des connexions SSE (Admin)
 */
router.get('/sse/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        const userRole = req.utilisateur?.role;
        if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole!)) {
            throw new AppError('Accès réservé aux administrateurs', 403, 'INSUFFICIENT_PERMISSIONS');
        }

        const stats = dashboardSSEService.getStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
});

export const dashboardController = router;
export default router;
