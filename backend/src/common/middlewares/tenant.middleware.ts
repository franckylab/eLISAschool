/**
 * ==================================
 * eLISAschool - Middleware Multi-Tenancy v4.0
 * ==================================
 * Version: 4.0.0
 * 
 * Filtre automatiquement les requêtes par établissement.
 * Supporte les utilisateurs multi-établissements.
 * 
 * NOUVEAU v4.0 :
 * - utilisateurs.etablissementId SUPPRIMÉ
 * - Résolution via utilisateur_etablissements uniquement
 * 
 * Comportement :
 * - SUPER_ADMIN : accès à tous les établissements (etablissementId optionnel dans le query)
 * - Autres rôles : utilise la table utilisateur_etablissements
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Role } from '@modules/auth/entities';
import { AppDataSource } from '@database/data-source';
import { UtilisateurEtablissement } from '@modules/auth/entities';

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
 * NOUVEAU v4.0 :
 * - utilisateurs.etablissementId SUPPRIMÉ
 * - Résolution via utilisateur_etablissements uniquement
 * 
 * Algorithme de sélection :
 * 1. SUPER_ADMIN → query param ou undefined
 * 2. Multi-établissements → query param (si autorisé) OU établissement principal
 * 3. Fallback : requête DB si JWT non mis à jour
 */
export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.utilisateur) {
            // Pas d'authentification → pas de filtrage
            next();
            return;
        }

        const userRole = req.utilisateur.role as unknown as Role;

        // 1. SUPER_ADMIN peut accéder à tous les établissements
        if (userRole === 'SUPER_ADMIN' as unknown as Role) {
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

        // 3. Fallback : récupérer depuis la table de jointure (si JWT non mis à jour)
        try {
            const ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);
            const affectations = await ueRepo.find({
                where: { utilisateurId: req.utilisateur.id, actif: true },
                order: { etablissementPrincipal: 'DESC' },
            });
            
            if (affectations.length === 0) {
                throw new AppError(
                    'Aucun établissement associé à votre compte',
                    403,
                    'NO_ETABLISSEMENT'
                );
            }

            // Priorité : établissement principal, sinon premier actif
            req.etablissementId = affectations[0].etablissementId;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                'Erreur lors de la résolution de l\'établissement',
                500,
                'TENANT_RESOLUTION_ERROR'
            );
        }
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
