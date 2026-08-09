/**
 * ==================================
 * eLISAschool - Platform Stats Service
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Service d'agrégation des statistiques plateforme (Control Plane).
 * Cache in-memory TTL 60s pour éviter les requêtes DB répétées.
 *
 * Plan v7.1 — Panel Admin Enterprise
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { StatutAbonnement } from '@modules/billing/entities/abonnement-client.entity';
import { StatutFacture } from '@modules/billing/entities/facture.entity';

// =============================================
// Types
// =============================================

export interface PlatformStats {
    totalEtablissements: number;
    etablissementsActifs: number;
    totalUtilisateurs: number;
    utilisateursActifs: number;
    timestamp: number;
}

export interface RevenueStats {
    mrr: number;
    arr: number;
    totalFacture: number;
    totalPaye: number;
    totalImpaye: number;
    nombreFactures: number;
    facturesEnRetard: number;
    tauxRecouvrement: number;
    timestamp: number;
}

export interface SanteStats {
    etablissementsSains: number;
    etablissementsAttention: number;
    etablissementsCritiques: number;
    dunning: {
        relancesEnvoyees: number;
        suspendus: number;
        montantRelance: number;
    };
    timestamp: number;
}

export interface StatsComplet {
    platform: PlatformStats;
    revenues: RevenueStats;
    sante: SanteStats;
}

// =============================================
// Service
// =============================================

export class PlatformStatsService {
    private etablissementRepo: Repository<any>;
    private utilisateurRepo: Repository<any>;
    private abonnementRepo: Repository<any>;
    private factureRepo: Repository<any>;

    // Cache in-memory — TTL 60 secondes
    private cache: { value: PlatformStats; timestamp: number } | null = null;
    private revenueCache: { value: RevenueStats; timestamp: number } | null = null;
    private santeCache: { value: SanteStats; timestamp: number } | null = null;
    private readonly CACHE_TTL = 60 * 1000; // 60 secondes

    constructor() {
        this.etablissementRepo = AppDataSource.getRepository('Etablissement');
        this.utilisateurRepo = AppDataSource.getRepository('Utilisateur');
        this.abonnementRepo = AppDataSource.getRepository('AbonnementClient');
        this.factureRepo = AppDataSource.getRepository('Facture');
    }

    /**
     * Récupère les statistiques plateforme avec cache TTL 60s.
     * Les 4 comptages sont exécutés en parallèle (Promise.all).
     */
    async getStats(): Promise<PlatformStats> {
        // 1. Vérifier le cache
        if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
            return this.cache.value;
        }

        // 2. Cache miss → requêtes DB parallèles
        const [
            totalEtablissements,
            etablissementsActifs,
            totalUtilisateurs,
            utilisateursActifs,
        ] = await Promise.all([
            this.etablissementRepo.count(),
            this.etablissementRepo.count({ where: { actif: true } }),
            this.utilisateurRepo.count(),
            this.utilisateurRepo.count({ where: { actif: true } }),
        ]);

        const stats: PlatformStats = {
            totalEtablissements,
            etablissementsActifs,
            totalUtilisateurs,
            utilisateursActifs,
            timestamp: Date.now(),
        };

        // 3. Mettre en cache
        this.cache = { value: stats, timestamp: Date.now() };
        logger.info('[PlatformStats] Statistiques rafraîchies', {
            totalEtablissements,
            totalUtilisateurs,
        });

        return stats;
    }

    /**
     * Statistiques revenus — MRR, ARR, facturation, recouvrement.
     * Cache TTL 60s séparé.
     */
    async getRevenueStats(): Promise<RevenueStats> {
        if (this.revenueCache && Date.now() - this.revenueCache.timestamp < this.CACHE_TTL) {
            return this.revenueCache.value;
        }

        // Abonnements actifs → MRR
        const abonnementsActifs = await this.abonnementRepo.find({
            where: { statut: StatutAbonnement.ACTIF },
            select: ['montantMensuel'],
        });
        const mrr = abonnementsActifs.reduce((sum: number, a: any) => sum + Number(a.montantMensuel || 0), 0);
        const arr = mrr * 12;

        // Factures — agrégats
        const [totalFactureResult, totalPayeResult, facturesEnRetardCount, nombreFacturesResult] = await Promise.all([
            this.factureRepo
                .createQueryBuilder('f')
                .select('COALESCE(SUM(f.montantTotal), 0)', 'total')
                .where('f.statut != :annulee', { annulee: StatutFacture.ANNULEE })
                .getRawOne(),
            this.factureRepo
                .createQueryBuilder('f')
                .select('COALESCE(SUM(f.montantPaye), 0)', 'total')
                .where('f.statut != :annulee', { annulee: StatutFacture.ANNULEE })
                .getRawOne(),
            this.factureRepo.count({
                where: [
                    { statut: StatutFacture.EN_RETARD },
                    { statut: StatutFacture.EMISE },
                ],
            }),
            this.factureRepo.count({
                where: { statut: StatutFacture.PAYEE },
            }),
        ]);

        const totalFacture = Number(totalFactureResult?.total || 0);
        const totalPaye = Number(totalPayeResult?.total || 0);
        const totalImpaye = totalFacture - totalPaye;
        const nombreFactures = nombreFacturesResult;
        const tauxRecouvrement = totalFacture > 0
            ? Math.round((totalPaye / totalFacture) * 10000) / 100
            : 0;

        const stats: RevenueStats = {
            mrr, arr, totalFacture, totalPaye, totalImpaye,
            nombreFactures, facturesEnRetard: facturesEnRetardCount,
            tauxRecouvrement, timestamp: Date.now(),
        };

        this.revenueCache = { value: stats, timestamp: Date.now() };
        logger.info('[PlatformStats] Revenus rafraîchis', { mrr, totalFacture });
        return stats;
    }

    /**
     * Santé des établissements — répartition par état + dunning.
     * Critères : sain (abonnement actif, pas de retard), attention (retard < 15j),
     * critique (retard >= 15j ou suspendu).
     */
    async getSanteStats(): Promise<SanteStats> {
        if (this.santeCache && Date.now() - this.santeCache.timestamp < this.CACHE_TTL) {
            return this.santeCache.value;
        }

        // Compter par statut d'abonnement
        const [actifs, suspendus, expires, annules] = await Promise.all([
            this.abonnementRepo.count({ where: { statut: StatutAbonnement.ACTIF } }),
            this.abonnementRepo.count({ where: { statut: StatutAbonnement.SUSPENDU } }),
            this.abonnementRepo.count({ where: { statut: StatutAbonnement.EXPIRE } }),
            this.abonnementRepo.count({ where: { statut: StatutAbonnement.ANNULE } }),
        ]);

        // Factures en retard — agrégats dunning
        const [facturesRetard, relancesTotal, montantRelanceResult] = await Promise.all([
            this.factureRepo.count({ where: { statut: StatutFacture.EN_RETARD } }),
            this.factureRepo
                .createQueryBuilder('f')
                .select('COALESCE(SUM(f.nombreRelances), 0)', 'total')
                .where('f.nombreRelances > 0')
                .getRawOne(),
            this.factureRepo
                .createQueryBuilder('f')
                .select('COALESCE(SUM(f.montantTotal - f.montantPaye), 0)', 'total')
                .where('f.statut IN (:...statuts)', {
                    statuts: [StatutFacture.EN_RETARD, StatutFacture.EMISE],
                })
                .andWhere('f.dateEcheance < :now', { now: new Date().toISOString().split('T')[0] })
                .getRawOne(),
        ]);

        // Répartition santé : sains = actifs sans retard, attention = actifs avec retard léger, critiques = suspendus + expirés
        const etablissementsCritiques = suspendus + expires;
        const etablissementsAttention = facturesRetard; // établissements avec au moins une facture en retard
        const etablissementsSains = Math.max(actifs - facturesRetard, 0);

        const stats: SanteStats = {
            etablissementsSains,
            etablissementsAttention,
            etablissementsCritiques,
            dunning: {
                relancesEnvoyees: Number(relancesTotal?.total || 0),
                suspendus,
                montantRelance: Number(montantRelanceResult?.total || 0),
            },
            timestamp: Date.now(),
        };

        this.santeCache = { value: stats, timestamp: Date.now() };
        logger.info('[PlatformStats] Santé rafraîchie', { etablissementsSains, etablissementsCritiques });
        return stats;
    }

    /**
     * Stats complètes combinées — 1 seul appel HTTP au lieu de 3.
     * Exécute les 3 agrégats en parallèle.
     */
    async getStatsComplet(): Promise<StatsComplet> {
        const [platform, revenues, sante] = await Promise.all([
            this.getStats(),
            this.getRevenueStats(),
            this.getSanteStats(),
        ]);
        return { platform, revenues, sante };
    }

    /**
     * Invalide tous les caches — appelé après modification billing/abonnements.
     */
    invalidateCache(): void {
        this.cache = null;
        this.revenueCache = null;
        this.santeCache = null;
    }
}

// Singleton
export const platformStatsService = new PlatformStatsService();
