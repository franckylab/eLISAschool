/**
 * eLISAschool - Module Personnel/RH
 * Controller pour le dashboard et les statistiques du personnel
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { personnelDashboardService } from '../services/personnel-dashboard.service';

const router = Router();

// Obtenir le dashboard RH global
router.get(
    '/dashboard',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dashboard = await personnelDashboardService.getDashboardRH(
                req.etablissementId!
            );
            res.json({ success: true, data: dashboard });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir les statistiques d'un enseignant
router.get(
    '/dashboard/enseignants/:id',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await personnelDashboardService.getStatistiquesEnseignant(
                req.params.id,
                req.etablissementId!
            );
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }
);

export const personnelDashboardController = router;
