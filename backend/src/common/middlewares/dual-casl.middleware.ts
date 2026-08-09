/**
 * ==================================
 * eLISAschool - Dual CASL Middleware
 * ==================================
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 *
 * Résout le bon ability CASL selon le contexte de la route :
 * - /api/platform/* → definePlatformAbility (Control Plane)
 * - /api/* (tenant) → defineAbility (Data Plane)
 *
 * Attache req.ability et req.contexteType à la requête.
 */

import { Request, Response, NextFunction } from 'express';
import { definePlatformAbility, type PlatformAbility } from '@shared/casl/platform-abilities';
import { defineAbility, type AppAbility } from '@shared/casl/abilities';
import { AppDataSource } from '@database/data-source';
import { Membership } from '@modules/identite/entities/membership.entity';
import { ContexteType } from '@shared/enums/platform-roles.enum';
import { logger } from '@common/utils/logger.util';

/**
 * Extension de l'interface Request pour le dual CASL.
 */
declare global {
    namespace Express {
        interface Request {
            ability?: PlatformAbility | AppAbility;
            contexteType?: 'PLATEFORME' | 'TENANT';
            platformRole?: string | null;
        }
    }
}

const membershipRepo = AppDataSource.getRepository(Membership);

/**
 * Middleware Dual CASL.
 *
 * Algorithme :
 * 1. Si la route commence par /api/platform/ → résoudre le membership PLATEFORME
 *    et construire definePlatformAbility(role).
 * 2. Sinon → utiliser les permissions tenant existantes (req.utilisateur.permissions)
 *    et construire defineAbility(permissions, contexte).
 * 3. Attacher req.ability et req.contexteType.
 */
export async function dualCaslMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.utilisateur) {
            // Pas d'utilisateur authentifié → pas d'ability
            next();
            return;
        }

        const isPlatformRoute = req.path.startsWith('/api/platform/')
            || req.originalUrl.startsWith('/api/platform/');

        if (isPlatformRoute) {
            // =============================================
            // CONTROL PLANE — definePlatformAbility
            // =============================================

            // Résoudre le membership plateforme de l'utilisateur
            const membership = await membershipRepo.findOne({
                where: {
                    identiteId: req.utilisateur.id,
                    contexteType: ContexteType.PLATEFORME,
                    estActif: true,
                },
            });

            const platformRole = membership?.role || req.utilisateur.role || null;

            req.ability = definePlatformAbility(platformRole);
            req.contexteType = 'PLATEFORME';
            req.platformRole = platformRole;

            logger.debug(
                `[DualCASL] Platform → role=${platformRole}, path=${req.path}`,
            );
        } else {
            // =============================================
            // DATA PLANE — defineAbility (tenant)
            // =============================================

            const permissions = req.utilisateur.permissions || [];
            const etablissementId = req.utilisateur.etablissementId;

            req.ability = defineAbility(permissions, {
                etablissementId,
                role: req.utilisateur.role,
            });
            req.contexteType = 'TENANT';
            req.platformRole = null;

            logger.debug(
                `[DualCASL] Tenant → role=${req.utilisateur.role}, perms=${permissions.length}, path=${req.path}`,
            );
        }

        next();
    } catch (error) {
        logger.error('[DualCASL] Erreur résolution ability', error);
        // En cas d'erreur, continuer sans ability (les guards en aval décideront)
        next();
    }
}

export default dualCaslMiddleware;
