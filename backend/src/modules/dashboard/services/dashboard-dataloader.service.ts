/**
 * ==================================
 * eLISAschool - Service DataLoader Dashboard
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Optimisation des requêtes par batching pour éviter le N+1 problem
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { Eleve } from '@modules/eleves/entities';
import { Note } from '@modules/notes/entities';

interface BatchResult {
    [key: string]: any[];
}

export class DashboardDataLoaderService {
    private eleveRepo: Repository<Eleve>;
    private noteRepo: Repository<Note>;

    // Cache de batch
    private batchCache: Map<string, any> = new Map();
    private batchTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private batchStats = {
        totalBatches: 0,
        totalQueries: 0,
        savedQueries: 0,
    };

    constructor() {
        this.eleveRepo = AppDataSource.getRepository(Eleve);
        this.noteRepo = AppDataSource.getRepository(Note);
    }

    /**
     * Charge les statistiques de plusieurs établissements en une seule requête
     */
    async batchLoadElevesStats(etablissementIds: string[]): Promise<Map<string, any>> {
        const cacheKey = `batch:eleves:stats:${etablissementIds.sort().join(',')}`;
        
        // Vérifier cache
        if (this.batchCache.has(cacheKey)) {
            logger.debug(`[DataLoader] Cache hit: ${cacheKey}`);
            return this.batchCache.get(cacheKey);
        }

        this.batchStats.totalBatches++;
        
        // Requête batch UNIQUE au lieu de N requêtes
        const query = `
            SELECT 
                etablissement_id,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE statut = 'ACTIF') as actifs,
                COUNT(*) FILTER (WHERE statut = 'INACTIF') as inactifs,
                COUNT(*) FILTER (WHERE genre = 'M') as masculin,
                COUNT(*) FILTER (WHERE genre = 'F') as feminin
            FROM eleves
            WHERE etablissement_id = ANY($1)
            GROUP BY etablissement_id
        `;

        const results = await this.eleveRepo.query(query, [etablissementIds]);
        
        const statsMap = new Map<string, any>();
        
        // Initialiser tous les IDs (même sans données)
        for (const id of etablissementIds) {
            statsMap.set(id, {
                total: 0,
                actifs: 0,
                inactifs: 0,
                parGenre: { masculin: 0, feminin: 0 }
            });
        }

        // Remplir avec les résultats
        for (const row of results) {
            statsMap.set(row.etablissement_id, {
                total: parseInt(row.total),
                actifs: parseInt(row.actifs),
                inactifs: parseInt(row.inactifs),
                parGenre: {
                    masculin: parseInt(row.masculin),
                    feminin: parseInt(row.feminin),
                }
            });
        }

        // Cache (5 min)
        this.batchCache.set(cacheKey, statsMap);
        this.scheduleCacheCleanup(cacheKey, 300000);

        this.batchStats.savedQueries += etablissementIds.length - 1;
        this.batchStats.totalQueries += etablissementIds.length;

        logger.debug(`[DataLoader] Batch eleves stats: ${etablissementIds.length} établissements en 1 requête`);

        return statsMap;
    }

    /**
     * Charge les moyennes de plusieurs classes en une seule requête
     */
    async batchLoadNotesMoyennes(classeIds: string[], periodeId?: string): Promise<Map<string, number>> {
        const cacheKey = `batch:notes:moyennes:${classeIds.sort().join(',')}:${periodeId || 'all'}`;
        
        if (this.batchCache.has(cacheKey)) {
            return this.batchCache.get(cacheKey);
        }

        this.batchStats.totalBatches++;

        const query = `
            SELECT 
                e.classe_id,
                AVG(n.valeur / n.bareme * 20) as moyenne
            FROM notes n
            INNER JOIN eleves e ON n.eleve_id = e.id
            WHERE e.classe_id = ANY($1)
            AND n.statut = 'VALIDEE'
            ${periodeId ? 'AND n.periode_id = $2' : ''}
            GROUP BY e.classe_id
        `;

        const params = periodeId ? [classeIds, periodeId] : [classeIds];
        const results = await this.noteRepo.query(query, params);
        
        const moyennesMap = new Map<string, number>();
        
        for (const id of classeIds) {
            moyennesMap.set(id, 0);
        }

        for (const row of results) {
            moyennesMap.set(row.classe_id, Math.round(parseFloat(row.moyenne) * 100) / 100);
        }

        this.batchCache.set(cacheKey, moyennesMap);
        this.scheduleCacheCleanup(cacheKey, 300000);

        this.batchStats.savedQueries += classeIds.length - 1;
        this.batchStats.totalQueries += classeIds.length;

        logger.debug(`[DataLoader] Batch notes moyennes: ${classeIds.length} classes en 1 requête`);

        return moyennesMap;
    }

    /**
     * Charge les effectifs de plusieurs classes en une seule requête
     */
    async batchLoadEffectifsClasses(classeIds: string[]): Promise<Map<string, number>> {
        const cacheKey = `batch:effectifs:${classeIds.sort().join(',')}`;
        
        if (this.batchCache.has(cacheKey)) {
            return this.batchCache.get(cacheKey);
        }

        this.batchStats.totalBatches++;

        const results = await this.eleveRepo
            .createQueryBuilder('e')
            .select('e.classeId', 'classeId')
            .addSelect('COUNT(e.id)', 'effectif')
            .where('e.classeId IN (:...classeIds)', { classeIds })
            .andWhere('e.statut = :statut', { statut: 'ACTIF' })
            .groupBy('e.classeId')
            .getRawMany();

        const effectifsMap = new Map<string, number>();
        
        for (const id of classeIds) {
            effectifsMap.set(id, 0);
        }

        for (const row of results) {
            effectifsMap.set(row.classeId, parseInt(row.effectif));
        }

        this.batchCache.set(cacheKey, effectifsMap);
        this.scheduleCacheCleanup(cacheKey, 300000);

        this.batchStats.savedQueries += classeIds.length - 1;

        logger.debug(`[DataLoader] Batch effectifs: ${classeIds.length} classes en 1 requête`);

        return effectifsMap;
    }

    /**
     * Planifier le nettoyage d'une entrée cache
     */
    private scheduleCacheCleanup(key: string, ttl: number): void {
        // Annuler l'ancien timeout si existant
        if (this.batchTimeouts.has(key)) {
            clearTimeout(this.batchTimeouts.get(key)!);
        }

        const timeout = setTimeout(() => {
            this.batchCache.delete(key);
            this.batchTimeouts.delete(key);
        }, ttl);

        this.batchTimeouts.set(key, timeout);
    }

    /**
     * Nettoie le cache de batch
     */
    clearCache(): void {
        // Annuler tous les timeouts
        this.batchTimeouts.forEach(timeout => clearTimeout(timeout));
        this.batchTimeouts.clear();
        
        const size = this.batchCache.size;
        this.batchCache.clear();
        logger.info(`[DataLoader] Cache vidé: ${size} entrées supprimées`);
    }

    /**
     * Statistiques du DataLoader
     */
    getStats(): {
        cacheSize: number;
        totalBatches: number;
        totalQueries: number;
        savedQueries: number;
        efficiency: string;
    } {
        const efficiency = this.batchStats.totalQueries > 0
            ? ((this.batchStats.savedQueries / this.batchStats.totalQueries) * 100).toFixed(2)
            : '0.00';

        return {
            cacheSize: this.batchCache.size,
            totalBatches: this.batchStats.totalBatches,
            totalQueries: this.batchStats.totalQueries,
            savedQueries: this.batchStats.savedQueries,
            efficiency: `${efficiency}%`,
        };
    }
}

export const dashboardDataLoaderService = new DashboardDataLoaderService();
