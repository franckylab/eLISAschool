/**
 * ==================================
 * eLISAschool - Guard Accès Groupe
 * ==================================
 * Version: 1.0.0
 * 
 * Middleware pour vérifier l'accès à un groupe
 * avant d'exécuter une route.
 */

import { Request, Response, NextFunction } from 'express';
import { groupesService } from '../services/groupes.service';
import { AppError } from '@common/filters/error.filter';
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';

/**
 * Middleware pour vérifier l'accès à un groupe
 * Utilisé comme middleware de route
 * 
 * BYPASS automatique pour SUPER_ADMIN (tous les accès autorisés)
 * Pour les autres : propriétaire OU admin du groupe requis
 */
export async function requireGroupeAccess(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const groupeId = req.params.id;
        const utilisateurId = req.utilisateur?.id;
        const etablissementId = req.utilisateur?.etablissementId;

        if (!utilisateurId) {
            return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'));
        }

        // BYPASS SUPER_ADMIN : Vérifier d'abord si l'utilisateur est SUPER_ADMIN
        const userPermissions = await permissionResolverService.resolvePermissions(
            utilisateurId,
            etablissementId
        );

        // Si l'utilisateur a la permission 'super_admin:all', il a accès à TOUS les groupes
        if (userPermissions.has('super_admin:all')) {
            (req as any).groupeAccessBypassed = true; // Flag pour traçage
            return next();
        }

        // Pour les autres rôles : vérifier l'accès normal (propriétaire ou admin)
        const hasAccess = await groupesService.verifyAccess(groupeId, utilisateurId);
        
        if (!hasAccess) {
            return next(new AppError('Accès non autorisé au groupe', 403, 'ACCESS_DENIED'));
        }
        
        next();
    } catch (error) {
        next(error);
    }
}
