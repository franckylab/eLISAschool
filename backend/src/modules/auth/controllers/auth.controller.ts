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
import { permissionResolverService } from '../services/permission-resolver.service';
import { tokenService } from '../services/token.service';
import { auditService, AuditAction, AuditSeverity } from '../services/audit.service';
import { mfaService } from '../services/mfa.service';
import { AppDataSource } from '@database/data-source';
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
import { getClientIP } from '@common/utils/client-ip.util';
import { authMiddleware, UtilisateurAuth } from '../middlewares/auth.middleware';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { envConfig } from '@config/env.config';

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
            getClientIP(req),
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
            getClientIP(req),
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
 * GET /api/auth/blocage-status/:identifiant
 * Vérifie le statut de blocage d'un compte sans incrémenter les tentatives
 * Utilisé par le frontend pour le polling pendant le blocage
 * NOUVEAU: Retourne les détails du blocage à deux niveaux
 */
router.get('/blocage-status/:identifiant', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { identifiant } = req.params;
        const adresseIp = getClientIP(req);
        const userAgent = req.headers['user-agent'];
        
        const result = await authService.getBlocageStatus(identifiant, adresseIp, userAgent);

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
        const utilisateur = await authService.getCurrentUser(req.utilisateur!.id, req.utilisateur?.etablissementId);

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
        const currentEtablissement = req.utilisateur?.etablissementId;

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

        // Charger l'établissement et son rôle
        const utilisateurEtablissement = await AppDataSource.getRepository('UtilisateurEtablissement').findOne({
            where: { utilisateurId, etablissementId, actif: true },
            relations: ['role'],
        });

        if (!utilisateurEtablissement) {
            throw new AppError('Établissement non trouvé dans vos affectations', 404, 'NOT_FOUND');
        }

        // Re-résoudre les permissions pour le nouvel établissement
        const resolvedPermissions = await permissionResolverService.resolvePermissions(utilisateurId, etablissementId);
        const userRoles = await permissionResolverService.getUserRoles(utilisateurId, etablissementId);

        // Logger le changement pour audit
        await auditService.log(
            {
                utilisateurId,
                action: AuditAction.CONFIG_CHANGE,
                severity: AuditSeverity.INFO,
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
            email: req.utilisateur?.email,
            role: utilisateurEtablissement.role.code,
            roles: userRoles.map(r => r.code),
            permissions: Array.from(resolvedPermissions),
            etablissementId: etablissementId,
            etablissements: req.utilisateur?.etablissements || [],
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
                    role: utilisateurEtablissement.role.code,
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
            getClientIP(req),
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
            getClientIP(req),
            req.get('User-Agent')
        );

        // Audit connexion complète
        await auditService.log({
            utilisateurId,
            action: AuditAction.LOGIN,
            severity: AuditSeverity.INFO,
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

// ==========================================
// Endpoints MFA — Phase P1 v6
// ==========================================

/**
 * POST /api/auth/mfa/verify
 * Vérifie un code TOTP après login et finalise la connexion.
 * Body: { mfaToken: string, code: string }
 */
router.post('/mfa/verify', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mfaToken, code } = req.body;

        if (!mfaToken || !code) {
            throw new AppError('mfaToken et code requis', 400, 'MISSING_MFA_PARAMS');
        }

        // Vérifier le token MFA temporaire
        let payload: JwtPayload & { mfaPending?: boolean };
        try {
            const verified = jwt.verify(mfaToken, envConfig.jwt.secret, {
                issuer: 'eLISAschool',
                audience: 'elisaschool-api',
            });
            payload = verified as JwtPayload & { mfaPending?: boolean };
        } catch {
            throw new AppError('Token MFA invalide ou expiré. Veuillez vous reconnecter.', 401, 'INVALID_MFA_TOKEN');
        }

        if (!payload.mfaPending || !payload.sub) {
            throw new AppError('Token MFA invalide', 401, 'INVALID_MFA_TOKEN');
        }

        // Vérifier le code TOTP ou backup code
        let verifyResult = await mfaService.verifierMFA(payload.sub, code);
        if (!verifyResult.success) {
            // Essayer comme code de secours
            verifyResult = await mfaService.verifierBackupCode(payload.sub, code);
        }

        if (!verifyResult.success) {
            throw new AppError(verifyResult.message || 'Code MFA invalide', 401, 'INVALID_MFA_CODE');
        }

        // MFA vérifié → finaliser la connexion
        const loginResult = await authService.completeLoginAfterMFA(
            payload.sub,
            getClientIP(req),
            req.get('User-Agent')
        );

        res.status(200).json({
            success: true,
            data: loginResult,
            message: 'Connexion MFA vérifiée avec succès',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/mfa/setup
 * Initie la configuration MFA pour l'utilisateur connecté.
 * Retourne le secret, l'URL QR et les codes de secours.
 */
router.post('/mfa/setup', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur!.id;
        const email = req.utilisateur!.email;

        const result = await mfaService.setupMFA(utilisateurId, email);

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            severity: AuditSeverity.INFO,
            description: 'Setup MFA initié',
            module: 'auth',
        }, req);

        res.status(200).json({
            success: true,
            data: {
                secret: result.secret,
                qrCodeUrl: result.qrCodeUrl,
                backupCodes: result.backupCodes,
            },
            message: 'Configuration MFA initiée. Scannez le QR code avec votre application.',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/mfa/activate
 * Active le MFA après vérification du premier code TOTP.
 * Body: { code: string }
 */
router.post('/mfa/activate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur!.id;
        const { code } = req.body;

        if (!code) {
            throw new AppError('Code TOTP requis', 400, 'MISSING_CODE');
        }

        const result = await mfaService.activerMFA(utilisateurId, code);

        if (!result.success) {
            throw new AppError(result.message || 'Activation MFA échouée', 400, 'MFA_ACTIVATION_FAILED');
        }

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            severity: AuditSeverity.INFO,
            description: 'MFA activé',
            module: 'auth',
        }, req);

        res.status(200).json({
            success: true,
            message: 'MFA activé avec succès.',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/mfa/status
 * Vérifie le statut MFA de l'utilisateur connecté.
 */
router.get('/mfa/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur!.id;
        const status = await mfaService.getMFAStatus(utilisateurId);

        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/mfa/disable
 * Désactive le MFA pour l'utilisateur connecté.
 * Body: { code: string } — Code TOTP pour confirmation
 */
router.post('/mfa/disable', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur!.id;
        const { code } = req.body;

        if (!code) {
            throw new AppError('Code TOTP requis pour désactiver le MFA', 400, 'MISSING_CODE');
        }

        // Vérifier le code avant de désactiver
        const verifyResult = await mfaService.verifierMFA(utilisateurId, code);
        if (!verifyResult.success) {
            throw new AppError('Code TOTP invalide', 401, 'INVALID_MFA_CODE');
        }

        await mfaService.desactiverMFA(utilisateurId);

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            severity: AuditSeverity.WARNING,
            description: 'MFA désactivé',
            module: 'auth',
        }, req);

        res.status(200).json({
            success: true,
            message: 'MFA désactivé avec succès.',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/mfa/regenerate-backup-codes
 * Régénère les codes de secours MFA.
 * Body: { code: string } — Code TOTP pour confirmation
 */
router.post('/mfa/regenerate-backup-codes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const utilisateurId = req.utilisateur!.id;
        const { code } = req.body;

        if (!code) {
            throw new AppError('Code TOTP requis', 400, 'MISSING_CODE');
        }

        // Vérifier le code
        const verifyResult = await mfaService.verifierMFA(utilisateurId, code);
        if (!verifyResult.success) {
            throw new AppError('Code TOTP invalide', 401, 'INVALID_MFA_CODE');
        }

        const newCodes = await mfaService.regenererBackupCodes(utilisateurId);

        res.status(200).json({
            success: true,
            data: { backupCodes: newCodes },
            message: 'Codes de secours régénérés. Conservez-les en lieu sûr.',
        });
    } catch (error) {
        next(error);
    }
});

export const authController = router;
export default router;
