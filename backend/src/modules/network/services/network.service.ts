import { AppDataSource } from '@database/data-source';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import os from 'os';

const INTERNET_PROBE_URL = 'https://1.1.1.1';
const INTERNET_PROBE_TIMEOUT = 5000;
const PROBE_CACHE_TTL = 30;

interface PingResponse {
    /** Statut global agrégé (DB + mémoire + internet) */
    status: 'ok' | 'degraded' | 'down';
    /** Santé serveur uniquement (DB + mémoire, ignore internet) */
    serverHealth: 'ok' | 'degraded' | 'down';
    timestamp: string;
    version?: string;
    details: {
        database: boolean;
        memory: boolean;
        freeMemoryMB: number;
        internet: boolean | null;
    };
    latencyMs?: number;
}

export class NetworkService {
    private cache: { internet: boolean | null; expiresAt: number } = { internet: null, expiresAt: 0 };

    async ping(): Promise<PingResponse> {
        const start = Date.now();
        const details = {
            database: false,
            memory: false,
            freeMemoryMB: 0,
            internet: null as boolean | null,
        };

        // DB check
        try {
            await AppDataSource.query('SELECT 1');
            details.database = true;
        } catch {
            details.database = false;
        }

        // Memory check
        const freeMemory = os.freemem();
        details.freeMemoryMB = Math.round(freeMemory / 1024 / 1024);
        details.memory = freeMemory > 100 * 1024 * 1024;

        // Internet probe with Redis/memory cache
        details.internet = await this.checkInternet();

        const latencyMs = Date.now() - start;

        // serverHealth : santé serveur uniquement (DB + mémoire, sans internet)
        const serverHealthDown = !details.database;
        const serverHealthAllOk = details.database && details.memory;
        const serverHealth: 'ok' | 'degraded' | 'down' = serverHealthDown
            ? 'down'
            : serverHealthAllOk ? 'ok' : 'degraded';

        // status : statut global agrégé (DB + mémoire + internet)
        const allOk = Object.entries(details).every(([k, v]) =>
            k === 'freeMemoryMB' || v === true || v === null
        );
        const anyDown = !details.database;

        return {
            status: anyDown ? 'down' : allOk ? 'ok' : 'degraded',
            serverHealth,
            timestamp: new Date().toISOString(),
            details,
            latencyMs,
        };
    }

    private async checkInternet(): Promise<boolean | null> {
        // Check cache first
        if (Date.now() < this.cache.expiresAt) {
            return this.cache.internet;
        }

        // Try Redis cache
        try {
            const cached = await redisService.get('network:internet');
            if (cached !== null) {
                this.cache.internet = cached === 'true';
                this.cache.expiresAt = Date.now() + PROBE_CACHE_TTL * 1000;
                return this.cache.internet;
            }
        } catch {
            // Redis unavailable, use memory cache
        }

        // Probe external
        const result = await this.probeInternet();
        this.cache.internet = result;
        this.cache.expiresAt = Date.now() + PROBE_CACHE_TTL * 1000;

        // Set Redis cache (non-blocking)
        try {
            await redisService.set('network:internet', String(result), PROBE_CACHE_TTL);
        } catch {
            // Silent — memory cache is sufficient
        }

        return result;
    }

    private async probeInternet(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), INTERNET_PROBE_TIMEOUT);
            const response = await fetch(INTERNET_PROBE_URL, {
                method: 'HEAD',
                signal: controller.signal,
            });
            clearTimeout(timeout);
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const networkService = new NetworkService();
