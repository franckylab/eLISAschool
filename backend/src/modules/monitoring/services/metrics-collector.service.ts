/**
 * ==================================
 * eLISAschool - Service Collecte Métriques
 * ==================================
 * 
 * Collecte périodique de métriques RED (Requests, Errors, Duration)
 * et USE (Utilization, Saturation, Errors) par service.
 * Four Golden Signals: latency, traffic, errors, saturation.
 * 
 * Phase 7.1 — Refonte SaaS
 * Phase F.1 — Refonte SaaS v2 (Golden Signals: p50/p95/p99, saturation DB/Redis)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';

export interface MetricPoint {
    id?: string;
    etablissementId?: string;
    name: string; // Ex: 'http_request_duration_ms', 'cpu_usage_percent'
    value: number;
    labels: Record<string, string>; // Ex: { method: 'GET', path: '/api/eleves', status: '200' }
    timestamp: Date;
}

export interface HealthCheckResult {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    message?: string;
    details?: Record<string, any>;
}

export interface GoldenSignals {
    latency: {
        p50: number;
        p95: number;
        p99: number;
        mean: number;
    };
    traffic: {
        requestsPerSecond: number;
        activeUsers: number;
    };
    errors: {
        rate5xx: number; // percentage
        rate4xx: number; // percentage
        total5xx: number;
        total4xx: number;
    };
    saturation: {
        cpuPercent: number;
        memoryPercent: number;
        dbConnectionsPercent: number;
        redisConnectionsPercent: number;
    };
}

export class MetricsCollectorService {
    private metricsBuffer: MetricPoint[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private readonly FLUSH_INTERVAL_MS = 10_000; // 10 secondes — Phase P3.3 v6 (batch aggregation)
    private readonly MAX_BUFFER_SIZE = 1000;
    private recentDurations: number[] = []; // Cache local pour percentiles rapides
    private readonly MAX_DURATION_SAMPLES = 500;

    // Redis time-series keys
    private readonly REDIS_METRICS_PREFIX = 'metrics:ts:';
    private readonly REDIS_DURATIONS_KEY = 'metrics:durations';
    private readonly REDIS_DURATIONS_MAX = 2000; // Max samples in Redis sorted set

    constructor() {
        this.startPeriodicFlush();
        this.loadDurationsFromRedis(); // Restaurer les durées depuis Redis au démarrage
    }

    // =============================================
    // COLLECTE MÉTRIQUES
    // =============================================

    /**
     * Enregistre un point de métrique.
     */
    record(name: string, value: number, labels: Record<string, string> = {}, etablissementId?: string): void {
        this.metricsBuffer.push({
            name,
            value,
            labels,
            etablissementId,
            timestamp: new Date(),
        });

        // Flush si le buffer est plein
        if (this.metricsBuffer.length >= this.MAX_BUFFER_SIZE) {
            this.flush();
        }
    }

    /**
     * Enregistre la durée d'une requête HTTP.
     */
    recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number, etablissementId?: string): void {
        this.record('http_request_duration_ms', durationMs, {
            method,
            path: this.normalizePath(path),
            status: String(statusCode),
        }, etablissementId);

        // Compteur de requêtes
        this.record('http_requests_total', 1, {
            method,
            path: this.normalizePath(path),
            status: String(statusCode),
        }, etablissementId);

        // Compteur d'erreurs
        if (statusCode >= 500) {
            this.record('http_errors_5xx_total', 1, {
                method,
                path: this.normalizePath(path),
                status: String(statusCode),
            }, etablissementId);
        } else if (statusCode >= 400) {
            this.record('http_errors_4xx_total', 1, {
                method,
                path: this.normalizePath(path),
                status: String(statusCode),
            }, etablissementId);
        }

        // Stocker pour percentiles (cache local + Redis)
        this.recentDurations.push(durationMs);
        if (this.recentDurations.length > this.MAX_DURATION_SAMPLES) {
            this.recentDurations.shift();
        }

        // Persist en Redis time-series (non-bloquant)
        this.persistDurationToRedis(durationMs, etablissementId).catch(() => {});
    }

    /**
     * Enregistre l'utilisation des ressources.
     */
    recordResourceUsage(resource: string, usagePercent: number, labels: Record<string, string> = {}): void {
        this.record(`resource_${resource}_percent`, usagePercent, labels);
    }

    // =============================================
    // GOLDEN SIGNALS (Phase F.1)
    // =============================================

    /**
     * Calcule les Four Golden Signals pour la période donnée.
     */
    async getGoldenSignals(): Promise<GoldenSignals> {
        return {
            latency: this.computeLatencyPercentiles(),
            traffic: await this.computeTraffic(),
            errors: this.computeErrorRates(),
            saturation: await this.computeSaturation(),
        };
    }

    /**
     * Calcule les percentiles de latence (p50, p95, p99).
     */
    private computeLatencyPercentiles(): GoldenSignals['latency'] {
        if (this.recentDurations.length === 0) {
            return { p50: 0, p95: 0, p99: 0, mean: 0 };
        }

        const sorted = [...this.recentDurations].sort((a, b) => a - b);
        const len = sorted.length;

        const mean = sorted.reduce((sum, v) => sum + v, 0) / len;

        return {
            p50: sorted[Math.floor(len * 0.5)],
            p95: sorted[Math.floor(len * 0.95)],
            p99: sorted[Math.floor(len * 0.99)],
            mean: Math.round(mean),
        };
    }

    /**
     * Calcule le trafic (requêtes/seconde, utilisateurs actifs).
     */
    private async computeTraffic(): Promise<GoldenSignals['traffic']> {
        // Compter les requêtes dans le buffer récent (dernières 60s)
        const now = Date.now();
        const recentRequests = this.metricsBuffer.filter(
            (m) => m.name === 'http_requests_total' && now - m.timestamp.getTime() < 60_000
        );
        const requestsPerSecond = recentRequests.length / 60;

        // Compter les utilisateurs actifs via Redis ou DB
        let activeUsers = 0;
        try {
            const { Utilisateur } = await import('@modules/auth/entities');
            const utilisateurRepo = AppDataSource.getRepository(Utilisateur);
            activeUsers = await utilisateurRepo.count({
                where: { dernierLogin: new Date(now - 15 * 60 * 1000) }, // 15 dernières minutes
            } as any);
        } catch {
            // Ignorer si l'entité n'est pas disponible
        }

        return { requestsPerSecond: Math.round(requestsPerSecond * 100) / 100, activeUsers };
    }

    /**
     * Calcule les taux d'erreurs 5xx et 4xx.
     */
    private computeErrorRates(): GoldenSignals['errors'] {
        const now = Date.now();
        const recentWindow = 60_000; // 1 minute

        const totalReqs = this.metricsBuffer.filter(
            (m) => m.name === 'http_requests_total' && now - m.timestamp.getTime() < recentWindow
        ).length;

        const total5xx = this.metricsBuffer.filter(
            (m) => m.name === 'http_errors_5xx_total' && now - m.timestamp.getTime() < recentWindow
        ).length;

        const total4xx = this.metricsBuffer.filter(
            (m) => m.name === 'http_errors_4xx_total' && now - m.timestamp.getTime() < recentWindow
        ).length;

        return {
            rate5xx: totalReqs > 0 ? Math.round((total5xx / totalReqs) * 10000) / 100 : 0,
            rate4xx: totalReqs > 0 ? Math.round((total4xx / totalReqs) * 10000) / 100 : 0,
            total5xx,
            total4xx,
        };
    }

    /**
     * Calcule la saturation (CPU, mémoire, connexions DB, Redis).
     */
    private async computeSaturation(): Promise<GoldenSignals['saturation']> {
        let cpuPercent = 0;
        let memoryPercent = 0;
        let dbConnectionsPercent = 0;
        let redisConnectionsPercent = 0;

        try {
            // Process memory/CPU via Node.js
            const memUsage = process.memoryUsage();
            const heapUsedPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
            memoryPercent = heapUsedPercent;

            // CPU via process.cpuUsage (approximatif)
            const cpuUsage = process.cpuUsage();
            cpuPercent = Math.min(100, Math.round((cpuUsage.user + cpuUsage.system) / 1000000));
        } catch {
            // Ignorer
        }

        try {
            // DB connections
            const dbResult = await AppDataSource.query(
                `SELECT count(*) as active, max(setting::int) as max_conn 
                 FROM pg_stat_activity, pg_settings 
                 WHERE settings.name = 'max_connections'`
            );
            if (dbResult[0]) {
                const active = parseInt(dbResult[0].active) || 0;
                const maxConn = parseInt(dbResult[0].max_conn) || 100;
                dbConnectionsPercent = Math.round((active / maxConn) * 100);
            }
        } catch {
            // Ignorer si pas accessible
        }

        return { cpuPercent, memoryPercent, dbConnectionsPercent, redisConnectionsPercent };
    }

    // =============================================
    // HEALTH CHECKS
    // =============================================

    /**
     * Effectue les health checks de tous les services.
     * Phase F.4 — Health checks distribués (DB, Redis, SMTP, SMS gateway, stockage).
     */
    async checkHealth(): Promise<HealthCheckResult[]> {
        const results: HealthCheckResult[] = [];

        // 1. Base de données
        results.push(await this.checkDatabase());

        // 2. API elle-même
        results.push({
            service: 'api',
            status: 'healthy',
            latency: 0,
            message: 'API opérationnelle',
        });

        // 3. Redis
        results.push(await this.checkRedis());

        // 4. SMTP (email gateway)
        results.push(await this.checkSmtp());

        // 5. Services externes (SMS, providers paiement)
        results.push(await this.checkExternalServices());

        return results;
    }

    private async checkDatabase(): Promise<HealthCheckResult> {
        const start = Date.now();
        try {
            await AppDataSource.query('SELECT 1');
            const latency = Date.now() - start;
            return {
                service: 'database',
                status: latency > 1000 ? 'degraded' : 'healthy',
                latency,
                message: latency > 1000 ? `Latence élevée: ${latency}ms` : 'Connexion OK',
            };
        } catch (error: any) {
            return {
                service: 'database',
                status: 'unhealthy',
                latency: Date.now() - start,
                message: error.message,
            };
        }
    }

    /**
     * Vérifie la connectivité Redis.
     */
    private async checkRedis(): Promise<HealthCheckResult> {
        const start = Date.now();
        try {
            const { redisService } = await import('@common/services/redis.service');
            const client = redisService.getClient();
            if (client && client.isReady) {
                await client.ping();
                const latency = Date.now() - start;
                return {
                    service: 'redis',
                    status: latency > 500 ? 'degraded' : 'healthy',
                    latency,
                    message: `Redis OK — ${latency}ms`,
                };
            }
            return {
                service: 'redis',
                status: 'degraded',
                latency: Date.now() - start,
                message: 'Redis non connecté',
            };
        } catch (error: any) {
            return {
                service: 'redis',
                status: 'unhealthy',
                latency: Date.now() - start,
                message: `Redis error: ${error.message}`,
            };
        }
    }

    /**
     * Vérifie la connectivité SMTP.
     */
    private async checkSmtp(): Promise<HealthCheckResult> {
        const start = Date.now();
        try {
            const host = process.env.SMTP_HOST;
            const port = parseInt(process.env.SMTP_PORT || '587');

            if (!host) {
                return {
                    service: 'smtp',
                    status: 'healthy',
                    message: 'SMTP non configuré — mode log',
                };
            }

            // Test TCP connectivity
            const net = await import('net');
            return new Promise<HealthCheckResult>((resolve) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                socket.connect(port, host, () => {
                    socket.destroy();
                    resolve({
                        service: 'smtp',
                        status: 'healthy',
                        latency: Date.now() - start,
                        message: `SMTP ${host}:${port} accessible`,
                    });
                });
                socket.on('error', (err: Error) => {
                    socket.destroy();
                    resolve({
                        service: 'smtp',
                        status: 'degraded',
                        latency: Date.now() - start,
                        message: `SMTP error: ${err.message}`,
                    });
                });
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve({
                        service: 'smtp',
                        status: 'degraded',
                        latency: Date.now() - start,
                        message: 'SMTP timeout (5s)',
                    });
                });
            });
        } catch (error: any) {
            return {
                service: 'smtp',
                status: 'unhealthy',
                latency: Date.now() - start,
                message: error.message,
            };
        }
    }

    private async checkExternalServices(): Promise<HealthCheckResult> {
        // Vérifier les services externes configurés
        // Pour l'instant, retourner un statut basique
        return {
            service: 'external',
            status: 'healthy',
            message: 'Services externes non configurés — skip',
        };
    }

    // =============================================
    // MÉTRIQUES AGRÉGÉES
    // =============================================

    /**
     * Récupère les métriques agrégées pour une période.
     */
    async getAggregatedMetrics(period: '1h' | '24h' | '7d' = '24h'): Promise<Record<string, any>> {
        const now = new Date();
        let since: Date;

        switch (period) {
            case '1h': since = new Date(now.getTime() - 60 * 60 * 1000); break;
            case '24h': since = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        }

        // Compter les établissements actifs, utilisateurs, etc.
        const { Etablissement } = await import('@modules/etablissement/entities');
        const { Utilisateur } = await import('@modules/auth/entities');
        const { Eleve } = await import('@modules/eleves/entities');

        const etablissementRepo = AppDataSource.getRepository(Etablissement);
        const utilisateurRepo = AppDataSource.getRepository(Utilisateur);
        const eleveRepo = AppDataSource.getRepository(Eleve);

        const [totalEtablissements, totalUtilisateurs, totalEleves] = await Promise.all([
            etablissementRepo.count(),
            utilisateurRepo.count(),
            eleveRepo.count(),
        ]);

        return {
            period,
            timestamp: now.toISOString(),
            platform: {
                totalEtablissements,
                totalUtilisateurs,
                totalEleves,
            },
            goldenSignals: await this.getGoldenSignals(),
            health: await this.checkHealth(),
        };
    }

    // =============================================
    // FLUSH & PERSISTENCE
    // =============================================

    private startPeriodicFlush(): void {
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.FLUSH_INTERVAL_MS);
    }

    private async flush(): Promise<void> {
        if (this.metricsBuffer.length === 0) return;

        const batch = [...this.metricsBuffer];
        this.metricsBuffer = [];

        try {
            // Phase P3.3 — Stocker les métriques agrégées en Redis (time-series)
            const now = Date.now();
            const windowKey = `${this.REDIS_METRICS_PREFIX}${Math.floor(now / this.FLUSH_INTERVAL_MS)}`;

            // Agrégation par type de métrique
            const aggregated: Record<string, { count: number; sum: number; min: number; max: number }> = {};
            for (const m of batch) {
                const key = m.name;
                if (!aggregated[key]) {
                    aggregated[key] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
                }
                aggregated[key].count++;
                aggregated[key].sum += m.value;
                aggregated[key].min = Math.min(aggregated[key].min, m.value);
                aggregated[key].max = Math.max(aggregated[key].max, m.value);
            }

            // Stocker l'agrégation en Redis (TTL 24h)
            await redisService.setJSON(windowKey, aggregated, 86400);

            // Logger les erreurs
            const errors = batch.filter((m) => m.name.includes('error'));
            if (errors.length > 0) {
                logger.warn(`[Metrics] ${errors.length} erreurs détectées dans les dernières ${this.FLUSH_INTERVAL_MS / 1000}s`);
            }

            logger.info(`[Metrics] ${batch.length} points → Redis ${windowKey} (${Object.keys(aggregated).length} séries)`);
        } catch (error: any) {
            logger.error(`[Metrics] Erreur flush: ${error.message}`);
            // Remettre les métriques dans le buffer
            this.metricsBuffer.unshift(...batch);
        }
    }

    private normalizePath(path: string): string {
        // Remplacer les UUIDs par :id pour agréger les métriques
        return path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id');
    }

    // =============================================
    // REDIS TIME-SERIES (Phase P3.3)
    // =============================================

    /**
     * Persiste une durée HTTP dans Redis sorted set (time-series).
     * Score = timestamp, Member = durationMs.
     */
    private async persistDurationToRedis(durationMs: number, etablissementId?: string): Promise<void> {
        try {
            const client = await redisService.getClient();
            const key = etablissementId
                ? `${this.REDIS_DURATIONS_KEY}:tenant:${etablissementId}`
                : this.REDIS_DURATIONS_KEY;
            const now = Date.now();
            // Member unique: timestamp:duration pour éviter les collisions
            await client.zadd(key, String(now), `${now}:${durationMs}`);
            // Garder seulement les N derniers échantillons
            const count = await client.zcard(key);
            if (count > this.REDIS_DURATIONS_MAX) {
                await client.zremrangebyrank(key, 0, count - this.REDIS_DURATIONS_MAX - 1);
            }
            // TTL 24h
            await client.expire(key, 86400);
        } catch {
            // Silencieux — le cache local reste le fallback
        }
    }

    /**
     * Charge les durées récentes depuis Redis au démarrage.
     */
    private async loadDurationsFromRedis(): Promise<void> {
        try {
            const client = await redisService.getClient();
            const members = await client.zrange(this.REDIS_DURATIONS_KEY, -this.MAX_DURATION_SAMPLES, -1);
            this.recentDurations = members
                .map((m: string) => parseFloat(m.split(':')[1]))
                .filter((v: number) => !isNaN(v));
            logger.info(`[Metrics] ${this.recentDurations.length} durées restaurées depuis Redis`);
        } catch {
            logger.warn('[Metrics] Impossible de restaurer les durées depuis Redis — démarrage à vide');
        }
    }

    /**
     * Récupère les métriques agrégées depuis Redis pour une période.
     */
    async getStoredAggregations(period: '1h' | '24h' | '7d' = '24h'): Promise<Record<string, any>[]> {
        try {
            const client = await redisService.getClient();
            const now = Date.now();
            let windowCount: number;

            switch (period) {
                case '1h': windowCount = Math.ceil(3600_000 / this.FLUSH_INTERVAL_MS); break;
                case '24h': windowCount = Math.ceil(86400_000 / this.FLUSH_INTERVAL_MS); break;
                case '7d': windowCount = Math.ceil(7 * 86400_000 / this.FLUSH_INTERVAL_MS); break;
            }

            const currentWindow = Math.floor(now / this.FLUSH_INTERVAL_MS);
            const keys: string[] = [];
            for (let i = 0; i < windowCount; i++) {
                keys.push(`${this.REDIS_METRICS_PREFIX}${currentWindow - i}`);
            }

            // Pipeline pour récupérer toutes les agrégations
            const pipeline = client.pipeline();
            for (const key of keys) {
                pipeline.get(key);
            }
            const results = await pipeline.exec();

            return results
                ?.filter(([, err, val]) => !err && val)
                .map(([, , val]) => JSON.parse(val as string))
                ?? [];
        } catch {
            return [];
        }
    }

    destroy(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        this.flush();
    }
}

export const metricsCollector = new MetricsCollectorService();
export default MetricsCollectorService;
