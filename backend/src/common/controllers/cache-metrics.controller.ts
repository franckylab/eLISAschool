/**
 * ==================================
 * eLISAschool - Controller Métriques Cache
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cacheMetricsService } from '@common/services/cache-metrics.service';
import { redisService } from '@common/services/redis.service';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { logger } from '@common/utils/logger.util';

const router = Router();

// ==================================
// ROUTES ADMIN - Monitoring
// ==================================

/**
 * GET /api/cache/metrics
 * Obtenir les métriques complètes du cache
 */
router.get('/metrics', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = await cacheMetricsService.getMetrics();
        res.json({ success: true, data: metrics });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cache/health
 * Vérifier l'état de santé du cache Redis
 */
router.get('/health', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const estHealthy = await redisService.isAvailable();
        
        res.json({
            success: true,
            data: {
                redis: estHealthy,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cache/rapport
 * Générer un rapport de performance texte
 */
router.get('/rapport', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rapport = cacheMetricsService.genererRapport();
        
        res.json({
            success: true,
            data: { rapport },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/cache/reset-stats
 * Réinitialiser les statistiques de performance
 */
router.post('/reset-stats', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        cacheMetricsService.resetStats();

        logger.info('[Cache] Statistiques réinitialisées', {
            utilisateurId: req.utilisateur?.id,
        });

        res.json({
            success: true,
            message: 'Statistiques de cache réinitialisées',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/cache/keys
 * Lister les clés de cache (pour debug)
 */
router.get('/keys', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { pattern = '*' } = req.query;
        const cles = await redisService.keys(pattern as string);

        res.json({
            success: true,
            data: {
                count: cles.length,
                keys: cles.slice(0, 100), // Limiter à 100 clés
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/cache/flush
 * Vider le cache Redis (DANGEREUX)
 */
router.delete('/flush', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await redisService.flush();

        logger.warn('[Cache] Cache Redis vidé manuellement', {
            utilisateurId: req.utilisateur?.id,
        });

        res.json({
            success: true,
            message: 'Cache Redis vidé avec succès',
        });
    } catch (error) {
        next(error);
    }
});

export const cacheMetricsController = router;
