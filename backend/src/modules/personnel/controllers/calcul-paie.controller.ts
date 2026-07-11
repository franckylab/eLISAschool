import { Router, Request, Response, NextFunction } from 'express';
import { calculPaieService } from '../services/calcul-paie.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';

const router = Router();

router.post('/calculer/:membrePersonnelId', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mois, annee } = req.body;
        const bulletin = await calculPaieService.calculerBulletin(
            req.params.membrePersonnelId,
            mois,
            annee,
            req.etablissementId!,
            { userId: req.utilisateur?.id, req }
        );
        res.status(201).json({ success: true, data: bulletin });
    } catch (e) { next(e); }
});

router.post('/simuler/:membrePersonnelId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mois, annee } = req.body;
        const simulation = await calculPaieService.simulerPaie(
            req.params.membrePersonnelId,
            req.etablissementId!,
            mois,
            annee
        );
        res.json({ success: true, data: simulation });
    } catch (e) { next(e); }
});

export const calculPaieController = router;
export default router;
