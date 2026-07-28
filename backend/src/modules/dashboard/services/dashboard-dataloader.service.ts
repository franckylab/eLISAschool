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
import { Note, StatutNote } from '@modules/notes/entities';
import { AffectationEleve } from '@modules/classes/entities';

interface BatchResult {
    [key: string]: any[];
}

export class DashboardDataLoaderService {
    private eleveRepo: Repository<Eleve>;
    private affectationRepo: Repository<AffectationEleve>;
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
        this.affectationRepo = AppDataSource.getRepository(AffectationEleve);
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
        // NB: colonnes camelCase quotées (pas de NamingStrategy dans le projet)
        const query = `
            SELECT 
                "etablissementId",
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE statut = 'ACTIF') as actifs,
                COUNT(*) FILTER (WHERE statut = 'INACTIF') as inactifs,
                COUNT(*) FILTER (WHERE sexe = 'M') as masculin,
                COUNT(*) FILTER (WHERE sexe = 'F') as feminin
            FROM eleves
            WHERE "etablissementId" = ANY($1)
            GROUP BY "etablissementId"
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
            statsMap.set(row.etablissementId, {
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

        // NB: colonnes camelCase quotées (pas de NamingStrategy dans le projet)
        // Statuts comptés unifiés : VALIDEE + PUBLIEE
        // Moyenne pondérée par le coefficient de chaque note (cohérent avec calculerMoyenne)
        const query = `
            SELECT 
                ae."classeId",
                SUM(n.valeur / NULLIF(n.bareme, 0) * 20 * COALESCE(n.coefficient, 1))
                    / NULLIF(SUM(COALESCE(n.coefficient, 1)), 0) as moyenne
            FROM notes n
            INNER JOIN affectations_eleves ae ON n."eleveId" = ae."eleveId"
            WHERE ae."classeId" = ANY($1)
            AND ae.actif = true
            AND ae.statut = 'ACTIVE'
            AND n.statut::text = ANY($2)
            ${periodeId ? 'AND n."periodeId" = $3' : ''}
            GROUP BY ae."classeId"
        `;

        const statutsComptes = [StatutNote.VALIDEE, StatutNote.PUBLIEE];
        const params = periodeId ? [classeIds, statutsComptes, periodeId] : [classeIds, statutsComptes];
        const results = await this.noteRepo.query(query, params);
        
        const moyennesMap = new Map<string, number>();
        
        for (const id of classeIds) {
            moyennesMap.set(id, 0);
        }

        for (const row of results) {
            const moyenne = row.moyenne !== null ? parseFloat(row.moyenne) : 0;
            moyennesMap.set(row.classeId, Math.round(moyenne * 100) / 100);
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

        const results = await this.affectationRepo
            .createQueryBuilder('ae')
            .select('ae.classeId', 'classeId')
            .addSelect('COUNT(ae.eleveId)', 'effectif')
            .where('ae.classeId IN (:...classeIds)', { classeIds })
            .andWhere('ae.statut = :statut', { statut: 'ACTIVE' })
            .andWhere('ae.actif = :actif', { actif: true })
            .groupBy('ae.classeId')
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
