/**
 * ==================================
 * eLISAschool - Middleware RLS (Row Level Security)
 * ==================================
 * Version: 8.0.0
 * Auteur: franck arlos chendjou
 *
 * Définit le contexte tenant PostgreSQL via SET / SET LOCAL app.current_tenant.
 *
 * Phase A.2 — Refonte SaaS v2 — Defense-in-Depth
 * Refonte v6 — Optimisation performance + sécurité
 * Refonte v8 — Lot E.2 : cas GESTIONNAIRE_GROUPES (sentinelle groupe)
 * Refonte v9 — Correction faille G1 : rejet explicite si aucun tenant résolu
 *   (plus de fallback silencieux vers SUPER_ADMIN_TENANT)
 *
 * Audit sécurité v10 — GAP 9 : guard défensif cross-plane.
 *   Les tokens plateforme (plane='platform') sont REJETÉS par le middleware RLS.
 *   Ils ne doivent JAMAIS atteindre les routes tenant (isolation structurelle).
 *
 * Fonctionnement :
 * - SUPER_ADMIN : contexte = '00000000-0000-0000-0000-000000000000' (bypass)
 * - GESTIONNAIRE_GROUPES : contexte = sentinelle groupe (bypass RLS + filtrage applicatif)
 * - Autres : contexte = etablissementId (erreur 403 si non résolu)
 *
 * Améliorations v9 :
 * - FAILLE G1 corrigée : resolveTenantId() rejette explicitement (403) si aucun
 *   contexte tenant n'est trouvé pour un utilisateur non-SUPER_ADMIN
 * - Logging CRITICAL en cas de tentative d'accès sans contexte tenant
 */

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { runInTenantContext } from '@common/async-local-storage';
import { AppError } from '@common/filters/error.filter';

/** UUID sentinelle SUPER_ADMIN — bypass RLS (doit correspondre à la migration SQL) */
export const SUPER_ADMIN_TENANT = '00000000-0000-0000-0000-000000000000';

/** UUID sentinelle GESTIONNAIRE_GROUPES — bypass RLS + filtrage applicatif groupe */
export const GROUP_TENANT_SENTINEL = '00000000-0000-0000-0000-000000000001';

/** Clé de configuration PostgreSQL pour le tenant */
export const TENANT_CONFIG_KEY = 'app.current_tenant';

/** Méthodes HTTP qui modifient des données → transaction requise */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Résout l'identifiant tenant depuis la requête.
 * v9 : Correction faille G1 — rejet explicite au lieu du fallback SUPER_ADMIN.
 *
 * Algorithme :
 * 1. SUPER_ADMIN → sentinelle bypass (légitime)
 * 2. GESTIONNAIRE_GROUPES → sentinelle groupe (légitime)
 * 3. etablissementId résolu → contexte tenant normal
 * 4. Aucun contexte → REJET EXPLICITE (403) — plus de fallback silencieux
 */
function resolveTenantId(req: Request): string {
    // 1. SUPER_ADMIN : bypass RLS légitime
    if (req.utilisateur?.role === 'SUPER_ADMIN') {
        return SUPER_ADMIN_TENANT;
    }

    // 2. GESTIONNAIRE_GROUPES : bypass RLS + filtrage applicatif par groupe
    if (req.utilisateur?.role === 'GESTIONNAIRE_GROUPES') {
        logger.info(
            `[RLS] Contexte groupe — User: ${req.utilisateur?.id} → sentinelle groupe`
        );
        return GROUP_TENANT_SENTINEL;
    }

    // 3. Contexte tenant résolu (middleware tenant ou JWT)
    const resolvedTenantId = req.etablissementId || req.utilisateur?.etablissementId;
    if (resolvedTenantId) {
        return resolvedTenantId;
    }

    // 4. FAILLE G1 — CORRECTION : rejet explicite au lieu du fallback SUPER_ADMIN
    // Un utilisateur non-SUPER_ADMIN sans contexte tenant est une anomalie de sécurité.
    logger.error(
        `[RLS] CRITIQUE — Aucun contexte tenant résolu — ` +
        `User: ${req.utilisateur?.id} (${req.utilisateur?.role}) — ` +
        `IP: ${req.ip} — Path: ${req.path} — ` +
        `Requête rejetée (403)`
    );

    throw new AppError(
        'Contexte établissement non résolu. Accès refusé.',
        403,
        'NO_TENANT_CONTEXT'
    );
}

/**
 * Détecte les tentatives cross-tenant et log directement (cluster-safe).
 * Pas de compteur global — le logger est le canal de monitoring.
 */
function detectCrossTenantAttempt(req: Request): void {
    if (req.utilisateur?.role === 'SUPER_ADMIN') return;
    const requestedId = req.query.etablissementId as string | undefined;
    if (requestedId && requestedId !== req.etablissementId) {
        logger.warn(
            `[RLS] Tentative cross-tenant — ` +
            `User: ${req.utilisateur?.id} (${req.utilisateur?.role}) → ` +
            `Établissement demandé: ${requestedId} → ` +
            `Établissement réel: ${req.etablissementId} — RLS actif`
        );
    }
}

/**
 * Guard défensif — GAP 9 : rejette les tokens plateforme sur les routes tenant.
 * Isolation structurelle : un token plane='platform' ne doit JAMAIS passer par RLS.
 */
function rejectCrossPlaneRequest(req: Request): void {
    if (req.utilisateur?.plane === 'platform') {
        logger.error(
            `[RLS] CRITIQUE — Token plateforme sur route tenant — ` +
            `User: ${req.utilisateur.id} (${req.utilisateur.role}), ` +
            `path: ${req.path}, IP: ${req.ip} — Rejeté (403)`,
        );
        throw new AppError(
            'Les tokens plateforme ne peuvent pas accéder aux routes établissement',
            403,
            'CROSS_PLANE_ACCESS_DENIED',
        );
    }
}

/**
 * Middleware RLS — mode READ (GET, HEAD).
 * Utilise SET (session) sans transaction → ne consomme pas de connexion pool.
 * Le RESET en fin de réponse garantit l'isolation entre requêtes.
 */
export async function rlsReadMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.utilisateur) {
            next();
            return;
        }

        // GAP 9 : rejet défensif des tokens plateforme sur les routes tenant
        rejectCrossPlaneRequest(req);

        const tenantId = resolveTenantId(req);
        const queryRunner = AppDataSource.createQueryRunner();

        try {
            // SET (session-scoped) — pas de transaction nécessaire
            await queryRunner.query(`SET ${TENANT_CONFIG_KEY} = $1`, [tenantId]);

            // Stocker le queryRunner pour le RESET en fin de réponse
            (req as any).queryRunner = queryRunner;
            (req as any).tenantId = tenantId;
            (req as any).rlsMode = 'read';

            detectCrossTenantAttempt(req);

            // Cleanup session en fin de réponse
            res.on('finish', () => {
                queryRunner.query(`RESET ${TENANT_CONFIG_KEY}`)
                    .catch((err: unknown) => logger.error('[RLS] Erreur RESET session:', err))
                    .finally(() => queryRunner.release());
            });

            runInTenantContext(
                {
                    etablissementId: tenantId,
                    utilisateurId: req.utilisateur.id || null,
                    role: req.utilisateur.role || null,
                    timestamp: Date.now(),
                },
                () => next()
            );
        } catch (error) {
            await queryRunner.release();
            throw error;
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware RLS — mode WRITE (POST, PUT, PATCH, DELETE).
 * Utilise SET LOCAL dans une transaction → isolation stricte + atomicité.
 */
export async function rlsWriteMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.utilisateur) {
            next();
            return;
        }

        // GAP 9 : rejet défensif des tokens plateforme sur les routes tenant
        rejectCrossPlaneRequest(req);

        const tenantId = resolveTenantId(req);
        const queryRunner = AppDataSource.createQueryRunner();

        try {
            await queryRunner.startTransaction();

            // SET LOCAL (transaction-scoped) — isolation automatique au rollback
            await queryRunner.query(`SET LOCAL ${TENANT_CONFIG_KEY} = $1`, [tenantId]);

            // Vérification du contexte
            const verifyResult = await queryRunner.query(
                `SELECT current_setting('${TENANT_CONFIG_KEY}', true) as tenant`
            );
            const verifiedTenant = verifyResult[0]?.tenant;
            if (verifiedTenant !== tenantId) {
                logger.error(
                    `[RLS] Vérification échouée — Tenant attendu: ${tenantId}, ` +
                    `Tenant vérifié: ${verifiedTenant} — User: ${req.utilisateur.id}`
                );
            }

            // Stocker le queryRunner pour commit/rollback en fin de réponse
            (req as any).queryRunner = queryRunner;
            (req as any).tenantId = tenantId;
            (req as any).rlsMode = 'write';

            detectCrossTenantAttempt(req);

            // Commit/rollback via event listener (pas de monkey-patch res.end)
            res.on('finish', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    queryRunner.commitTransaction()
                        .then(() => queryRunner.release())
                        .catch((err: unknown) => {
                            logger.error('[RLS] Erreur commit transaction:', err);
                            queryRunner.release();
                        });
                } else {
                    queryRunner.rollbackTransaction()
                        .then(() => queryRunner.release())
                        .catch((err: unknown) => {
                            logger.error('[RLS] Erreur rollback transaction:', err);
                            queryRunner.release();
                        });
                }
            });

            // Sécurité supplémentaire : rollback si la connexion est fermée prématurément
            res.on('close', () => {
                if (queryRunner.isTransactionActive) {
                    queryRunner.rollbackTransaction()
                        .then(() => queryRunner.release())
                        .catch(() => { /* déjà libéré */ });
                }
            });

            runInTenantContext(
                {
                    etablissementId: tenantId,
                    utilisateurId: req.utilisateur.id || null,
                    role: req.utilisateur.role || null,
                    timestamp: Date.now(),
                },
                () => next()
            );
        } catch (error) {
            await queryRunner.release();
            throw error;
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware RLS unifié — dispatche vers read ou write selon la méthode HTTP.
 * Rétro-compatible avec l'ancien `rlsMiddleware`.
 */
export async function rlsMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (WRITE_METHODS.has(req.method)) {
        return rlsWriteMiddleware(req, res, next);
    }
    return rlsReadMiddleware(req, res, next);
}

/**
 * Middleware de fin de transaction RLS.
 * v7 : Le commit/rollback est géré par res.on('finish') dans les middlewares.
 * Ce middleware est conservé pour rétro-compatibilité mais ne fait que passer.
 * @deprecated — Le lifecycle est maintenant géré dans rlsReadMiddleware/rlsWriteMiddleware
 */
export function rlsTransactionEnd(_req: Request, _res: Response, next: NextFunction): void {
    // v7 : noop — le commit/rollback est géré par les event listeners
    // dans rlsReadMiddleware et rlsWriteMiddleware
    next();
}

/**
 * Récupère le contexte tenant courant depuis la requête.
 */
export function getTenantContext(req: Request): string | null {
    return (req as any).tenantId || null;
}

/**
 * Exécute une fonction dans un contexte tenant isolé.
 * Utilisé pour les jobs en arrière-plan, cron, etc. qui n'ont pas de requête HTTP.
 * 
 * @example
 * await runWithTenant(async (queryRunner) => {
 *     await queryRunner.query('SELECT * FROM eleves');
 * }, etablissementId);
 */
export async function runWithTenant<T>(
    fn: (queryRunner: import('typeorm').QueryRunner) => Promise<T>,
    tenantId: string
): Promise<T> {
    const queryRunner = AppDataSource.createQueryRunner();
    try {
        await queryRunner.startTransaction();
        await queryRunner.query(`SET LOCAL ${TENANT_CONFIG_KEY} = $1`, [tenantId]);
        
        const result = await fn(queryRunner);
        
        await queryRunner.commitTransaction();
        return result;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
}

export default rlsMiddleware;
