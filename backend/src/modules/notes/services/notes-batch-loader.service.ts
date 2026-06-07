/**
 * ==================================
 * eLISAschool - Service Batch Loader pour Notes
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Résout le problème N+1 dans le calcul des bulletins
 * en batchant les requêtes de calcul de moyennes
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Note, StatutNote } from '@modules/notes/entities';
import { logger } from '@common/utils/logger.util';

/**
 * Clé de cache pour les moyennes batchées
 */
interface BatchKey {
    eleveId: string;
    matiereId: string;
    periodeId: string;
}

/**
 * Service de batch loading pour les notes
 */
export class NotesBatchLoaderService {
    private noteRepo: Repository<Note>;
    private batchCache: Map<string, Map<string, number>> = new Map();
    private batchTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private stats = {
        totalBatches: 0,
        totalQueries: 0,
        savedQueries: 0,
    };

    constructor() {
        this.noteRepo = AppDataSource.getRepository(Note);
    }

    /**
     * Charge les moyennes de plusieurs élèves/matieres/périodes en UNE seule requête
     * 
     * @param batchKeys - Liste de combinaisons (élève, matière, période)
     * @returns Map de Map: eleveId -> (matiereId -> moyenne)
     */
    async batchLoadMoyennes(batchKeys: BatchKey[]): Promise<Map<string, Map<string, number>>> {
        if (batchKeys.length === 0) {
            return new Map();
        }

        this.stats.totalBatches++;

        // Regrouper par période pour optimiser les requêtes
        const byPeriod = new Map<string, BatchKey[]>();
        for (const key of batchKeys) {
            const periodKey = key.periodeId || 'all';
            if (!byPeriod.has(periodKey)) {
                byPeriod.set(periodKey, []);
            }
            byPeriod.get(periodKey)!.push(key);
        }

        const result = new Map<string, Map<string, number>>();

        // Pour chaque période, faire une requête batch
        for (const [periodKey, keys] of byPeriod) {
            const eleveIds = [...new Set(keys.map(k => k.eleveId))];
            const matiereIds = [...new Set(keys.map(k => k.matiereId))];

            // Créer la clé de cache
            const cacheKey = `batch:${periodKey}:${eleveIds.sort().join(',')}:${matiereIds.sort().join(',')}`;

            // Vérifier le cache pour cette période
            const cachedData = this.batchCache.get(cacheKey);
            if (cachedData) {
                for (const [eleveId, moyennes] of cachedData) {
                    if (!result.has(eleveId)) {
                        result.set(eleveId, new Map());
                    }
                    const eleveMap = result.get(eleveId)!;
                    for (const [matiereId, moyenne] of (moyennes as unknown as Map<string, number>)) {
                        eleveMap.set(matiereId, moyenne);
                    }
                }
                continue;
            }

            // Requête batch UNIQUE
            const query = `
                SELECT 
                    eleve_id,
                    matiere_id,
                    AVG(valeur / bareme * 20 * coefficient) / AVG(coefficient) as moyenne
                FROM notes
                WHERE eleve_id = ANY($1)
                AND matiere_id = ANY($2)
                AND statut = 'PUBLIEE'
                ${periodKey !== 'all' ? 'AND periode_id = $3' : ''}
                GROUP BY eleve_id, matiere_id
            `;

            const params = periodKey !== 'all' 
                ? [eleveIds, matiereIds, periodKey]
                : [eleveIds, matiereIds];

            const results = await this.noteRepo.query(query, params);

            // Construire la map de résultats
            const periodResult = new Map<string, Map<string, number>>();

            // Initialiser toutes les combinaisons demandées avec 0
            for (const key of keys) {
                if (!periodResult.has(key.eleveId)) {
                    periodResult.set(key.eleveId, new Map());
                }
                periodResult.get(key.eleveId)!.set(key.matiereId, 0);
            }

            // Remplir avec les résultats réels
            for (const row of results) {
                const eleveId = row.eleve_id;
                const matiereId = row.matiere_id;
                const moyenne = Math.round(parseFloat(row.moyenne) * 100) / 100;

                if (!periodResult.has(eleveId)) {
                    periodResult.set(eleveId, new Map());
                }
                periodResult.get(eleveId)!.set(matiereId, moyenne);
            }

            // Merge dans le résultat global
            for (const [eleveId, moyennes] of periodResult) {
                if (!result.has(eleveId)) {
                    result.set(eleveId, new Map());
                }
                for (const [matiereId, moyenne] of moyennes) {
                    result.get(eleveId)!.set(matiereId, moyenne);
                }
            }

            // Cache (5 min)
            this.batchCache.set(cacheKey, periodResult as any);
            this.scheduleCacheCleanup(cacheKey, 300000);

            this.stats.savedQueries += keys.length - 1;
            this.stats.totalQueries += keys.length;

            logger.debug(`[NotesBatchLoader] Batch: ${keys.length} combinaisons en 1 requête (période: ${periodKey})`);
        }

        return result;
    }

    /**
     * Charge les moyennes générales de plusieurs élèves en UNE requête
     * 
     * @param eleveIds - IDs des élèves
     * @param periodeId - ID de la période (optionnel)
     * @returns Map: eleveId -> moyenneGénérale
     */
    async batchLoadMoyennesGenerales(
        eleveIds: string[], 
        periodeId?: string
    ): Promise<Map<string, number>> {
        if (eleveIds.length === 0) {
            return new Map();
        }

        this.stats.totalBatches++;

        const cacheKey = `batch:moyennes-gen:${eleveIds.sort().join(',')}:${periodeId || 'all'}`;
        
        if (this.batchCache.has(cacheKey)) {
            return this.batchCache.get(cacheKey)!;
        }

        // Requête batch pour toutes les moyennes générales
        const query = `
            SELECT 
                eleve_id,
                AVG(valeur / bareme * 20 * coefficient) / AVG(coefficient) as moyenne_generale
            FROM notes
            WHERE eleve_id = ANY($1)
            AND statut = 'PUBLIEE'
            ${periodeId ? 'AND periode_id = $2' : ''}
            GROUP BY eleve_id
        `;

        const params = periodeId ? [eleveIds, periodeId] : [eleveIds];
        const results = await this.noteRepo.query(query, params);

        const moyennesMap = new Map<string, number>();

        // Initialiser tous les élèves avec 0
        for (const eleveId of eleveIds) {
            moyennesMap.set(eleveId, 0);
        }

        // Remplir avec les résultats
        for (const row of results) {
            moyennesMap.set(row.eleve_id, Math.round(parseFloat(row.moyenne_generale) * 100) / 100);
        }

        // Cache (5 min)
        this.batchCache.set(cacheKey, moyennesMap);
        this.scheduleCacheCleanup(cacheKey, 300000);

        this.stats.savedQueries += eleveIds.length - 1;
        this.stats.totalQueries += eleveIds.length;

        logger.debug(`[NotesBatchLoader] Moyennes générales: ${eleveIds.length} élèves en 1 requête`);

        return moyennesMap;
    }

    /**
     * Planifier le nettoyage d'une entrée cache
     */
    private scheduleCacheCleanup(key: string, ttl: number): void {
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
     * Nettoyer le cache
     */
    clearCache(): void {
        this.batchTimeouts.forEach(timeout => clearTimeout(timeout));
        this.batchTimeouts.clear();
        
        const size = this.batchCache.size;
        this.batchCache.clear();
        logger.info(`[NotesBatchLoader] Cache vidé: ${size} entrées supprimées`);
    }

    /**
     * Statistiques du batch loader
     */
    getStats(): {
        cacheSize: number;
        totalBatches: number;
        totalQueries: number;
        savedQueries: number;
        efficiency: string;
    } {
        const efficiency = this.stats.totalQueries > 0
            ? ((this.stats.savedQueries / this.stats.totalQueries) * 100).toFixed(2)
            : '0.00';

        return {
            cacheSize: this.batchCache.size,
            totalBatches: this.stats.totalBatches,
            totalQueries: this.stats.totalQueries,
            savedQueries: this.stats.savedQueries,
            efficiency: `${efficiency}%`,
        };
    }
}

// Singleton export
export const notesBatchLoaderService = new NotesBatchLoaderService();
export default notesBatchLoaderService;
