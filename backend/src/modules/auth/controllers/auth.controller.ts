/**
 * ==================================
 * eLISAschool - Controller d'authentification
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import {
    loginSchema,
    registerSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    verifyEmailSchema,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { authMiddleware, UtilisateurAuth } from '../middlewares/auth.middleware';

// Extension de Request pour inclure l'utilisateur authentifié
declare global {
    namespace Express {
        interface Request {
            utilisateur?: UtilisateurAuth;
        }
    }
}

const router = Router();
const authService = new AuthService();

/**
 * Helper pour valider les données avec Zod
 */
function validateBody(schema: any, body: unknown): any {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', true, { errors });
    }
    return result.data;
}

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loginDto = validateBody(loginSchema, req.body);

        const result = await authService.login(
            loginDto,
            req.ip,
            req.get('User-Agent')
        );

        res.status(200).json({
            success: true,
            data: result,
            message: 'Connexion réussie',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const registerDto = validateBody(registerSchema, req.body);

        const result = await authService.register(registerDto);

        res.status(201).json({
            success: true,
            data: result,
            message: 'Inscription réussie',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/refresh
 * Rafraîchissement des tokens
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = validateBody(refreshTokenSchema, req.body);

        const result = await authService.refreshTokens(
            refreshToken,
            req.ip,
            req.get('User-Agent')
        );

        res.status(200).json({
            success: true,
            data: result,
            message: 'Tokens rafraîchis',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Déconnexion
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await authService.logout(refreshToken);
        }

        res.status(200).json({
            success: true,
            message: 'Déconnexion réussie',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout-all
 * Déconnexion de toutes les sessions
 * Requiert authentification
 */
router.post('/logout-all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authService.logoutAll(req.utilisateur!.id);

        res.status(200).json({
            success: true,
            message: 'Toutes les sessions ont été fermées',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const forgotPasswordDto = validateBody(forgotPasswordSchema, req.body);

        const result = await authService.forgotPassword(forgotPasswordDto);

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
 * POST /api/auth/reset-password
 * Réinitialisation du mot de passe
 */
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resetPasswordDto = validateBody(resetPasswordSchema, req.body);

        const result = await authService.resetPassword(resetPasswordDto);

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
 * POST /api/auth/change-password
 * Changement de mot de passe (utilisateur connecté)
 * Requiert authentification
 */
router.post('/change-password', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const changePasswordDto = validateBody(changePasswordSchema, req.body);

        const result = await authService.changePassword(
            req.utilisateur!.id,
            changePasswordDto
        );

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
 * POST /api/auth/verify-email
 * Vérification de l'email
 */
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = validateBody(verifyEmailSchema, req.body);

        const result = await authService.verifyEmail(token);

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
 * GET /api/auth/me
 * Récupère l'utilisateur courant
 * Requiert authentification
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateur = await authService.getCurrentUser(req.utilisateur!.id);

        res.status(200).json({
            success: true,
            data: utilisateur,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

export const authController = router;
export default router;
