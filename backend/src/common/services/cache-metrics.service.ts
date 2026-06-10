/**
 * ==================================
 * eLISAschool - Service Monitoring Métriques Cache
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Description: Collecte et expose les métriques de performance du cache
 */

import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';

/**
 * Interface pour les métriques de cache
 */
export interface CacheMetrics {
    timestamp: string;
    redis: {
        connecte: boolean;
        memoireUtilisee: string;
        cles: number;
        hitRate: number;
        missRate: number;
        opsParSeconde: number;
    };
    inMemory: {
        permissions: number;
        preferencesGlobales: number;
        configuration: number;
        total: number;
    };
    performance: {
        tempsMoyenReponse: number;
        cacheHitRatio: number;
        requetesDBEvitees: number;
    };
}

/**
 * Service de monitoring des métriques de cache
 */
export class CacheMetricsService {
    private stats = {
        hits: 0,
        misses: 0,
        tempsReponse: [] as number[],
        requetesEvitees: 0,
    };

    /**
     * Enregistrer un hit de cache
     */
    recordHit(tempsReponse?: number): void {
        this.stats.hits++;
        if (tempsReponse) {
            this.stats.tempsReponse.push(tempsReponse);
        }
    }

    /**
     * Enregistrer un miss de cache
     */
    recordMiss(tempsReponse?: number): void {
        this.stats.misses++;
        if (tempsReponse) {
            this.stats.tempsReponse.push(tempsReponse);
        }
    }

    /**
     * Enregistrer une requête DB évitée grâce au cache
     */
    recordQueryAvoided(): void {
        this.stats.requetesEvitees++;
    }

    /**
     * Calculer le temps moyen de réponse
     */
    private getTempsMoyenReponse(): number {
        if (this.stats.tempsReponse.length === 0) {
            return 0;
        }

        const total = this.stats.tempsReponse.reduce((sum, t) => sum + t, 0);
        return Math.round((total / this.stats.tempsReponse.length) * 100) / 100;
    }

    /**
     * Calculer le ratio de hit
     */
    private getHitRatio(): number {
        const total = this.stats.hits + this.stats.misses;
        if (total === 0) {
            return 0;
        }
        return Math.round((this.stats.hits / total) * 10000) / 100;
    }

    /**
     * Obtenir les statistiques Redis
     */
    private async getRedisStats(): Promise<CacheMetrics['redis']> {
        try {
            const estConnecte = await redisService.isAvailable();

            if (!estConnecte) {
                return {
                    connecte: false,
                    memoireUtilisee: 'N/A',
                    cles: 0,
                    hitRate: 0,
                    missRate: 0,
                    opsParSeconde: 0,
                };
            }

            // Récupérer les stats Redis
            const stats = await redisService.getStats();

            return {
                connecte: true,
                memoireUtilisee: stats.usedMemory || 'N/A',
                cles: stats.keysCount || 0,
                hitRate: 0, // Non disponible via ioredis directement
                missRate: 0,
                opsParSeconde: 0,
            };
        } catch (error) {
            logger.error('[CacheMetrics] Erreur récupération stats Redis', error);
            return {
                connecte: false,
                memoireUtilisee: 'Erreur',
                cles: 0,
                hitRate: 0,
                missRate: 0,
                opsParSeconde: 0,
            };
        }
    }

    /**
     * Obtenir les métriques complètes du cache
     */
    async getMetrics(): Promise<CacheMetrics> {
        const [redisStats] = await Promise.all([
            this.getRedisStats(),
        ]);

        // Estimation des caches in-memory (via reflection sur les services)
        // Note: Ces valeurs sont approximatives
        const inMemoryMetrics = {
            permissions: 0, // À récupérer depuis permissionResolverService
            preferencesGlobales: 0, // À récupérer depuis preferenceGlobaleService
            configuration: 0, // À récupérer depuis configurationService
            total: 0,
        };

        inMemoryMetrics.total = 
            inMemoryMetrics.permissions +
            inMemoryMetrics.preferencesGlobales +
            inMemoryMetrics.configuration;

        return {
            timestamp: new Date().toISOString(),
            redis: redisStats,
            inMemory: inMemoryMetrics,
            performance: {
                tempsMoyenReponse: this.getTempsMoyenReponse(),
                cacheHitRatio: this.getHitRatio(),
                requetesDBEvitees: this.stats.requetesEvitees,
            },
        };
    }

    /**
     * Réinitialiser les statistiques
     */
    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            tempsReponse: [],
            requetesEvitees: 0,
        };

        logger.info('[CacheMetrics] Statistiques réinitialisées');
    }

    /**
     * Générer un rapport de performance
     */
    genererRapport(): string {
        const hitRatio = this.getHitRatio();
        const tempsMoyen = this.getTempsMoyenReponse();

        let statut = '✅ Excellent';
        if (hitRatio < 50) {
            statut = '❌ Critique';
        } else if (hitRatio < 70) {
            statut = '⚠️ Moyen';
        } else if (hitRatio < 85) {
            statut = '🟡 Bon';
        }

        return `
📊 RAPPORT PERFORMANCE CACHE
================================
Statut: ${statut}
Timestamp: ${new Date().toISOString()}

Cache Hit Ratio: ${hitRatio}%
  - Hits: ${this.stats.hits}
  - Misses: ${this.stats.misses}

Temps Moyen de Réponse: ${tempsMoyen}ms
Requêtes DB Évitées: ${this.stats.requetesEvitees}

Recommandations:
${hitRatio < 80 ? '⚠️ Hit ratio faible - Vérifier la stratégie de cache' : '✅ Hit ratio acceptable'}
${tempsMoyen > 100 ? '⚠️ Temps de réponse élevé - Optimiser les requêtes' : '✅ Temps de réponse bon'}
${this.stats.requetesEvitees > 1000 ? '✅ Cache très efficace' : ''}
        `.trim();
    }
}

export const cacheMetricsService = new CacheMetricsService();
