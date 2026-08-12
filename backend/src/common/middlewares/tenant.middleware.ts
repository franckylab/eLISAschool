/**
 * ==================================
 * eLISAschool - Middleware Multi-Tenancy v5.3
 * ==================================
 * Version: 5.3.0
 * 
 * Filtre automatiquement les requêtes par établissement.
 * Supporte les utilisateurs multi-établissements.
 * 
 * [RBAC-3] v5.1 — Renforcement sécurité :
 * - Validation existence établissement pour SUPER_ADMIN
 * - Logging des tentatives cross-tenant
 * - Préfixage cache par tenant
 * 
 * Durcissement v9 — v5.2 :
 * - G6 : Vérification etablissements TOUJOURS en base (pas de confiance au JWT seul)
 * - Cache Redis TTL 5 min pour éviter un query DB à chaque requête
 * - Invalidation du cache à chaque modification de utilisateur_etablissements
 * 
 * Audit sécurité v10 — v5.3 :
 * - GAP 3 : Suppression du double next() (ligne 217 supprimée)
 * - GAP 10 : Remplacement des string casts par Role.SUPER_ADMIN (enum)
 * 
 * Comportement :
 * - SUPER_ADMIN : accès à tous les établissements (etablissementId optionnel dans le query)
 * - Autres rôles : vérification via table utilisateur_etablissements (DB + cache Redis)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Role } from '@modules/auth/entities';
import { AppDataSource } from '@database/data-source';
import { UtilisateurEtablissement } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { redisService } from '@common/services/redis.service';

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
 * Cache Redis TTL pour les affectations utilisateur (5 minutes).
 * Évite un query DB à chaque requête tout en restant réactif.
 */
const TENANT_CACHE_TTL = 300; // 5 minutes

/**
 * Durcissement v9 — G6 : Vérifie les etablissements en base (pas de confiance au JWT).
 * Utilise un cache Redis TTL 5 min pour la performance.
 * 
 * @returns Liste des affectations actives depuis la DB (ou cache Redis)
 */
async function getAffectationsFromDB(
    utilisateurId: string,
): Promise<{ etablissementId: string; etablissementPrincipal: boolean; actif: boolean }[]> {
    const cacheKey = `tenant:affectations:${utilisateurId}`;

    // 1. Cache Redis
    try {
        const cached = await redisService.getJSON<{
            affectations: { etablissementId: string; etablissementPrincipal: boolean; actif: boolean }[];
        }>(cacheKey);
        if (cached?.affectations) {
            return cached.affectations;
        }
    } catch {
        // Redis indisponible, continuer vers DB
    }

    // 2. DB — Source de vérité
    const ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);
    const affectations = await ueRepo.find({
        where: { utilisateurId, actif: true },
        select: ['etablissementId', 'etablissementPrincipal', 'actif'],
        order: { etablissementPrincipal: 'DESC' },
    });

    const result = affectations.map(a => ({
        etablissementId: a.etablissementId,
        etablissementPrincipal: a.etablissementPrincipal,
        actif: a.actif,
    }));

    // 3. Mettre en cache Redis (5 min)
    try {
        await redisService.setJSON(cacheKey, { affectations: result }, TENANT_CACHE_TTL);
    } catch {
        // Non bloquant
    }

    return result;
}

/**
 * Invalide le cache tenant d'un utilisateur.
 * À appeler lors des modifications de utilisateur_etablissements.
 */
export async function invalidateTenantCache(utilisateurId: string): Promise<void> {
    try {
        await redisService.del(`tenant:affectations:${utilisateurId}`);
    } catch {
        // Non bloquant
    }
}

/**
 * Middleware multi-tenancy : attache l'etablissementId à la requête
 * 
 * Durcissement v9 — v5.2 :
 * - Les affectations sont TOUJOURS vérifiées en base (cache Redis 5 min)
 * - Le JWT n'est utilisé que comme hint initial, la DB est la source de vérité
 * 
 * Algorithme de sélection :
 * 1. SUPER_ADMIN → query param ou undefined
 * 2. Multi-établissements → vérification DB + cache Redis
 * 3. Fallback : requête DB directe
 */
export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.utilisateur) {
            // Pas d'authentification → pas de filtrage
            next();
            return;
        }

        // Audit sécurité v10 — GAP 10 : utiliser l'enum Role au lieu du string cast
        const userRole = req.utilisateur.role;

        // 1. SUPER_ADMIN peut accéder à tous les établissements
        if (userRole === Role.SUPER_ADMIN) {
            const queryEtablissementId = req.query.etablissementId as string | undefined;
            
            if (queryEtablissementId) {
                // [RBAC-3] v5.1 — Valider l'existence de l'établissement ciblé
                const etablissementRepo = AppDataSource.getRepository(Etablissement);
                const exists = await etablissementRepo.exists({ where: { id: queryEtablissementId } });
                
                if (!exists) {
                    logger.warn(
                        `[Multi-tenancy] ⚠️ SUPER_ADMIN ${req.utilisateur.id} — établissement ciblé INEXISTANT: ${queryEtablissementId}`
                    );
                    throw new AppError(
                        'Établissement cible non trouvé',
                        404,
                        'ETABLISSEMENT_NOT_FOUND'
                    );
                }
            }
            
            req.etablissementId = queryEtablissementId || undefined;
            next();
            return;
        }

        // 2. Durcissement v9 — G6 : TOUJOURS vérifier en base (pas de confiance au JWT)
        // Le JWT fournit un hint, mais la DB est la source de vérité
        const requestedId = req.query.etablissementId as string | undefined;

        try {
            // Vérification DB avec cache Redis (TTL 5 min)
            const affectations = await getAffectationsFromDB(req.utilisateur.id);

            if (affectations.length === 0) {
                throw new AppError(
                    'Aucun établissement actif associé à votre compte',
                    403,
                    'NO_ETABLISSEMENT'
                );
            }

            if (requestedId) {
                // L'utilisateur demande un établissement spécifique — vérifier en base
                const hasAccess = affectations.some(e => e.etablissementId === requestedId && e.actif);

                if (!hasAccess) {
                    logger.warn(
                        `[Multi-tenancy] TENTATIVE CROSS-TENANT (vérif DB) — ` +
                        `Utilisateur: ${req.utilisateur.id} (${req.utilisateur.role}) → ` +
                        `Établissement demandé: ${requestedId} — REFUSÉ`
                    );
                    throw new AppError(
                        'Accès non autorisé à cet établissement',
                        403,
                        'ACCESS_DENIED'
                    );
                }

                req.etablissementId = requestedId;
            } else {
                // Utiliser l'établissement principal
                const principal = affectations.find(e => e.etablissementPrincipal);

                if (principal) {
                    req.etablissementId = principal.etablissementId;
                } else if (affectations.length > 0 && affectations[0].actif) {
                    req.etablissementId = affectations[0].etablissementId;
                } else {
                    throw new AppError(
                        'Aucun établissement actif associé à votre compte',
                        403,
                        'NO_ACTIVE_ETABLISSEMENT'
                    );
                }
            }

            next();
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(
                'Erreur lors de la vérification de l\'établissement',
                500,
                'TENANT_VERIFICATION_ERROR'
            );
        }
        // Audit sécurité v10 — GAP 3 : suppression du next() dupliqué qui était ici.
        // Un seul point de sortie : le next() est dans le try (ligne précédente).
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
