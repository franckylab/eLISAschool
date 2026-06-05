/**
 * ==================================
 * eLISAschool - Middleware de vérification de permission
 * ==================================
 * Version: 2.0.0
 * 
 * Middleware Express qui vérifie si l'utilisateur a une permission spécifique.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';

/**
 * Middleware pour vérifier une permission
 * 
 * Usage :
 * router.post('/path', checkPermission('utilisateurs:manage'), handler);
 */
export function checkPermission(permission: string) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const utilisateur = req.utilisateur;
        
        if (!utilisateur) {
            throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
        }

        // Vérifier dans les permissions du JWT (nouveau système RBAC)
        const hasPerm = utilisateur.permissions?.includes(permission as any);
        
        // SUPER_ADMIN a toutes les permissions
        const isSuperAdmin = utilisateur.role === 'SUPER_ADMIN';

        if (!hasPerm && !isSuperAdmin) {
            throw new AppError(
                `Permission requise : ${permission}`,
                403,
                'FORBIDDEN'
            );
        }

        next();
    };
}

export default checkPermission;
