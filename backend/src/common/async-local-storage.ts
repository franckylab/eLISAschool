/**
 * ==================================
 * eLISAschool - AsyncLocalStorage pour contexte tenant
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase H.2 — Refonte SaaS v3
 * Permet de propager le contexte tenant (etablissementId, role, utilisateurId)
 * à travers toute la chaîne d'appel asynchrone sans passer explicitement
 * les paramètres dans chaque fonction.
 *
 * Utilisé par :
 * - rls.middleware.ts : initialise le contexte au début de chaque requête
 * - tenant-isolation.subscriber.ts : lit le contexte pour injecter etablissementId
 */

import { AsyncLocalStorage } from 'async_hooks';

/**
 * Contexte tenant propagé via AsyncLocalStorage
 */
export interface TenantContext {
    etablissementId: string | null;
    utilisateurId: string | null;
    role: string | null;
    /** Timestamp de la requête — utilisé pour le debugging */
    timestamp: number;
}

/**
 * Instance globale AsyncLocalStorage pour le contexte tenant.
 * Chaque requête HTTP initialise un contexte isolé.
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Récupère le contexte tenant courant.
 * Retourne null si hors contexte requête (ex: cron jobs, scripts).
 */
export function getTenantContext(): TenantContext | null {
    return tenantStorage.getStore() ?? null;
}

/**
 * Récupère l'etablissementId du contexte courant.
 * Retourne null si hors contexte ou si SUPER_ADMIN (sentinel).
 */
export function getCurrentEtablissementId(): string | null {
    const ctx = getTenantContext();
    if (!ctx) return null;
    // Le sentinel SUPER_ADMIN ne doit pas être injecté comme etablissementId
    if (ctx.etablissementId === '00000000-0000-0000-0000-000000000000') {
        return null;
    }
    return ctx.etablissementId;
}

/**
 * Exécute une fonction dans un contexte tenant isolé.
 * Utilisé par le middleware RLS pour encapsuler chaque requête.
 */
export function runInTenantContext<T>(
    context: TenantContext,
    fn: () => T
): T {
    return tenantStorage.run(context, fn);
}
