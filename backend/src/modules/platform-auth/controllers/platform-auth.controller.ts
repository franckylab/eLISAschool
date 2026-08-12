/**
 * ==================================
 * eLISAschool - Contrôleur Platform Auth (Compatibilité ADR-005)
 * ==================================
 * Version: 2.0.0 — ADR-005 (v11)
 *
 * Endpoints de compatibilité pour /api/platform/auth/*.
 * Délègue au auth.service.ts unifié (source unique de vérité).
 *
 * ADR-005 : Plus de login dual-plane. Un seul login via utilisateurs table.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateDto } from '@common/utils/validate-dto.util';
import { platformLoginSchema } from '../dto/platform-auth.dto';
import { authService } from '@modules/auth/services/auth.service';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

/**
 * POST /api/platform/auth/login
 * Login unifié via auth.service.ts (ADR-005 — source unique de vérité).
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, motDePasse } = validateDto(platformLoginSchema, req.body);
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const result = await authService.login({ email, motDePasse }, ip, userAgent, req);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/auth/logout
 * Logout — révoque la session en cours.
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur?.id;
        if (!utilisateurId) {
            throw new AppError('Non authentifié', 401, 'NOT_AUTHENTICATED');
        }
        await authService.logout(utilisateurId);
        res.json({ success: true, message: 'Déconnexion réussie' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/auth/me
 * Profil de l'utilisateur plateforme authentifié.
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateur = req.utilisateur;
        if (!utilisateur) {
            throw new AppError('Non authentifié', 401, 'NOT_AUTHENTICATED');
        }
        res.json({
            success: true,
            data: {
                id: utilisateur.id,
                email: utilisateur.email,
                role: utilisateur.role,
                plane: 'platform',
            },
        });
    } catch (error) {
        next(error);
    }
});

export const platformAuthController = router;
export default router;
