/**
 * ==================================
 * eLISAschool - Service Pré-calcul Dashboard
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Cron jobs pour pré-calculer les statistiques lourdes
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { dashboardCacheService } from './dashboard-cache.service';
import { logger } from '@common/utils/logger.util';
import { Eleve } from '@modules/eleves/entities';
import { Note } from '@modules/notes/entities';
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { AffectationEleve } from '@modules/classes/entities';

export class DashboardPrecalcService {
    private eleveRepo: Repository<Eleve>;
    private affectationRepo: Repository<AffectationEleve>;
    private noteRepo: Repository<Note>;
    private utilisateurRepo: Repository<Utilisateur>;
    private etablissementRepo: Repository<Etablissement>;

    // Intervalles de cron jobs
    private cronIntervals: NodeJS.Timeout[] = [];

    constructor() {
        this.eleveRepo = AppDataSource.getRepository(Eleve);
        this.affectationRepo = AppDataSource.getRepository(AffectationEleve);
        this.noteRepo = AppDataSource.getRepository(Note);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
    }

    /**
     * Pré-calcule les statistiques pour tous les établissements
     * Exécuté toutes les 2 heures
     */
    async precalculateAllStats(): Promise<void> {
        const startTime = Date.now();
        logger.info('[DashboardPrecalc] Démarrage pré-calcul des statistiques');

        try {
            // 1. Récupérer tous les établissements actifs
            const etablissements = await this.etablissementRepo.find({
                where: { actif: true },
                select: ['id', 'nom'],
            });

            logger.info(`[DashboardPrecalc] ${etablissements.length} établissements à traiter`);

            let successCount = 0;
            let errorCount = 0;

            // 2. Pré-calculer pour chaque établissement
            for (const etablissement of etablissements) {
                try {
                    await this.precalculateEtablissementStats(etablissement.id);
                    successCount++;
                } catch (error) {
                    logger.error(`[DashboardPrecalc] Erreur pré-calcul ${etablissement.id}:`, error);
                    errorCount++;
                }
            }

            const duration = Date.now() - startTime;
            logger.info(
                `[DashboardPrecalc] Pré-calcul terminé en ${duration}ms - ` +
                `Succès: ${successCount}, Erreurs: ${errorCount}`
            );
        } catch (error) {
            logger.error('[DashboardPrecalc] Erreur majeure pré-calcul:', error);
        }
    }

    /**
     * Pré-calcule les statistiques pour un établissement spécifique
     */
    private async precalculateEtablissementStats(etablissementId: string): Promise<void> {
        const context = { etablissementId };

        // 1. Statistiques élèves
        const elevesStats = await this.calculateElevesStats(context);
        await dashboardCacheService.set(
            `precalc:eleves:${etablissementId}`,
            elevesStats,
            7200, // 2 heures
            etablissementId
        );

        // 2. Répartition par classe
        const repartitionClasse = await this.calculateRepartitionClasse(context);
        await dashboardCacheService.set(
            `precalc:repartition:${etablissementId}`,
            repartitionClasse,
            7200,
            etablissementId
        );

        // 3. Moyennes générales
        const moyennes = await this.calculateMoyennesGenerales(context);
        await dashboardCacheService.set(
            `precalc:moyennes:${etablissementId}`,
            moyennes,
            7200,
            etablissementId
        );

        // 4. Distribution des notes
        const distribution = await this.calculateDistributionNotes(context);
        await dashboardCacheService.set(
            `precalc:distribution:${etablissementId}`,
            distribution,
            7200,
            etablissementId
        );

        logger.debug(`[DashboardPrecalc] Établissement ${etablissementId} pré-calculé`);
    }

    /**
     * Calcule les statistiques élèves
     */
    private async calculateElevesStats(context: { etablissementId: string }): Promise<any> {
        const where: any = { etablissementId: context.etablissementId };

        const [total, actifs, inactifs, males, females] = await Promise.all([
            this.eleveRepo.count({ where }),
            this.eleveRepo.count({ where: { ...where, statut: 'ACTIF' } }),
            this.eleveRepo.count({ where: { ...where, statut: 'INACTIF' } }),
            this.eleveRepo.count({ where: { ...where, sexe: 'M' } }),
            this.eleveRepo.count({ where: { ...where, sexe: 'F' } }),
        ]);

        return {
            total,
            actifs,
            inactifs,
            parGenre: { masculin: males, feminin: females }
        };
    }

    /**
     * Calcule la répartition par classe
     */
    private async calculateRepartitionClasse(context: { etablissementId: string }): Promise<any> {
        const results = await this.affectationRepo
            .createQueryBuilder('ae')
            .leftJoin('ae.classe', 'c')
            .select('c.libelle', 'nom')
            .addSelect('COUNT(ae.eleveId)', 'effectif')
            .where('ae.etablissementId = :etablissementId', { etablissementId: context.etablissementId })
            .andWhere('ae.statut = :statut', { statut: 'ACTIVE' })
            .groupBy('c.libelle')
            .orderBy('effectif', 'DESC')
            .getRawMany();

        return {
            classes: results.map((r: any) => ({
                nom: r.nom || 'Sans classe',
                effectif: parseInt(r.effectif),
            }))
        };
    }

    /**
     * Calcule les moyennes générales
     */
    private async calculateMoyennesGenerales(context: { etablissementId: string }): Promise<any> {
        const notes = await this.noteRepo
            .createQueryBuilder('n')
            .leftJoin('n.periode', 'p')
            .select('p.libelle', 'periode')
            .addSelect('AVG(n.valeur / n.bareme * 20)', 'moyenne')
            .addSelect('COUNT(n.id)', 'count')
            .where('n.etablissementId = :etablissementId', { etablissementId: context.etablissementId })
            .andWhere('n.statut = :statut', { statut: 'VALIDEE' })
            .groupBy('p.libelle')
            .getRawMany();

        const evolution = notes.map((n: any) => ({
            periode: n.periode || 'Sans période',
            moyenne: Math.round(parseFloat(n.moyenne) * 100) / 100,
            nombreNotes: parseInt(n.count),
        }));

        const moyenneGenerale = evolution.length > 0
            ? Math.round((evolution.reduce((sum: number, e: any) => sum + e.moyenne, 0) / evolution.length) * 100) / 100
            : 0;

        return {
            evolution,
            moyenneGenerale,
            totalNotes: evolution.reduce((sum: number, e: any) => sum + e.nombreNotes, 0),
        };
    }

    /**
     * Calcule la distribution des notes
     */
    private async calculateDistributionNotes(context: { etablissementId: string }): Promise<any> {
        const notes = await this.noteRepo
            .createQueryBuilder('n')
            .select('n.valeur', 'valeur')
            .addSelect('n.bareme', 'bareme')
            .where('n.etablissementId = :etablissementId', { etablissementId: context.etablissementId })
            .andWhere('n.statut = :statut', { statut: 'VALIDEE' })
            .getRawMany();

        const distribution = {
            '0-5': 0,
            '5-10': 0,
            '10-15': 0,
            '15-20': 0,
        };

        for (const note of notes) {
            const noteSur20 = (parseFloat(note.valeur) / parseFloat(note.bareme)) * 20;
            if (noteSur20 < 5) distribution['0-5']++;
            else if (noteSur20 < 10) distribution['5-10']++;
            else if (noteSur20 < 15) distribution['10-15']++;
            else distribution['15-20']++;
        }

        return { distribution, total: notes.length };
    }

    /**
     * Pré-calcule les statistiques globales (tous établissements)
     * Exécuté toutes les 4 heures
     */
    async precalculateGlobalStats(): Promise<void> {
        logger.info('[DashboardPrecalc] Démarrage pré-calcul statistiques globales');

        try {
            // 1. Total utilisateurs par rôle
            const utilisateursParRole = await this.utilisateurRepo
                .createQueryBuilder('u')
                .select('u.role', 'role')
                .addSelect('COUNT(u.id)', 'count')
                .groupBy('u.role')
                .getRawMany();

            const parRole: Record<string, number> = {};
            for (const row of utilisateursParRole) {
                parRole[row.role] = parseInt(row.count);
            }

            const stats = {
                utilisateurs: {
                    total: await this.utilisateurRepo.count(),
                    actifs: await this.utilisateurRepo.count({ where: { statut: 'ACTIF' as any } }),
                    parRole,
                },
                timestamp: new Date().toISOString(),
            };

            await dashboardCacheService.set(
                'precalc:global:stats',
                stats,
                14400, // 4 heures
                'global'
            );

            logger.info('[DashboardPrecalc] Statistiques globales pré-calculées');
        } catch (error) {
            logger.error('[DashboardPrecalc] Erreur pré-calcul global:', error);
        }
    }

    /**
     * Planifie les cron jobs
     */
    startCronJobs(): void {
        // Arrêter les anciens cron jobs avant d'en créer de nouveaux
        this.stopCronJobs();

        // Pré-calcul toutes les 2 heures
        const interval2h = 2 * 60 * 60 * 1000;
        const interval1 = setInterval(() => {
            this.precalculateAllStats();
        }, interval2h);
        this.cronIntervals.push(interval1);

        // Pré-calcul global toutes les 4 heures
        const interval4h = 4 * 60 * 60 * 1000;
        const interval2 = setInterval(() => {
            this.precalculateGlobalStats();
        }, interval4h);
        this.cronIntervals.push(interval2);

        // Nettoyage cache toutes les 30 minutes
        const interval30min = 30 * 60 * 1000;
        const interval3 = setInterval(() => {
            dashboardCacheService.clean();
        }, interval30min);
        this.cronIntervals.push(interval3);

        logger.info('[DashboardPrecalc] Cron jobs activés:');
        logger.info('  - Pré-calcul établissement: toutes les 2h');
        logger.info('  - Pré-calcul global: toutes les 4h');
        logger.info('  - Nettoyage cache: toutes les 30min');
    }

    /**
     * Arrêter tous les cron jobs
     */
    stopCronJobs(): void {
        this.cronIntervals.forEach(interval => clearInterval(interval));
        this.cronIntervals = [];
        logger.info('[DashboardPrecalc] Cron jobs arrêtés');
    }

    /**
     * Force le pré-calcul immédiat
     */
    async forceRecalculate(etablissementId?: string): Promise<void> {
        if (etablissementId) {
            logger.info(`[DashboardPrecalc] Pré-calcul forcé pour ${etablissementId}`);
            await this.precalculateEtablissementStats(etablissementId);
        } else {
            logger.info('[DashboardPrecalc] Pré-calcul forcé global');
            await this.precalculateAllStats();
            await this.precalculateGlobalStats();
        }
    }
}

export const dashboardPrecalcService = new DashboardPrecalcService();
