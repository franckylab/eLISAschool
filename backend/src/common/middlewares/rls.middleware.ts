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
 *
 * Fonctionnement :
 * - SUPER_ADMIN : contexte = '00000000-0000-0000-0000-000000000000' (bypass)
 * - GESTIONNAIRE_GROUPES : contexte = sentinelle groupe (bypass RLS + filtrage applicatif)
 * - Autres : contexte = etablissementId
 *
 * Améliorations v8 :
 * - GESTIONNAIRE_GROUPES : bypass RLS via sentinelle groupe + audit log
 *   Le filtrage par groupe est assuré au niveau applicatif (cascade groupe→plan→étab)
 * - GroupContext header : X-Group-Tenant pour tracer le contexte groupe
 * - Compteur cross-tenant via logger direct (cluster-safe, pas d'état global)
 */

import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { runInTenantContext } from '@common/async-local-storage';

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
 * v8 : Gestion du cas GESTIONNAIRE_GROUPES (sentinelle groupe).
 */
function resolveTenantId(req: Request): string {
    if (req.utilisateur?.role === 'SUPER_ADMIN') {
        return SUPER_ADMIN_TENANT;
    }
    // GESTIONNAIRE_GROUPES : bypass RLS + filtrage applicatif par groupe
    if (req.utilisateur?.role === 'GESTIONNAIRE_GROUPES') {
        logger.info(
            `[RLS] Contexte groupe — User: ${req.utilisateur?.id} → sentinelle groupe`
        );
        return GROUP_TENANT_SENTINEL;
    }
    return req.etablissementId || req.utilisateur?.etablissementId || SUPER_ADMIN_TENANT;
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
