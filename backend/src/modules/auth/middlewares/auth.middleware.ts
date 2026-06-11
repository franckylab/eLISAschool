/**
 * ==================================
 * eLISAschool - Middleware d'authentification JWT
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Interface utilisateur authentifié
 */
/**
 * Utilisateur authentifié (attaché à la requête)
 */
export interface UtilisateurAuth {
    id: string;
    email: string;
    role: string; // Rôle principal (backward compat)
    roles?: string[]; // NOUVEAU : tous les rôles
    permissions?: string[]; // NOUVEAU : permissions résolues
    etablissementId?: string;
    etablissements?: Array<{
        etablissementId: string;
        role: string;
        etablissementPrincipal: boolean;
        actif: boolean;
    }>;
}

const tokenService = new TokenService();

/**
 * Middleware d'authentification JWT
 * Vérifie le token et attache l'utilisateur à la requête
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        // Récupération du token depuis le header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Token d\'authentification manquant', 401, 'MISSING_TOKEN');
        }

        const token = authHeader.substring(7); // Supprime "Bearer "

        // Vérification du token
        const payload = tokenService.verifyAccessToken(token);

        if (!payload) {
            throw new AppError('Token invalide ou expiré', 401, 'INVALID_TOKEN');
        }

        // Attache l'utilisateur à la requête
        req.utilisateur = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            roles: payload.roles || [payload.role], // NOUVEAU : tous les rôles
            permissions: payload.permissions, // NOUVEAU : permissions résolues
            etablissementId: payload.etablissementId,
            etablissements: payload.etablissements, // NOUVEAU : multi-établissements
        };

        // DEBUG: Logger les rôles pour diagnostiquer les problèmes 403
        if (process.env.NODE_ENV === 'development') {
            const { role, roles, email } = req.utilisateur;
            console.log(`[Auth Middleware] Utilisateur: ${email}, Role: ${role}, Roles: ${JSON.stringify(roles)}`);
        }

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si le token est absent, mais l'attache s'il est présent
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = tokenService.verifyAccessToken(token);

            if (payload) {
                req.utilisateur = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                    roles: payload.roles || [payload.role], // NOUVEAU : tous les rôles
                    permissions: payload.permissions, // NOUVEAU : permissions résolues
                    etablissementId: payload.etablissementId,
                    etablissements: payload.etablissements, // NOUVEAU : multi-établissements
                };
            }
        }

        next();
    } catch (error) {
        // On ignore les erreurs d'authentification optionnelle
        next();
    }
}

export default authMiddleware;
