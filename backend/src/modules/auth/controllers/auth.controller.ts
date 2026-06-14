/**
 * ==================================
 * eLISAschool - Controller d'authentification
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { utilisateurEtablissementService } from '../services/utilisateur-etablissement.service';
import { etablissementSelectionService } from '../services/etablissement-selection.service';
import { tokenService } from '../services/token.service';
import { auditService } from '../services/audit.service';
import {
    loginSchema,
    registerSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    verifyEmailSchema,
    logoutSchema,
} from '../dto';
import { switchEtablissementSchema } from '../dto/utilisateur-etablissement.dto';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils';
import { logger } from '@common/utils/logger.util';
import { authMiddleware, UtilisateurAuth } from '../middlewares/auth.middleware';

const router = Router();
const authService = new AuthService();

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loginDto = validateDto(loginSchema, req.body);

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
        const registerDto = validateDto(registerSchema, req.body);

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
        const { refreshToken } = validateDto(refreshTokenSchema, req.body);

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
        const { refreshToken } = validateDto(logoutSchema, req.body);

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
        const forgotPasswordDto = validateDto(forgotPasswordSchema, req.body);

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
        const resetPasswordDto = validateDto(resetPasswordSchema, req.body);

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
        const changePasswordDto = validateDto(changePasswordSchema, req.body);

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
        const { token } = validateDto(verifyEmailSchema, req.body);

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

/**
 * POST /api/auth/switch-etablissement
 * Change l'établissement actif de l'utilisateur
 * Retourne un nouveau JWT avec le nouvel etablissementId
 * 
 * Requiert authentification
 */
router.post('/switch-etablissement', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId } = validateDto(switchEtablissementSchema, req.body);
        const utilisateurId = req.utilisateur!.id;

        // Vérifier que l'utilisateur a accès à cet établissement
        const hasAccess = await utilisateurEtablissementService.hasAccess(
            utilisateurId,
            etablissementId
        );

        if (!hasAccess) {
            throw new AppError(
                'Accès non autorisé à cet établissement',
                403,
                'ACCESS_DENIED'
            );
        }

        // Vérifier si le rôle permet le changement d'établissement
        const utilisateur = req.utilisateur! as any;
        const etablissements = utilisateur.etablissements || [];
        const currentEtablissement = utilisateur.etablissementId;
        const etablissementData = etablissements.find((e: any) => e.etablissementId === etablissementId);

        if (!etablissementData) {
            throw new AppError('Établissement non trouvé dans vos affectations', 404, 'NOT_FOUND');
        }

        // Logger le changement pour audit
        await auditService.log(
            {
                utilisateurId,
                action: 'CONFIG_EDIT' as any, // Utiliser action existante
                severity: 'INFO' as any,
                description: `Changement d'établissement: ${currentEtablissement} → ${etablissementId}`,
                module: 'auth',
                nouvellesValeurs: {
                    ancienEtablissementId: currentEtablissement,
                    nouvelEtablissementId: etablissementId,
                },
            },
            req
        );

        // Générer un nouveau JWT avec le nouvel établissement
        const payload = {
            sub: utilisateurId,
            email: utilisateur.email,
            role: utilisateur.role,
            roles: utilisateur.roles,
            permissions: utilisateur.permissions,
            etablissementId: etablissementId,
            etablissements: utilisateur.etablissements,
        };

        const newAccessToken = tokenService.generateAccessToken(payload as any);

        logger.info(`[${utilisateurId}] Switch établissement: ${currentEtablissement} → ${etablissementId}`);

        res.status(200).json({
            success: true,
            message: 'Établissement actif changé avec succès',
            data: {
                accessToken: newAccessToken,
                etablissementActif: {
                    id: etablissementId,
                    role: etablissementData.role,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/pre-login
 * Vérifie si l'utilisateur doit sélectionner un établissement
 * Retourne la liste des établissements si >1, ou indique connexion automatique
 * 
 * Requiert authentification (juste après validation credentials)
 */
router.post('/pre-login', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur!.id;
        
        const result = await etablissementSelectionService.preLogin(
            utilisateurId,
            req.ip,
            req.get('User-Agent')
        );

        res.status(200).json({
            success: true,
            data: result,
            message: result.requiereSelection 
                ? 'Sélection d\'établissement requise'
                : 'Connexion automatique possible',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/complete-login
 * Finalise la connexion après sélection d'établissement
 * Génère un token complet avec etablissementId et rôle contextuel
 * 
 * Requiert authentification (token temporaire)
 */
router.post('/complete-login', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId } = req.body;
        
        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT_ID');
        }

        const utilisateurId = req.utilisateur!.id;

        const result = await etablissementSelectionService.completeLogin(
            utilisateurId,
            etablissementId,
            req.ip,
            req.get('User-Agent')
        );

        // Audit connexion complète
        await auditService.log({
            utilisateurId,
            action: 'LOGIN' as any,
            severity: 'INFO' as any,
            description: `Connexion complète - Établissement: ${etablissementId}`,
            module: 'auth',
        }, req);

        res.status(200).json({
            success: true,
            data: result,
            message: 'Connexion établie avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/etablissements-disponibles
 * Récupère la liste des établissements disponibles pour l'utilisateur connecté
 * 
 * Requiert authentification
 */
router.get('/etablissements-disponibles', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur!.id;
        
        const etablissements = await etablissementSelectionService.getEtablissementsDisponibles(utilisateurId);

        res.status(200).json({
            success: true,
            data: etablissements,
        });
    } catch (error) {
        next(error);
    }
});

export const authController = router;
export default router;
