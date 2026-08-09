/**
 * ==================================
 * eLISAschool - Role-Based Access Middleware
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Middleware de vérification de rôle pour les routes.
 * Réintroduit pour le guard global platform (SUPER_ADMIN).
 * Complète requirePermission() — utiliser selon le contexte.
 *
 * Plan v7.1 — Panel Admin Enterprise
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';

/**
 * Vérifie que l'utilisateur authentifié possède l'un des rôles requis.
 *
 * @param roles - Rôles autorisés (ex: ['SUPER_ADMIN'])
 * @returns Middleware Express
 *
 * @example
 * router.use('/platform', requireRole(['SUPER_ADMIN']));
 */
export function requireRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.utilisateur) {
            throw new AppError('Non authentifié', 401, 'UNAUTHENTICATED');
        }

        const userRole = req.utilisateur.role;
        if (!roles.includes(userRole)) {
            throw new AppError(
                `Accès réservé aux rôles: ${roles.join(', ')}. Votre rôle: ${userRole}`,
                403,
                'INSUFFICIENT_ROLE'
            );
        }

        next();
    };
}
