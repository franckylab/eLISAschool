/**
 * ==================================
 * eLISAschool - Middleware Rate Limiting par Tenant
 * ==================================
 * 
 * Token bucket par établissementId.
 * Quotas proportionnels au plan d'abonnement.
 * Alerte à 80%, blocage à 100%.
 * 
 * Phase 3.5 — Refonte SaaS
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';

// =============================================
// TYPES
// =============================================

interface TenantBucket {
    tokens: number;
    lastRefill: number;
    totalRequests: number;
    blockedRequests: number;
}

interface RateLimitConfig {
    /** Nombre max de requêtes par fenêtre */
    maxRequests: number;
    /** Fenêtre de temps en secondes */
    windowSeconds: number;
}

// =============================================
// CONFIG PAR PLAN
// =============================================

const PLAN_LIMITS: Record<string, RateLimitConfig> = {
    gratuit: { maxRequests: 100, windowSeconds: 60 },       // 100 req/min — Phase P5.2 v6
    standard: { maxRequests: 500, windowSeconds: 60 },     // 500 req/min
    pro: { maxRequests: 1000, windowSeconds: 60 },         // 1000 req/min
    premium: { maxRequests: 2000, windowSeconds: 60 },     // 2000 req/min — Phase P5.2 v6
    enterprise: { maxRequests: 3000, windowSeconds: 60 },  // 3000 req/min
    default: { maxRequests: 100, windowSeconds: 60 },      // 100 req/min
};

// =============================================
// MIDDLEWARE
// =============================================

class TenantRateLimiter {
    private buckets: Map<string, TenantBucket> = new Map();
    private readonly CLEANUP_INTERVAL = 300_000; // 5 min

    constructor() {
        // Nettoyage périodique des buckets expirés
        setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    }

    /**
     * Middleware de rate limiting par tenant.
     */
    middleware = (req: Request, res: Response, next: NextFunction): void => {
        const etablissementId = (req as any).etablissementId || req.utilisateur?.etablissementId;

        // Pas de rate limiting si pas de tenant (ex: routes publiques, SUPER_ADMIN)
        if (!etablissementId) {
            next();
            return;
        }

        // SUPER_ADMIN exempté
        if (req.utilisateur?.role === 'SUPER_ADMIN') {
            next();
            return;
        }

        // Résoudre le plan (async) puis appliquer le rate limit
        this.getConfigForTenant(etablissementId).then((config) => {
            const bucket = this.getBucket(etablissementId);

            // Refill tokens si nécessaire
            const now = Date.now();
            const elapsed = (now - bucket.lastRefill) / 1000;
            const refillRate = config.maxRequests / config.windowSeconds;
            bucket.tokens = Math.min(config.maxRequests, bucket.tokens + elapsed * refillRate);
            bucket.lastRefill = now;

            bucket.totalRequests++;

            // Vérifier si le bucket est épuisé
            if (bucket.tokens < 1) {
                bucket.blockedRequests++;

                logger.warn(
                    `[RateLimit] Tenant ${etablissementId} bloqué — ` +
                    `${bucket.totalRequests} requêtes, ${bucket.blockedRequests} bloquées`
                );

                const retryAfter = Math.ceil(1 / refillRate);

                res.setHeaders?.({
                    'X-RateLimit-Limit': String(config.maxRequests),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.ceil(now / 1000) + retryAfter),
                    'Retry-After': String(retryAfter),
                });

                res.status(429).json({
                    success: false,
                    message: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
                    retryAfter,
                });
                return;
            }

            // Consommer un token
            bucket.tokens -= 1;

            // Headers de rate limiting
            const remaining = Math.floor(bucket.tokens);
            const percentUsed = ((config.maxRequests - remaining) / config.maxRequests) * 100;

            res.set?.('X-RateLimit-Limit', String(config.maxRequests));
            res.set?.('X-RateLimit-Remaining', String(remaining));

            // Alerte à 80%
            if (percentUsed >= 80) {
                logger.warn(
                    `[RateLimit] Tenant ${etablissementId} à ${Math.round(percentUsed)}% ` +
                    `de sa quota (${remaining}/${config.maxRequests} restants)`
                );
            }

            next();
        }).catch(() => {
            // En cas d'erreur, appliquer le plan par défaut
            next();
        });
    };

    // =============================================
    // HELPERS
    // =============================================

    private getBucket(etablissementId: string): TenantBucket {
        let bucket = this.buckets.get(etablissementId);
        if (!bucket) {
            bucket = {
                tokens: PLAN_LIMITS.default.maxRequests,
                lastRefill: Date.now(),
                totalRequests: 0,
                blockedRequests: 0,
            };
            this.buckets.set(etablissementId, bucket);
        }
        return bucket;
    }

    private planCache: Map<string, { slug: string; expiresAt: number }> = new Map();

    private async getConfigForTenant(etablissementId: string): Promise<RateLimitConfig> {
        // Phase P5.2 — Résoudre le plan du tenant depuis le cache Redis ou DB
        const cacheKey = `ratelimit:plan:${etablissementId}`;

        // 1. Cache local (5 min)
        const localCached = this.planCache.get(etablissementId);
        if (localCached && localCached.expiresAt > Date.now()) {
            return PLAN_LIMITS[localCached.slug] || PLAN_LIMITS.default;
        }

        // 2. Cache Redis (15 min)
        try {
            const cached = await redisService.get(cacheKey);
            if (cached) {
                this.planCache.set(etablissementId, { slug: cached, expiresAt: Date.now() + 300_000 });
                return PLAN_LIMITS[cached] || PLAN_LIMITS.default;
            }
        } catch {
            // Redis indisponible, continuer vers DB
        }

        // 3. DB — Rechercher l'abonnement actif du tenant
        try {
            const { AppDataSource } = await import('@database/data-source');
            const { AbonnementClient, StatutAbonnement } = await import('@modules/billing/entities');
            const aboRepo = AppDataSource.getRepository(AbonnementClient);
            const abo = await aboRepo.findOne({
                where: { etablissementId, statut: StatutAbonnement.ACTIF } as any,
                relations: ['plan'],
                order: { dateDebut: 'DESC' },
            });

            if (abo?.plan?.slug) {
                const slug = abo.plan.slug.toLowerCase();
                // Mettre en cache Redis (15 min)
                await redisService.set(cacheKey, slug, 900).catch(() => {});
                this.planCache.set(etablissementId, { slug, expiresAt: Date.now() + 300_000 });
                return PLAN_LIMITS[slug] || PLAN_LIMITS.default;
            }
        } catch {
            // Entité non disponible
        }

        return PLAN_LIMITS.default;
    }

    private cleanup(): void {
        const now = Date.now();
        const maxAge = 600_000; // 10 min

        for (const [key, bucket] of this.buckets.entries()) {
            if (now - bucket.lastRefill > maxAge) {
                this.buckets.delete(key);
            }
        }
    }

    /**
     * Réinitialise le rate limiting pour un tenant (ex: après upgrade de plan).
     */
    resetTenant(etablissementId: string): void {
        this.buckets.delete(etablissementId);
    }

    /**
     * Statistiques de rate limiting pour un tenant.
     */
    getStats(etablissementId: string): { totalRequests: number; blockedRequests: number } | null {
        const bucket = this.buckets.get(etablissementId);
        if (!bucket) return null;
        return {
            totalRequests: bucket.totalRequests,
            blockedRequests: bucket.blockedRequests,
        };
    }
}

// Singleton
export const tenantRateLimiter = new TenantRateLimiter();
export const tenantRateLimitMiddleware = tenantRateLimiter.middleware;
export default tenantRateLimiter;
