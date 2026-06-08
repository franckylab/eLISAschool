/**
 * eLISAschool - Module Personnel/RH
 * Controller pour le dashboard et les statistiques du personnel
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { personnelDashboardService } from '../services/personnel-dashboard.service';

const router = Router();

// Obtenir le dashboard RH global
router.get(
    '/dashboard',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dashboard = await personnelDashboardService.getDashboardRH(
                (req as any).etablissementId
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
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await personnelDashboardService.getStatistiquesEnseignant(
                req.params.id,
                (req as any).etablissementId
            );
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }
);

export const personnelDashboardController = router;
