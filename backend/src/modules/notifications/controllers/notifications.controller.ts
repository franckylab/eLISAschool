/**
 * ==================================
 * eLISAschool - Controller Notifications
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NotificationsService } from '../services/notifications.service';
import { createNotificationSchema, createBulkNotificationSchema, queryNotificationsSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const notificationsService = new NotificationsService();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/notifications
 * Liste des notifications de l'utilisateur
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryNotificationsSchema, req.query);
        const result = await notificationsService.findByUser(req.utilisateur!.id, query);

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
 * GET /api/notifications/count
 * Nombre de notifications non lues
 */
router.get('/count', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await notificationsService.countUnread(req.utilisateur!.id);

        res.status(200).json({
            success: true,
            data: { unreadCount: count },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications
 * Créer une notification (permission: notifications:create)
 */
router.post('/', requirePermission('notifications:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const createDto = validateDto(createNotificationSchema, req.body);
        const notification = await notificationsService.create(createDto, req.utilisateur!.id);

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification créée',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications/bulk
 * Créer des notifications en masse (permission: notifications:send:bulk)
 */
router.post('/bulk', requirePermission('notifications:send:bulk'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const createDto = validateDto(createBulkNotificationSchema, req.body);
        const count = await notificationsService.createBulk(createDto, req.utilisateur!.id);

        res.status(201).json({
            success: true,
            data: { count },
            message: `${count} notifications créées`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/notifications/:id/read
 * Marquer une notification comme lue
 */
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const notification = await notificationsService.markAsRead(id, req.utilisateur!.id);

        res.status(200).json({
            success: true,
            data: notification,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/notifications/read-all
 * Marquer toutes les notifications comme lues
 */
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await notificationsService.markAllAsRead(req.utilisateur!.id);

        res.status(200).json({
            success: true,
            data: { count },
            message: `${count} notifications marquées comme lues`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/notifications/:id
 * Supprimer une notification
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await notificationsService.remove(id, req.utilisateur!.id);

        res.status(200).json({
            success: true,
            message: 'Notification supprimée',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notifications/recentes
 * Récupérer les 10 notifications les plus récentes (pour le header)
 */
router.get('/recentes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await notificationsService.findByUser(req.utilisateur!.id, {
            page: 1,
            limit: 10,
        });

        res.status(200).json({
            success: true,
            data: result.items,
            count: result.total,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notifications/stats
 * Statistiques détaillées pour le centre de notifications
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        
        // Compter par statut
        const nonLues = await notificationsService.countUnread(userId);
        
        // Total des notifications
        const total = await notificationsService.countByUser(userId);
        
        // Compter par type (à implémenter si besoin)
        const stats = {
            total,
            nonLues,
            lues: total - nonLues,
        };

        res.status(200).json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications/:id/action
 * Exécuter une action liée à une notification (ex: voir bulletin)
 */
router.post('/:id/action', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        // Marquer comme lue automatiquement
        await notificationsService.markAsRead(id, req.utilisateur!.id);

        // Récupérer la notification pour extraire les metadata
        const notification = await notificationsService.getOne(id, req.utilisateur!.id);

        res.status(200).json({
            success: true,
            data: {
                action,
                metadata: notification.metadata,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

export const notificationsController = router;
export default router;
