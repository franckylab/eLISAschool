/**
 * ==================================
 * eLISAschool - Middleware Multi-Tenancy v2.0
 * ==================================
 * Version: 2.0.0
 * 
 * Filtre automatiquement les requêtes par établissement.
 * Supporte désormais les utilisateurs multi-établissements.
 * 
 * Comportement :
 * - SUPER_ADMIN : accès à tous les établissements (etablissementId optionnel dans le query)
 * - Utilisateurs multi-établissements : utilise le query param ou l'établissement principal
 * - Utilisateurs single-établissement (legacy) : utilise l'etablissementId du JWT
 * - Autres rôles : utilise l'etablissementId du JWT (obligatoire)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Role } from '@modules/auth/entities';

/**
 * Interface pour les établissements dans le JWT
 */
interface JwtEtablissement {
    etablissementId: string;
    role: string;
    etablissementPrincipal: boolean;
    actif: boolean;
}

/**
 * Middleware multi-tenancy : attache l'etablissementId à la requête
 * 
 * Algorithme de sélection :
 * 1. SUPER_ADMIN → query param ou undefined
 * 2. Multi-établissements → query param (si autorisé) OU établissement principal
 * 3. Single-établissement (legacy) → etablissementId du JWT
 * 4. Erreur si aucun établissement trouvé
 */
export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
    try {
        if (!req.utilisateur) {
            // Pas d'authentification → pas de filtrage
            next();
            return;
        }

        const userRole = req.utilisateur.role as Role;

        // 1. SUPER_ADMIN peut accéder à tous les établissements
        if (userRole === Role.SUPER_ADMIN) {
            const queryEtablissementId = req.query.etablissementId as string | undefined;
            req.etablissementId = queryEtablissementId || undefined;
            next();
            return;
        }

        // 2. Support multi-établissements (v2.0)
        const etablissements: JwtEtablissement[] = req.utilisateur.etablissements || [];
        
        if (etablissements.length > 0) {
            const requestedId = req.query.etablissementId as string | undefined;
            
            if (requestedId) {
                // L'utilisateur demande un établissement spécifique
                const hasAccess = etablissements.some(
                    e => e.etablissementId === requestedId && e.actif
                );
                
                if (!hasAccess) {
                    throw new AppError(
                        'Accès non autorisé à cet établissement',
                        403,
                        'ACCESS_DENIED'
                    );
                }
                
                req.etablissementId = requestedId;
                logger.info(`[Multi-tenancy] Utilisateur ${req.utilisateur.id} switch vers ${requestedId}`);
            } else {
                // Utiliser l'établissement principal
                const principal = etablissements.find(e => e.etablissementPrincipal);
                
                if (principal) {
                    req.etablissementId = principal.etablissementId;
                } else if (etablissements.length > 0 && etablissements[0].actif) {
                    // Fallback : premier établissement actif
                    req.etablissementId = etablissements[0].etablissementId;
                } else {
                    throw new AppError(
                        'Aucun établissement actif associé à votre compte',
                        403,
                        'NO_ACTIVE_ETABLISSEMENT'
                    );
                }
            }
            
            next();
            return;
        }

        // 3. Legacy : single-établissement (compatibilité ascendante)
        const userEtablissementId = req.utilisateur.etablissementId;
        
        if (!userEtablissementId) {
            throw new AppError(
                'Aucun établissement associé à votre compte',
                403,
                'NO_ETABLISSEMENT'
            );
        }

        req.etablissementId = userEtablissementId;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware optionnel : attache l'etablissementId sans erreur si absent
 */
export function optionalTenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (req.utilisateur?.etablissementId) {
        req.etablissementId = req.utilisateur.etablissementId;
    }
    next();
}

export default tenantMiddleware;
