/**
 * ==================================
 * eLISAschool - Middleware de vérification des rôles et permissions
 * ==================================
 * Version: 3.0.0
 * Auteur: xAI Éducation
 * 
 * Middleware amélioré avec support des rôles ET permissions
 * Supporte le multi-rôles et le nouveau système RBAC dynamique
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { Role, Permission, DEFAULT_ROLE_PERMISSIONS } from '@shared/enums/roles.enum';
import { auditService } from '../services/audit.service';

/**
 * Crée un middleware qui vérifie si l'utilisateur a un des rôles requis
 * Supporte le multi-rôles (rôle principal + rôles secondaires)
 * @param roles - Liste des rôles autorisés
 */
export function requireRoles(...roles: (Role | string)[]): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Vérification de l'authentification
            if (!req.utilisateur) {
                throw new AppError('Non authentifié', 401, 'UNAUTHENTICATED');
            }

            // Récupérer tous les rôles de l'utilisateur (principal + secondaires)
            const userRole = req.utilisateur.role; // Rôle principal (backward compat)
            const userRoles = req.utilisateur.roles || [userRole]; // NOUVEAU : tous les rôles

            // Vérifier si l'utilisateur a au moins un des rôles requis
            const hasRequiredRole = roles.some(r => userRoles.includes(r));

            if (!hasRequiredRole) {
                // Log l'accès refusé
                await auditService.logAccessDenied(
                    req.utilisateur.id,
                    `Rôles requis: ${roles.join(', ')}. Rôles utilisateur: ${userRoles.join(', ')}`,
                    req
                );

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
 * Crée un middleware qui vérifie les rôles OU les permissions
 * Supporte le nouveau système RBAC dynamique avec fallback
 * @param options - Rôles et/ou permissions à vérifier
 */
export function requireAccess(options: {
    roles?: Role[];
    permissions?: Permission[];
    requireAll?: boolean;
}): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.utilisateur) {
                throw new AppError('Non authentifié', 401, 'UNAUTHENTICATED');
            }

            const userRole = req.utilisateur.role;
            const userRoles = req.utilisateur.roles || [userRole];

            // Super admin bypass
            if (userRoles.includes('SUPER_ADMIN')) {
                next();
                return;
            }

            let hasAccess = false;

            // Vérification par rôle
            if (options.roles?.length) {
                hasAccess = options.roles.some(r => userRoles.includes(r));
            }

            // Vérification par permission (si rôle insuffisant)
            if (!hasAccess && options.permissions?.length) {
                // Utiliser les permissions du JWT (nouveau système) ou fallback
                const userPermissions = req.utilisateur.permissions || [];
                
                if (userPermissions.length > 0) {
                    // Nouveau système : permissions dans le JWT
                    if (options.requireAll) {
                        hasAccess = options.permissions.every(p => userPermissions.includes(p));
                    } else {
                        hasAccess = options.permissions.some(p => userPermissions.includes(p));
                    }
                } else {
                    // Fallback : ancien système statique
                    const fallbackPermissions = DEFAULT_ROLE_PERMISSIONS[userRole as Role] || [];
                    if (options.requireAll) {
                        hasAccess = options.permissions.every(p => fallbackPermissions.includes(p));
                    } else {
                        hasAccess = options.permissions.some(p => fallbackPermissions.includes(p));
                    }
                }
            }

            if (!hasAccess) {
                await auditService.logAccessDenied(req.utilisateur.id, req.originalUrl, req);
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

/**
 * Middleware pour les enseignants et supérieurs
 */
export const teacherOnly = requireRoles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.CHEF_ETABLISSEMENT,
    Role.ENSEIGNANT
);

/**
 * Middleware pour les utilisateurs connectés (tous les rôles)
 */
export const authenticated = requireRoles(...Object.values(Role));

export default { requireRoles, requireAccess, adminOnly, managerOnly, staffOnly, teacherOnly, authenticated };
