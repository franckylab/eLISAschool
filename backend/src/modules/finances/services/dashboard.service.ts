/**
 * ==================================
 * eLISAschool - Service Dashboard Financier
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Statistiques et KPIs financiers pour dashboard
 */

import { Repository, Between } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { 
    Paiement, 
    Echeancier,
    Depense,
    DemandeDepense,
    StatutDepense,
    StatutDemande
} from '../entities';
import { StatutPaiement } from '@shared/enums/statuts.enum';
import { logger } from '@common/utils/logger.util';

export interface DashboardStats {
    // Scolarité
    scolarite: {
        totalAttendu: number;
        totalPaye: number;
        totalImpaye: number;
        tauxRecouvrement: number;
        nombrePaiementsMois: number;
        montantPaiementsMois: number;
    };
    // Dépenses
    depenses: {
        totalMois: number;
        nombreDepensesMois: number;
        totalAnnee: number;
        parCategorie: { categorie: string; montant: number }[];
    };
    // Trésorerie
    tresorerie: {
        soldeCaisse: number;
        soldeBanque: number;
        total: number;
    };
    // Budget
    budget: {
        totalPrevu: number;
        totalEngage: number;
        totalConsomme: number;
        tauxExecution: number;
    };
    // Alertes
    alertes: {
        impayesRetard: number;
        demandesEnCours: number;
        budgetDepasse: number;
    };
}

export class FinanceDashboardService {
    private paiementRepo: Repository<Paiement>;
    private echeancierRepo: Repository<Echeancier>;
    private depenseRepo: Repository<Depense>;
    private demandeDepenseRepo: Repository<DemandeDepense>;

    constructor() {
        this.paiementRepo = AppDataSource.getRepository(Paiement);
        this.echeancierRepo = AppDataSource.getRepository(Echeancier);
        this.depenseRepo = AppDataSource.getRepository(Depense);
        this.demandeDepenseRepo = AppDataSource.getRepository(DemandeDepense);
    }

    /**
     * Obtenir statistiques complètes du dashboard financier
     */
    async getDashboardStats(
        etablissementId: string,
        periode: 'mois' | 'trimestre' | 'annee' = 'mois'
    ): Promise<DashboardStats> {
        const now = new Date();
        let dateDebut: Date;

        switch (periode) {
            case 'mois':
                dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'trimestre':
                dateDebut = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'annee':
                dateDebut = new Date(now.getFullYear(), 0, 1);
                break;
        }

        const [scolarite, depenses, tresorerie, budget, alertes] = await Promise.all([
            this.getScolariteStats(etablissementId, dateDebut, now),
            this.getDepensesStats(etablissementId, dateDebut, now),
            this.getTresorerieStats(etablissementId),
            this.getBudgetStats(etablissementId),
            this.getAlertesStats(etablissementId)
        ]);

        return {
            scolarite,
            depenses,
            tresorerie,
            budget,
            alertes
        };
    }

    /**
     * Statistiques scolarité
     */
    private async getScolariteStats(
        etablissementId: string,
        dateDebut: Date,
        dateFin: Date
    ): Promise<DashboardStats['scolarite']> {
        // Total attendu (tous échéanciers)
        const echeanciers = await this.echeancierRepo.find({
            where: { etablissementId }
        });

        const totalAttendu = echeanciers.reduce((sum, e) => sum + Number(e.montantAttendu), 0);
        const totalPaye = echeanciers.reduce((sum, e) => sum + Number(e.montantPaye), 0);
        const totalImpaye = totalAttendu - totalPaye;

        // Taux de recouvrement
        const tauxRecouvrement = totalAttendu > 0 ? (totalPaye / totalAttendu) * 100 : 0;

        // Paiements du mois
        const paiementsMois = await this.paiementRepo.find({
            where: {
                etablissementId,
                datePaiement: Between(dateDebut, dateFin)
            }
        });

        const nombrePaiementsMois = paiementsMois.length;
        const montantPaiementsMois = paiementsMois.reduce(
            (sum, p) => sum + Number(p.montantTotal), 
            0
        );

        return {
            totalAttendu,
            totalPaye,
            totalImpaye,
            tauxRecouvrement: Math.round(tauxRecouvrement * 100) / 100,
            nombrePaiementsMois,
            montantPaiementsMois
        };
    }

    /**
     * Statistiques dépenses
     */
    private async getDepensesStats(
        etablissementId: string,
        dateDebut: Date,
        dateFin: Date
    ): Promise<DashboardStats['depenses']> {
        // Dépenses du mois
        const depensesMois = await this.depenseRepo.find({
            where: {
                etablissementId,
                dateFacture: Between(dateDebut, dateFin),
                statut: StatutDepense.VALIDEE
            },
            relations: ['categorieDepense']
        });

        const totalMois = depensesMois.reduce((sum, d) => sum + Number(d.montantTTC), 0);
        const nombreDepensesMois = depensesMois.length;

        // Dépenses de l'année
        const debutAnnee = new Date(dateFin.getFullYear(), 0, 1);
        const depensesAnnee = await this.depenseRepo.find({
            where: {
                etablissementId,
                dateFacture: Between(debutAnnee, dateFin),
                statut: StatutDepense.VALIDEE
            }
        });

        const totalAnnee = depensesAnnee.reduce((sum, d) => sum + Number(d.montantTTC), 0);

        // Par catégorie
        const parCategorieMap = new Map<string, number>();
        for (const depense of depensesMois) {
            const cat = depense.categorieDepense?.libelle || 'Non catégorisé';
            parCategorieMap.set(cat, (parCategorieMap.get(cat) || 0) + Number(depense.montantTTC));
        }

        const parCategorie = Array.from(parCategorieMap.entries())
            .map(([categorie, montant]) => ({ categorie, montant }))
            .sort((a, b) => b.montant - a.montant);

        return {
            totalMois,
            nombreDepensesMois,
            totalAnnee,
            parCategorie
        };
    }

    /**
     * Statistiques trésorerie (simplifié)
     */
    private async getTresorerieStats(
        etablissementId: string
    ): Promise<DashboardStats['tresorerie']> {
        // TODO: Implémenter avec entités CompteCaisse et CompteBancaire
        // Pour le moment, retourne des valeurs par défaut
        return {
            soldeCaisse: 0,
            soldeBanque: 0,
            total: 0
        };
    }

    /**
     * Statistiques budget
     */
    private async getBudgetStats(
        etablissementId: string
    ): Promise<DashboardStats['budget']> {
        // TODO: Implémenter avec entités Budget et LigneBudget
        return {
            totalPrevu: 0,
            totalEngage: 0,
            totalConsomme: 0,
            tauxExecution: 0
        };
    }

    /**
     * Statistiques alertes
     */
    private async getAlertesStats(
        etablissementId: string
    ): Promise<DashboardStats['alertes']> {
        // Impayés en retard
        const now = new Date();
        const echeanciersRetard = await this.echeancierRepo.count({
            where: {
                etablissementId,
                statut: StatutPaiement.EN_ATTENTE,
                dateEcheance: Between(new Date(0), now)
            }
        });

        // Demandes en cours
        const demandesEnCours = await this.demandeDepenseRepo.count({
            where: {
                etablissementId,
                statut: StatutDemande.SOUMISE
            }
        });

        // Budget dépassé (TODO: à implémenter avec LigneBudget)
        const budgetDepasse = 0;

        return {
            impayesRetard: echeanciersRetard,
            demandesEnCours: demandesEnCours,
            budgetDepasse
        };
    }

    /**
     * Évolution des paiements (graphique)
     */
    async getEvolutionPaiements(
        etablissementId: string,
        jours: number = 30
    ): Promise<{ date: string; montant: number }[]> {
        const now = new Date();
        const dateDebut = new Date(now.getTime() - jours * 24 * 60 * 60 * 1000);

        const paiements = await this.paiementRepo.find({
            where: {
                etablissementId,
                datePaiement: Between(dateDebut, now)
            },
            order: { datePaiement: 'ASC' }
        });

        // Grouper par date
        const evolutionMap = new Map<string, number>();
        for (const paiement of paiements) {
            const dateStr = paiement.datePaiement.toISOString().split('T')[0];
            evolutionMap.set(dateStr, (evolutionMap.get(dateStr) || 0) + Number(paiement.montantTotal));
        }

        return Array.from(evolutionMap.entries())
            .map(([date, montant]) => ({ date, montant }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Top 10 élèves avec plus d'impayés
     */
    async getTopImpayes(
        etablissementId: string,
        limit: number = 10
    ): Promise<{
        eleveId: string;
        eleveNom: string;
        montantImpaye: number;
        nombreEcheancesImpayees: number;
    }[]> {
        const echeanciers = await this.echeancierRepo.find({
            where: {
                etablissementId,
                statut: StatutPaiement.EN_ATTENTE
            },
            order: { dateEcheance: 'ASC' }
        });

        // Grouper par élève
        const impayesMap = new Map<string, { 
            eleveId: string; 
            eleveNom: string; 
            montantImpaye: number;
            nombreEcheancesImpayees: number;
        }>();

        for (const ech of echeanciers) {
            const eleveId = (ech as any).eleveId || 'unknown';
            const eleveNom = `Élève ${eleveId.substring(0, 8)}`;

            if (!impayesMap.has(eleveId)) {
                impayesMap.set(eleveId, {
                    eleveId,
                    eleveNom,
                    montantImpaye: 0,
                    nombreEcheancesImpayees: 0
                });
            }

            const data = impayesMap.get(eleveId)!;
            data.montantImpaye += Number(ech.montantAttendu) - Number(ech.montantPaye);
            data.nombreEcheancesImpayees++;
        }

        return Array.from(impayesMap.values())
            .sort((a, b) => b.montantImpaye - a.montantImpaye)
            .slice(0, limit);
    }

    /**
     * Ratio revenus/dépenses
     */
    async getRatioRevenusDepenses(
        etablissementId: string,
        annee: number
    ): Promise<{
        revenus: number;
        depenses: number;
        ratio: number;
        benefice: number;
    }> {
        const dateDebut = new Date(`${annee}-01-01`);
        const dateFin = new Date(`${annee}-12-31`);

        // Revenus (paiements)
        const paiements = await this.paiementRepo.find({
            where: {
                etablissementId,
                datePaiement: Between(dateDebut, dateFin)
            }
        });

        const revenus = paiements.reduce((sum, p) => sum + Number(p.montantTotal), 0);

        // Dépenses
        const depenses = await this.depenseRepo.find({
            where: {
                etablissementId,
                dateFacture: Between(dateDebut, dateFin),
                statut: StatutDepense.VALIDEE
            }
        });

        const depensesTotal = depenses.reduce((sum, d) => sum + Number(d.montantTTC), 0);

        return {
            revenus,
            depenses: depensesTotal,
            ratio: depensesTotal > 0 ? revenus / depensesTotal : 0,
            benefice: revenus - depensesTotal
        };
    }
}

// Export singleton
export const financeDashboardService = new FinanceDashboardService();
