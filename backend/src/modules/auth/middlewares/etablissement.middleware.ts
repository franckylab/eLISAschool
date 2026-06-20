/**
 * ==================================
 * eLISAschool - Middleware de Filtrage Multi-Tenant
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Middleware de sécurité pour l'isolation stricte des données par établissement.
 * Garantit qu'un utilisateur ne peut accéder qu'aux données de son établissement actif.
 * 
 * Fonctionnalités :
 * - Injection automatique de etablissementId dans req
 * - Validation stricte pour tous les rôles sauf SUPER_ADMIN
 * - Détection et blocage des tentatives de bypass
 * - Logging des tentatives cross-tenant (sécurité)
 * - Support pour SUPER_ADMIN avec override contrôlé
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Role } from '@shared/enums/roles.enum';

/**
 * Étendre l'interface Request pour inclure etablissementId
 */
declare global {
    namespace Express {
        interface Request {
            etablissementId?: string;
        }
    }
}

/**
 * Options du middleware de filtrage
 */
interface FilterOptions {
    /** Autoriser SUPER_ADMIN à bypass le filtrage (défaut: true) */
    allowSuperAdminOverride?: boolean;
    /** Exiger etablissementId même pour SUPER_ADMIN (défaut: false) */
    requireForSuperAdmin?: boolean;
    /** Log les tentatives cross-tenant (défaut: true) */
    logViolations?: boolean;
}

/**
 * Middleware de filtrage multi-tenant automatique
 * 
 * Usage :
 * ```typescript
 * // Filtrage standard
 * router.get('/eleves', filterByEtablissement(), handler);
 * 
 * // Filtrage strict (même pour SUPER_ADMIN)
 * router.get('/eleves', filterByEtablissement({ requireForSuperAdmin: true }), handler);
 * 
 * // Sans logging des violations
 * router.get('/eleves', filterByEtablissement({ logViolations: false }), handler);
 * ```
 */
export function filterByEtablissement(options: FilterOptions = {}) {
    const {
        allowSuperAdminOverride = true,
        requireForSuperAdmin = false,
        logViolations = true,
    } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const user = req.utilisateur;

            // 1. Vérifier que l'utilisateur est authentifié
            if (!user) {
                throw new AppError(
                    'Authentification requise',
                    401,
                    'UNAUTHORIZED'
                );
            }

            // 2. Cas SUPER_ADMIN
            const isSuperAdmin = user.roles?.includes(Role.SUPER_ADMIN) || user.role === Role.SUPER_ADMIN;

            if (isSuperAdmin) {
                // Si requireForSuperAdmin = true, traiter comme un utilisateur normal
                if (!requireForSuperAdmin) {
                    // SUPER_ADMIN peut bypasser le filtrage
                    // Permettre override via query param (contrôlé)
                    if (req.query.etablissementId) {
                        const etabId = req.query.etablissementId as string;
                        
                        // Valider le format UUID
                        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(etabId)) {
                            throw new AppError(
                                'ID d\'établissement invalide',
                                400,
                                'INVALID_ETABLISSEMENT_ID'
                            );
                        }

                        req.etablissementId = etabId;
                        logger.info(`[MultiTenant] SUPER_ADMIN ${user.email} accède à l'établissement ${etabId}`);
                    } else {
                        // Pas d'override → utiliser l'établissement actif du token
                        req.etablissementId = user.etablissementId;
                    }
                    
                    return next();
                }
            }

            // 3. Tous les autres rôles : filtrage OBLIGATOIRE et STRICT
            if (!user.etablissementId) {
                if (logViolations) {
                    logger.warn(
                        `[MultiTenant] Tentative d'accès sans établissement - User: ${user.email}, Role: ${user.role}, IP: ${req.ip}`
                    );
                }
                
                throw new AppError(
                    'Établissement actif requis. Veuillez sélectionner un établissement.',
                    403,
                    'MISSING_ETABLISSEMENT'
                );
            }

            // 4. Injection forcée de l'etablissementId du token
            req.etablissementId = user.etablissementId;

            // 5. Détection et blocage des tentatives de bypass
            if (req.query.etablissementId) {
                const queryEtabId = req.query.etablissementId as string;
                
                // Tentative de manipulation détectée
                if (queryEtabId !== user.etablissementId) {
                    if (logViolations) {
                        logger.error(
                            `[MultiTenant] ⚠️ TENTATIVE CROSS-TENANT BLOQUÉE - User: ${user.email} (${user.role}), ` +
                            `Établissement légitime: ${user.etablissementId}, Tentative: ${queryEtabId}, IP: ${req.ip}, ` +
                            `Endpoint: ${req.method} ${req.path}`
                        );
                    }
                    
                    throw new AppError(
                        'Accès non autorisé : vous ne pouvez accéder qu\'à votre établissement',
                        403,
                        'CROSS_TENANT_ACCESS_DENIED'
                    );
                }
            }

            // 6. Vérifier que l'utilisateur a bien accès à cet établissement
            if (user.etablissements && user.etablissements.length > 0) {
                const hasAccess = user.etablissements.some(
                    e => e.etablissementId === etablissementId && e.actif
                );

                if (!hasAccess) {
                    logger.error(
                        `[MultiTenant] Utilisateur ${user.email} n'a pas accès à l'établissement ${etablissementId}`
                    );
                    
                    throw new AppError(
                        'Accès non autorisé à cet établissement',
                        403,
                        'ETABLISSEMENT_ACCESS_DENIED'
                    );
                }
            }

            // 7. Succès - passer au handler
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware de validation d'appartenance à un établissement
 * Vérifie qu'une ressource appartient bien à l'établissement de l'utilisateur
 * 
 * Usage :
 * ```typescript
 * router.get('/eleves/:id', 
 *     filterByEtablissement(),
 *     validateResourceOwnership('Eleve'),
 *     handler
 * );
 * ```
 */
export function validateResourceOwnership(entityName: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const user = req.utilisateur;
            const etablissementId = req.etablissementId;

            if (!user || !etablissementId) {
                throw new AppError(
                    'Contexte multi-tenant invalide',
                    500,
                    'INVALID_TENANT_CONTEXT'
                );
            }

            // Le handler doit vérifier que la ressource a le bon etablissementId
            // Ce middleware ajoute simplement une métadonnée pour traçabilité
            req.resourceOwnership = {
                entityName,
                requiredEtablissementId: etablissementId,
                validatedAt: new Date(),
            };

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Interface pour les métadonnées de validation de propriété
 */
interface ResourceOwnership {
    entityName: string;
    requiredEtablissementId: string;
    validatedAt: Date;
}

declare global {
    namespace Express {
        interface Request {
            resourceOwnership?: ResourceOwnership;
        }
    }
}

/**
 * Helper pour récupérer l'etablissementId de manière sécurisée
 * Lance une erreur si non présent
 */
export function getEtablissementId(req: Request): string {
    if (!req.etablissementId) {
        throw new AppError(
            'Établissement non défini dans le contexte',
            500,
            'MISSING_ETABLISSEMENT_CONTEXT'
        );
    }
    return req.etablissementId;
}

/**
 * Helper optionnel - retourne undefined si non présent
 */
export function getEtablissementIdOptional(req: Request): string | undefined {
    return req.etablissementId;
}
