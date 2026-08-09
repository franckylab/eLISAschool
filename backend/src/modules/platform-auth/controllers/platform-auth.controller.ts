/**
 * ==================================
 * eLISAschool - Contrôleur Platform Auth
 * ==================================
 * Version: 1.0.0
 *
 * Endpoints:
 * POST /api/platform/auth/login  — Login plateforme (MFA obligatoire)
 * POST /api/platform/auth/logout — Logout + révocation session
 * POST /api/platform/auth/refresh — Refresh token
 * GET  /api/platform/auth/me     — Profil utilisateur courant
 *
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateDto } from '@common/utils/validate-dto.util';
import { platformLoginSchema } from '../dto/platform-auth.dto';
import { platformAuthService } from '../services/platform-auth.service';
import { authMiddleware } from '@modules/auth/middlewares';

const router = Router();

/**
 * POST /api/platform/auth/login
 * Login plateforme — résout identité, vérifie mot de passe, retourne JWT scopé.
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, motDePasse } = validateDto(platformLoginSchema, req.body);
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const result = await platformAuthService.login(email, motDePasse, ip, userAgent);
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
        const identiteId = (req as any).utilisateur?.id;
        await platformAuthService.logout(identiteId);
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
        const identiteId = (req as any).utilisateur?.id;
        const data = await platformAuthService.getMe(identiteId);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

export const platformAuthController = router;
export default router;
