/**
 * ==================================
 * eLISAschool - Cron Distributed Lock Service
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Verrou distribué pour cron jobs — empêche l'exécution simultanée
 * d'un même job sur plusieurs instances backend.
 *
 * Stratégie :
 *  1. pg_advisory_lock (PostgreSQL) — verrou cross-process, session-level
 *  2. Set<string> in-memory — fallback si DB indisponible + guard same-process
 *
 * Usage :
 *   import { withCronLock, scheduleWithLock } from '@common/services/cron-lock.service';
 *
 *   // Wrapper autour d'une fonction
 *   await withCronLock('billing-renewal', async () => { ... });
 *
 *   // Remplacement de cron.schedule
 *   scheduleWithLock('billing-renewal', '0 0 * * *', async () => { ... });
 */

import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';

// =============================================
// HASH — Convertit un nom de job en clé bigint
// =============================================

/**
 * Hash FNV-1a 32 bits → nombre positif safe pour pg_advisory_lock (bigint).
 * Déterministe : même nom → même clé, même instance.
 */
function hashJobName(name: string): number {
    let hash = 0x811c9dc5; // FNV offset basis
    for (let i = 0; i < name.length; i++) {
        hash ^= name.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0; // FNV prime, unsigned
    }
    return hash;
}

// =============================================
// LOCAL GUARD — Same-process concurrency
// =============================================

const runningJobs = new Set<string>();

// =============================================
// DISTRIBUTED LOCK — PostgreSQL advisory lock
// =============================================

/**
 * Acquiert un verrou distribué via pg_try_advisory_lock (non-bloquant).
 * Retourne true si le verrou est acquis, false si déjà pris par une autre instance.
 *
 * pg_try_advisory_lock :
 *  - Non-bloquant (retourne immédiatement false si déjà verrouillé)
 *  - Session-level (libéré automatiquement à la déconnexion)
 *  - Pas de table nécessaire — géré par PostgreSQL
 */
async function tryAcquireAdvisoryLock(jobName: string): Promise<boolean> {
    try {
        const key = hashJobName(jobName);
        const result = await AppDataSource.query(
            'SELECT pg_try_advisory_lock($1) AS acquired',
            [key],
        );
        const acquired = result[0]?.acquired === true;
        if (!acquired) {
            logger.debug(`[CronLock] Verrou advisory déjà pris: ${jobName} (key=${key})`);
        }
        return acquired;
    } catch (error) {
        // Si PostgreSQL est indisponible, on log mais on ne bloque pas
        logger.warn(`[CronLock] Erreur pg_try_advisory_lock pour ${jobName}, fallback local uniquement`, error);
        return true; // Fallback : on laisse passer (le guard local protège déjà)
    }
}

/**
 * Libère un verrou distribué advisory.
 */
async function releaseAdvisoryLock(jobName: string): Promise<void> {
    try {
        const key = hashJobName(jobName);
        await AppDataSource.query('SELECT pg_advisory_unlock($1)', [key]);
    } catch (error) {
        // Non-critique : le verrou sera libéré à la fin de la session
        logger.warn(`[CronLock] Erreur pg_advisory_unlock pour ${jobName}`, error);
    }
}

// =============================================
// WITH CRON LOCK — Wrapper principal
// =============================================

/**
 * Exécute une fonction avec verrou distribué (double couche : local + PostgreSQL).
 *
 * - Si le job est déjà en cours (même process) → skip immédiat
 * - Si le job est verrouillé par une autre instance (pg_advisory) → skip
 * - Sinon → exécution + libération du verrou
 *
 * @param jobName - Nom unique du job (ex: 'billing-renewal')
 * @param fn - Fonction async à exécuter
 * @returns Résultat de la fonction, ou null si skip
 */
export async function withCronLock<T>(jobName: string, fn: () => Promise<T>): Promise<T | null> {
    // 1. Guard local (same-process)
    if (runningJobs.has(jobName)) {
        logger.warn(`[CronLock] ${jobName} déjà en cours (process local) — skip`);
        return null;
    }

    // 2. Verrou distribué (cross-process via PostgreSQL)
    const advisoryAcquired = await tryAcquireAdvisoryLock(jobName);
    if (!advisoryAcquired) {
        logger.info(`[CronLock] ${jobName} déjà en cours (autre instance) — skip`);
        return null;
    }

    // 3. Exécution
    runningJobs.add(jobName);
    const start = Date.now();

    try {
        const result = await fn();
        const duration = Date.now() - start;
        logger.debug(`[CronLock] ${jobName} terminé en ${duration}ms`);
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        logger.error(`[CronLock] ${jobName} échec après ${duration}ms:`, error);
        throw error;
    } finally {
        runningJobs.delete(jobName);
        await releaseAdvisoryLock(jobName);
    }
}

// =============================================
// SCHEDULE WITH LOCK — Remplacement de cron.schedule
// =============================================

/**
 * Planifie un cron job avec verrou distribué automatique.
 * Drop-in replacement pour `cron.schedule()` avec protection multi-instance.
 *
 * @param jobName - Nom unique du job
 * @param cronExpression - Expression cron (ex: '0 0 * * *')
 * @param fn - Fonction async à exécuter
 * @param options - Options node-cron (timezone, etc.)
 */
export function scheduleWithLock(
    jobName: string,
    cronExpression: string,
    fn: () => Promise<void>,
    options?: { timezone?: string },
): void {
    // Import dynamique pour éviter la dépendance circulaire
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cron = require('node-cron');

    cron.schedule(cronExpression, async () => {
        await withCronLock(jobName, fn);
    }, options);
}
