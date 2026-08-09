/**
 * ==================================
 * eLISAschool - Contrôleur Sessions Plateforme
 * ==================================
 * Version: 1.0.0
 *
 * Endpoints:
 * GET    /api/platform/sessions       — Liste sessions actives
 * DELETE /api/platform/sessions/:id   — Révoquer une session
 * DELETE /api/platform/sessions/all   — Révoquer toutes les sessions
 *
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { platformSessionsService } from '../services/platform-sessions.service';

const router = Router();

/**
 * GET /api/platform/sessions
 * Liste toutes les sessions actives plateforme.
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const sessions = await platformSessionsService.getAllActiveSessions();
        res.json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/sessions/:id
 * Révoque une session spécifique.
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await platformSessionsService.revokeSession(req.params.id);
        res.json({ success: true, message: 'Session révoquée' });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/sessions/all
 * Révoque toutes les sessions de l'utilisateur courant.
 */
router.delete('/all', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurPlateformeId = (req as any).utilisateur?.id;
        const count = await platformSessionsService.revokeAllSessions(utilisateurPlateformeId);
        res.json({ success: true, message: `${count} session(s) révoquée(s)` });
    } catch (error) {
        next(error);
    }
});

export const platformSessionsController = router;
export default router;
