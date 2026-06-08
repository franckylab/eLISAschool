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

/**
 * Middleware pour vérifier l'accès à un groupe
 * Utilisé comme middleware de route
 */
export function requireGroupeAccess(req: Request, _res: Response, next: NextFunction): void {
    const groupeId = req.params.id;
    const utilisateurId = req.utilisateur?.id;

    if (!utilisateurId) {
        return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'));
    }

    groupesService
        .verifyAccess(groupeId, utilisateurId)
        .then(hasAccess => {
            if (!hasAccess) {
                return next(new AppError('Accès non autorisé au groupe', 403, 'ACCESS_DENIED'));
            }
            next();
        })
        .catch(next);
}
