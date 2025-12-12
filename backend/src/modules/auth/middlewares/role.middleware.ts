/**
 * ==================================
 * eLISAschool - Middleware de vérification des rôles
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { Role } from '../entities';

/**
 * Crée un middleware qui vérifie si l'utilisateur a un des rôles requis
 * @param roles - Liste des rôles autorisés
 */
export function requireRoles(...roles: (Role | string)[]): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Vérification de l'authentification
            if (!req.utilisateur) {
                throw new AppError('Non authentifié', 401, 'UNAUTHENTICATED');
            }

            // Vérification du rôle
            const userRole = req.utilisateur.role;

            if (!roles.includes(userRole)) {
                throw new AppError(
                    'Vous n\'avez pas les permissions nécessaires pour cette action',
                    403,
                    'INSUFFICIENT_PERMISSIONS'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware pour administrateurs uniquement
 */
export const adminOnly = requireRoles(Role.SUPER_ADMIN, Role.ADMIN);

/**
 * Middleware pour les gestionnaires (admin + chef d'établissement)
 */
export const managerOnly = requireRoles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.CHEF_ETABLISSEMENT
);

/**
 * Middleware pour le personnel (admin + chef + enseignants + personnel)
 */
export const staffOnly = requireRoles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.CHEF_ETABLISSEMENT,
    Role.ENSEIGNANT,
    Role.PERSONNEL,
    Role.RESPONSABLE_CANTINE,
    Role.RESPONSABLE_TRANSPORT
);

export default requireRoles;
