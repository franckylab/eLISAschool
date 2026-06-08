/**
 * ==================================
 * eLISAschool - Service Consolidation Multi-Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Agrégation des statistiques et rapports pour plusieurs établissements.
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Eleve, StatutEleve } from '@modules/eleves/entities';
import { Note } from '@modules/notes/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { Paiement, Echeancier, Depense, StatutDepense } from '@modules/finances/entities';
import { Utilisateur } from '@modules/auth/entities';
import { groupesService } from './groupes.service';
import { dashboardCacheService } from '@modules/dashboard/services/dashboard-cache.service';
import { logger } from '@common/utils/logger.util';

// Types pour consolidation
interface ConsolidatedElevesStats {
    total: number;
    actifs: number;
    inactifs: number;
    parGenre: { masculin: number; feminin: number };
}

interface ConsolidatedNotesStats {
    moyenneGenerale: number;
    totalNotes: number;
    distribution: {
        '0-5': number;
        '5-10': number;
        '10-15': number;
        '15-20': number;
    };
}

interface ConsolidatedFinancesStats {
    totalPaye: number;
    totalAttendu: number;
    totalImpaye: number;
    totalDepenses: number;
    tauxRecouvrement: number;
    beneficeNet: number;
}

interface ConsolidatedDashboard {
    groupeId: string;
    nombreEtablissements: number;
    eleves: ConsolidatedElevesStats;
    notes: ConsolidatedNotesStats;
    finances: ConsolidatedFinancesStats;
    detailsParEtablissement: Array<{
        etablissementId: string;
        nom: string;
        eleves: any;
        finances: any;
    }>;
    timestamp: string;
}

interface RapportScolariteConsolide {
    groupeId: string;
    periode: { dateDebut: Date; dateFin: Date };
    totals: ConsolidatedElevesStats;
    details: Array<{
        etablissementId: string;
        nom: string;
        eleves: any;
    }>;
}

interface RapportFinancierConsolide {
    groupeId: string;
    periode: { dateDebut: Date; dateFin: Date };
    paiementsParEtablissement: any[];
    depensesParEtablissement: any[];
    totals: ConsolidatedFinancesStats;
}

export class ConsolidationService {
    private eleveRepo: Repository<Eleve>;
    private noteRepo: Repository<Note>;
    private etablissementRepo: Repository<Etablissement>;
    private paiementRepo: Repository<Paiement>;
    private echeancierRepo: Repository<Echeancier>;
    private depenseRepo: Repository<Depense>;
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.eleveRepo = AppDataSource.getRepository(Eleve);
        this.noteRepo = AppDataSource.getRepository(Note);
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
        this.paiementRepo = AppDataSource.getRepository(Paiement);
        this.echeancierRepo = AppDataSource.getRepository(Echeancier);
        this.depenseRepo = AppDataSource.getRepository(Depense);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    }

    // ==================================
    // Dashboard Consolidé
    // ==================================

    /**
     * Récupère le dashboard consolidé pour un groupe
     */
    async getDashboardConsolide(groupeId: string): Promise<ConsolidatedDashboard> {
        // Vérifier cache (TTL 4h)
        const cached = await dashboardCacheService.get(`precalc:groupe:${groupeId}`);
        if (cached) {
            return cached as ConsolidatedDashboard;
        }

        const etablissements = await groupesService.getEtablissementsDuGroupe(groupeId);
        const etabIds = etablissements.map(e => e.id);

        if (etabIds.length === 0) {
            return {
                groupeId,
                nombreEtablissements: 0,
                eleves: { total: 0, actifs: 0, inactifs: 0, parGenre: { masculin: 0, feminin: 0 } },
                notes: { moyenneGenerale: 0, totalNotes: 0, distribution: { '0-5': 0, '5-10': 0, '10-15': 0, '15-20': 0 } },
                finances: { totalPaye: 0, totalAttendu: 0, totalImpaye: 0, totalDepenses: 0, tauxRecouvrement: 0, beneficeNet: 0 },
                detailsParEtablissement: [],
                timestamp: new Date().toISOString(),
            };
        }

        // Agrégation parallèle
        const [elevesStats, notesStats, financesStats] = await Promise.all([
            this.aggregateElevesStats(etabIds),
            this.aggregateNotesStats(etabIds),
            this.aggregateFinancesStats(etabIds),
        ]);

        // Détails par établissement
        const detailsParEtablissement = await Promise.all(
            etablissements.map(async (etab) => ({
                etablissementId: etab.id,
                nom: etab.nom,
                eleves: await this.getElevesStatsForEtablissement(etab.id),
                finances: { message: 'Données financières disponibles via endpoint dédié' },
            }))
        );

        const result: ConsolidatedDashboard = {
            groupeId,
            nombreEtablissements: etablissements.length,
            eleves: elevesStats,
            notes: notesStats,
            finances: financesStats,
            detailsParEtablissement,
            timestamp: new Date().toISOString(),
        };

        // Cache 4h
        await dashboardCacheService.set(
            `precalc:groupe:${groupeId}`,
            result,
            14400, // 4 heures
            `groupe:${groupeId}`
        );

        return result;
    }

    // ==================================
    // Rapport Scolarité Consolidé
    // ==================================

    /**
     * Génère un rapport de scolarité consolidé
     */
    async getRapportScolariteConsolide(
        groupeId: string,
        dateDebut: Date,
        dateFin: Date
    ): Promise<RapportScolariteConsolide> {
        const etablissements = await groupesService.getEtablissementsDuGroupe(groupeId);
        const etabIds = etablissements.map(e => e.id);

        if (etabIds.length === 0) {
            return {
                groupeId,
                periode: { dateDebut, dateFin },
                totals: { total: 0, actifs: 0, inactifs: 0, parGenre: { masculin: 0, feminin: 0 } },
                details: [],
            };
        }

        // Agrégation SQL côté DB
        const rawResults = await this.eleveRepo
            .createQueryBuilder('e')
            .innerJoin('utilisateurs', 'u', 'e.utilisateurId = u.id')
            .select('e.etablissementId', 'etablissementId')
            .addSelect('COUNT(e.id)', 'total')
            .addSelect('COUNT(CASE WHEN e.statut = \'ACTIF\' THEN 1 END)', 'actifs')
            .addSelect('COUNT(CASE WHEN e.statut = \'INACTIF\' THEN 1 END)', 'inactifs')
            .addSelect('COUNT(CASE WHEN u.genre = \'M\' THEN 1 END)', 'males')
            .addSelect('COUNT(CASE WHEN u.genre = \'F\' THEN 1 END)', 'females')
            .where('e.etablissementId IN (:...etabIds)', { etabIds })
            .groupBy('e.etablissementId')
            .getRawMany();

        // Totaux consolidés
        const totals = this.aggregateRawElevesResults(rawResults);

        // Détails par établissement
        const details = await Promise.all(
            etablissements.map(async etab => ({
                etablissementId: etab.id,
                nom: etab.nom,
                eleves: await this.getElevesStatsForEtablissement(etab.id),
            }))
        );

        return {
            groupeId,
            periode: { dateDebut, dateFin },
            totals,
            details,
        };
    }

    // ==================================
    // Rapport Financier Consolidé
    // ==================================

    /**
     * Génère un rapport financier consolidé
     */
    async getRapportFinancierConsolide(
        groupeId: string,
        dateDebut: Date,
        dateFin: Date
    ): Promise<RapportFinancierConsolide> {
        const etablissements = await groupesService.getEtablissementsDuGroupe(groupeId);
        const etabIds = etablissements.map(e => e.id);

        if (etabIds.length === 0) {
            return {
                groupeId,
                periode: { dateDebut, dateFin },
                paiementsParEtablissement: [],
                depensesParEtablissement: [],
                totals: { totalPaye: 0, totalAttendu: 0, totalImpaye: 0, totalDepenses: 0, tauxRecouvrement: 0, beneficeNet: 0 },
            };
        }

        // Paiements par établissement
        const paiementsParEtablissement = await this.paiementRepo
            .createQueryBuilder('p')
            .select('p.etablissementId', 'etablissementId')
            .addSelect('SUM(p.montantTotal)', 'totalPaye')
            .addSelect('COUNT(p.id)', 'nombrePaiements')
            .where('p.etablissementId IN (:...etabIds)', { etabIds })
            .andWhere('p.datePaiement BETWEEN :debut AND :fin', { debut: dateDebut, fin: dateFin })
            .groupBy('p.etablissementId')
            .getRawMany();

        // Dépenses par établissement
        const depensesParEtablissement = await this.depenseRepo
            .createQueryBuilder('d')
            .select('d.etablissementId', 'etablissementId')
            .addSelect('SUM(d.montantTTC)', 'totalDepenses')
            .where('d.etablissementId IN (:...etabIds)', { etabIds })
            .andWhere('d.dateFacture BETWEEN :debut AND :fin', { debut: dateDebut, fin: dateFin })
            .andWhere('d.statut = :statut', { statut: StatutDepense.VALIDEE })
            .groupBy('d.etablissementId')
            .getRawMany();

        // Totaux
        const totals = this.aggregateFinanceRaw(paiementsParEtablissement, depensesParEtablissement);

        return {
            groupeId,
            periode: { dateDebut, dateFin },
            paiementsParEtablissement,
            depensesParEtablissement,
            totals,
        };
    }

    // ==================================
    // Méthodes d'agrégation
    // ==================================

    /**
     * Agrège les statistiques élèves pour plusieurs établissements
     */
    private async aggregateElevesStats(etabIds: string[]): Promise<ConsolidatedElevesStats> {
        // Requêtes parallèles pour performance
        const [total, actifs, statsGenre] = await Promise.all([
            this.eleveRepo.count({ where: { etablissementId: In(etabIds) } }),
            this.eleveRepo.count({ where: { etablissementId: In(etabIds), statut: StatutEleve.ACTIF as any } }),
            // Stats genre via jointure avec Utilisateur
            this.eleveRepo
                .createQueryBuilder('e')
                .innerJoin('utilisateurs', 'u', 'e.utilisateurId = u.id')
                .select('COUNT(CASE WHEN u.genre = \'M\' THEN 1 END)', 'males')
                .addSelect('COUNT(CASE WHEN u.genre = \'F\' THEN 1 END)', 'females')
                .where('e.etablissementId IN (:...etabIds)', { etabIds })
                .getRawOne(),
        ]);

        return {
            total,
            actifs,
            inactifs: total - actifs,
            parGenre: {
                masculin: parseInt(statsGenre?.males) || 0,
                feminin: parseInt(statsGenre?.females) || 0,
            },
        };
    }

    /**
     * Agrège les statistiques notes
     */
    private async aggregateNotesStats(etabIds: string[]): Promise<ConsolidatedNotesStats> {
        const notes = await this.noteRepo
            .createQueryBuilder('n')
            .select('n.valeur', 'valeur')
            .addSelect('n.bareme', 'bareme')
            .where('n.etablissementId IN (:...etabIds)', { etabIds })
            .andWhere('n.statut = :statut', { statut: 'VALIDEE' })
            .getRawMany();

        const distribution = { '0-5': 0, '5-10': 0, '10-15': 0, '15-20': 0 };
        let sommeMoyennes = 0;

        for (const note of notes) {
            const noteSur20 = (parseFloat(note.valeur) / parseFloat(note.bareme)) * 20;
            sommeMoyennes += noteSur20;

            if (noteSur20 < 5) distribution['0-5']++;
            else if (noteSur20 < 10) distribution['5-10']++;
            else if (noteSur20 < 15) distribution['10-15']++;
            else distribution['15-20']++;
        }

        const moyenneGenerale = notes.length > 0 ? sommeMoyennes / notes.length : 0;

        return {
            moyenneGenerale: Math.round(moyenneGenerale * 100) / 100,
            totalNotes: notes.length,
            distribution,
        };
    }

    /**
     * Agrège les statistiques financières (simplifié)
     * Note: Pour un vrai système, il faudrait importer les repos Finances
     */
    private async aggregateFinancesStats(etabIds: string[]): Promise<ConsolidatedFinancesStats> {
        // Placeholder - À implémenter avec les vrais repos Finances
        // Pour éviter les dépendances circulaires, on retourne des valeurs par défaut
        // L'implémentation complète se fait via getRapportFinancierConsolide()
        return {
            totalPaye: 0,
            totalAttendu: 0,
            totalImpaye: 0,
            totalDepenses: 0,
            tauxRecouvrement: 0,
            beneficeNet: 0,
        };
    }

    /**
     * Stats élèves pour un seul établissement
     */
    private async getElevesStatsForEtablissement(etablissementId: string): Promise<any> {
        const [total, actifs, statsGenre] = await Promise.all([
            this.eleveRepo.count({ where: { etablissementId } }),
            this.eleveRepo.count({ where: { etablissementId, statut: StatutEleve.ACTIF as any } }),
            this.eleveRepo
                .createQueryBuilder('e')
                .innerJoin('utilisateurs', 'u', 'e.utilisateurId = u.id')
                .select('COUNT(CASE WHEN u.genre = \'M\' THEN 1 END)', 'males')
                .addSelect('COUNT(CASE WHEN u.genre = \'F\' THEN 1 END)', 'females')
                .where('e.etablissementId = :etablissementId', { etablissementId })
                .getRawOne(),
        ]);

        return {
            total,
            actifs,
            inactifs: total - actifs,
            parGenre: {
                masculin: parseInt(statsGenre?.males) || 0,
                feminin: parseInt(statsGenre?.females) || 0,
            },
        };
    }

    /**
     * Agrège les résultats raw SQL pour élèves
     */
    private aggregateRawElevesResults(raw: any[]): ConsolidatedElevesStats {
        let total = 0, actifs = 0, inactifs = 0, males = 0, females = 0;

        for (const row of raw) {
            total += parseInt(row.total) || 0;
            actifs += parseInt(row.actifs) || 0;
            inactifs += parseInt(row.inactifs) || 0;
            males += parseInt(row.males) || 0;
            females += parseInt(row.females) || 0;
        }

        return { total, actifs, inactifs, parGenre: { masculin: males, feminin: females } };
    }

    /**
     * Agrège les résultats raw SQL pour finances
     */
    private aggregateFinanceRaw(paiements: any[], depenses: any[]): ConsolidatedFinancesStats {
        let totalPaye = 0;
        let totalDepenses = 0;

        for (const p of paiements) {
            totalPaye += parseFloat(p.totalPaye) || 0;
        }

        for (const d of depenses) {
            totalDepenses += parseFloat(d.totalDepenses) || 0;
        }

        return {
            totalPaye,
            totalAttendu: 0, // Nécessite Echeancier
            totalImpaye: 0,
            totalDepenses,
            tauxRecouvrement: 0,
            beneficeNet: totalPaye - totalDepenses,
        };
    }
}

// Singleton export
export const consolidationService = new ConsolidationService();
