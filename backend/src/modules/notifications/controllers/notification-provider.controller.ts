/**
 * ==================================
 * eLISAschool - Controller Notification Provider
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Routes CRUD pour la gestion des providers de notifications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NotificationProviderService } from '../services';
import {
    createNotificationProviderSchema,
    updateNotificationProviderSchema,
    testNotificationProviderSchema,
    queryNotificationProvidersSchema,
} from '../dto';
import { authMiddleware, adminOnly } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const providerService = new NotificationProviderService();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/notification-providers
 * Liste des providers (admin only)
 */
router.get('/', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryNotificationProvidersSchema, req.query);
        const result = await providerService.findAll(query);

        res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notification-providers/:id
 * Détails d'un provider (admin only)
 */
router.get('/:id', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const provider = await providerService.findOne(req.params.id);

        res.status(200).json({
            success: true,
            data: provider,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notification-providers
 * Créer un nouveau provider (admin only)
 */
router.post('/', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createNotificationProviderSchema, req.body);
        const provider = await providerService.create(dto);

        res.status(201).json({
            success: true,
            data: provider,
            message: 'Provider créé avec succès',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/notification-providers/:id
 * Mettre à jour un provider (admin only)
 */
router.patch('/:id', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateNotificationProviderSchema, req.body);
        const provider = await providerService.update(req.params.id, dto);

        res.status(200).json({
            success: true,
            data: provider,
            message: 'Provider mis à jour',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/notification-providers/:id
 * Supprimer un provider (admin only)
 */
router.delete('/:id', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await providerService.remove(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Provider supprimé',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notification-providers/:id/toggle
 * Activer/désactiver un provider (admin only)
 */
router.post('/:id/toggle', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const provider = await providerService.toggle(req.params.id);

        res.status(200).json({
            success: true,
            data: provider,
            message: `Provider ${provider.actif ? 'activé' : 'désactivé'}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notification-providers/:id/set-default
 * Définir un provider comme défaut (admin only)
 */
router.post('/:id/set-default', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const provider = await providerService.setDefault(req.params.id);

        res.status(200).json({
            success: true,
            data: provider,
            message: 'Provider défini par défaut',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notification-providers/:id/test
 * Tester la configuration d'un provider (admin only)
 */
router.post('/:id/test', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testConfig = req.body.configuration 
            ? validateDto(testNotificationProviderSchema, req.body).configuration 
            : undefined;
        
        const result = await providerService.testProvider(req.params.id, testConfig);

        res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

export const notificationProviderController = router;
export default router;
