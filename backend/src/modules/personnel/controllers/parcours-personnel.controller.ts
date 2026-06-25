/**
 * ==================================
 * eLISAschool - Controller Parcours Professionnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { parcoursPersonnelService } from '../services/parcours-personnel.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';

const router = Router();

/**
 * GET /api/personnel/membres/:id/parcours-complet
 * Récupérer le parcours professionnel complet d'un membre
 */
router.get(
    '/membres/:id/parcours-complet',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parcours = await parcoursPersonnelService.getParcoursComplet(
                req.params.id,
                req.etablissementId!
            );
            res.json({ success: true, data: parcours });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/membres/:id/parcours-resume
 * Récupérer un résumé du parcours (pour les listes)
 */
router.get(
    '/membres/:id/parcours-resume',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const resume = await parcoursPersonnelService.getResumeParcours(
                req.params.id,
                req.etablissementId!
            );
            res.json({ success: true, data: resume });
        } catch (error) {
            next(error);
        }
    }
);

export const parcoursPersonnelController = router;
export default router;
