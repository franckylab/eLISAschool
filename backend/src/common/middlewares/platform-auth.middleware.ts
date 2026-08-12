/**
 * ==================================
 * eLISAschool - Middleware Auth Plateforme (Control Plane)
 * ==================================
 * Version: 2.0.0 — ADR-005 (v11)
 * Auteur: franck arlos chendjou
 *
 * ADR-005 : Source unique de vérité (utilisateurs).
 * Plus de Membership — vérifie directement utilisateurs.estPlateforme + role.
 *
 * Flow :
 * - Extraire le Bearer token
 * - Vérifier via tokenService (rotation de secrets)
 * - Rejeter si plane !== 'platform' (un token tenant ne peut pas accéder à /api/platform/*)
 * - Attacher req.utilisateur + req.platformRole
 */

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@modules/auth/services/token.service';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

const tokenService = new TokenService();

/**
 * Middleware d'authentification dédié aux routes plateforme.
 *
 * ADR-005 : Utilise les claims JWT (plus de résolution Membership).
 * - Rejette les tokens sans claim `plane: 'platform'`
 * - Attache req.utilisateur et req.platformRole depuis le JWT
 */
export async function platformAuthMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> {
    (async () => {
        // 1. Extraire le token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Token d\'authentification manquant', 401, 'MISSING_TOKEN');
        }

        const token = authHeader.substring(7);

        // 2. Vérifier le token (rotation de secrets — token.service.ts GAP 8)
        const payload = tokenService.verifyAccessToken(token);
        if (!payload) {
            logger.warn('[PlatformAuth] Token plateforme invalide ou expiré', {
                tokenPrefix: token.substring(0, 20) + '...',
                path: req.path,
            });
            throw new AppError('Token invalide ou expiré', 401, 'INVALID_TOKEN');
        }

        // 3. Protection cross-plane : exiger plane === 'platform'
        if (payload.plane !== 'platform') {
            logger.error(
                `[PlatformAuth] CRITIQUE — Token tenant sur route plateforme — ` +
                `User: ${payload.sub}, plane: ${payload.plane || 'absent'}, ` +
                `role: ${payload.role}, path: ${req.path}`,
            );
            throw new AppError(
                'Token incompatible avec les routes plateforme',
                403,
                'WRONG_PLANE_TOKEN',
            );
        }

        // 4. Attacher l'utilisateur à la requête (ADR-005 : depuis JWT, plus de Membership)
        req.utilisateur = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            roles: payload.roles || [payload.role],
            permissions: [],
            plane: 'platform',
            etablissementId: payload.etablissementId,
            etablissements: payload.etablissements,
        };

        // ADR-005 : platformRole depuis le rôle JWT (plus de membership)
        req.platformRole = payload.role || null;
        req.contexteType = 'PLATEFORME';

        // DEBUG
        if (process.env.NODE_ENV === 'development') {
            logger.debug(
                `[PlatformAuth] ${req.utilisateur.email} — role=${payload.role}, ` +
                `platformRole=${req.platformRole}, path=${req.path}`,
            );
        }

        next();
    })().catch(next);
}

export default platformAuthMiddleware;
