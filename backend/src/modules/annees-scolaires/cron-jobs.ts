/**
 * ==================================
 * eLISAschool - Cron Jobs Années Scolaires
 * ==================================
 * Transition automatique des années scolaires :
 * - Activation des années OUVERTE dont dateDebut <= aujourd'hui
 * - Clôture des années EN_COURS dont dateFin < aujourd'hui
 *
 * Paramètre config : annees_scolaires.transition_auto (défaut false)
 */

import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AnneeScolaire, StatutAnneeScolaire } from './entities';
import { scheduleWithLock } from '@common/services/cron-lock.service';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { logger } from '@common/utils/logger.util';

export interface CronResult {
    job: string;
    executed: boolean;
    results: Record<string, unknown>;
    duration: number;
    timestamp: Date;
}

const anneeRepo = (): Repository<AnneeScolaire> => AppDataSource.getRepository(AnneeScolaire);

// =============================================
// CRON — Activation automatique
// =============================================

/**
 * Active automatiquement les années scolaires OUVERTE
 * dont la date de début est atteinte.
 * Schedule : quotidien à 00h05
 */
export async function cronActivationAnneesScolaires(): Promise<CronResult> {
    const start = Date.now();
    const result: CronResult = {
        job: 'activation-annees-scolaires',
        executed: false,
        results: { activees: 0, erreurs: 0 },
        duration: 0,
        timestamp: new Date(),
    };

    try {
        const repo = anneeRepo();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Trouver les années OUVERTE dont dateDebut <= today
        const anneesAActiver = await repo.find({
            where: {
                statut: StatutAnneeScolaire.OUVERTE,
                dateDebut: LessThanOrEqual(today),
            },
        });

        if (anneesAActiver.length === 0) {
            result.duration = Date.now() - start;
            return result;
        }

        result.executed = true;

        for (const annee of anneesAActiver) {
            try {
                // Désactiver les autres années EN_COURS du même établissement
                await repo.update(
                    { statut: StatutAnneeScolaire.EN_COURS, etablissementId: annee.etablissementId },
                    { statut: StatutAnneeScolaire.OUVERTE },
                );
                // Activer celle-ci
                annee.statut = StatutAnneeScolaire.EN_COURS;
                await repo.save(annee);
                (result.results as Record<string, number>).activees++;
                logger.info(`[Cron] Année scolaire activée: ${annee.libelle} (${annee.etablissementId})`);
            } catch (error) {
                (result.results as Record<string, number>).erreurs++;
                logger.error(`[Cron] Erreur activation année ${annee.id}:`, error);
            }
        }
    } catch (error) {
        logger.error('[Cron] Erreur critique cronActivationAnneesScolaires:', error);
    }

    result.duration = Date.now() - start;
    return result;
}

// =============================================
// CRON — Clôture automatique
// =============================================

/**
 * Clôt automatiquement les années scolaires EN_COURS
 * dont la date de fin est dépassée.
 * Schedule : quotidien à 00h10
 */
export async function cronClotureAnneesScolaires(): Promise<CronResult> {
    const start = Date.now();
    const result: CronResult = {
        job: 'cloture-annees-scolaires',
        executed: false,
        results: { cloturées: 0, erreurs: 0 },
        duration: 0,
        timestamp: new Date(),
    };

    try {
        const repo = anneeRepo();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Trouver les années EN_COURS dont dateFin < today
        const anneesACloturer = await repo.find({
            where: {
                statut: StatutAnneeScolaire.EN_COURS,
                dateFin: LessThanOrEqual(today),
            },
        });

        if (anneesACloturer.length === 0) {
            result.duration = Date.now() - start;
            return result;
        }

        result.executed = true;

        for (const annee of anneesACloturer) {
            try {
                annee.statut = StatutAnneeScolaire.CLOTUREE;
                await repo.save(annee);
                (result.results as Record<string, number>).cloturées++;
                logger.info(`[Cron] Année scolaire clôturée: ${annee.libelle} (${annee.etablissementId})`);
            } catch (error) {
                (result.results as Record<string, number>).erreurs++;
                logger.error(`[Cron] Erreur clôture année ${annee.id}:`, error);
            }
        }
    } catch (error) {
        logger.error('[Cron] Erreur critique cronClotureAnneesScolaires:', error);
    }

    result.duration = Date.now() - start;
    return result;
}

// =============================================
// INIT — Enregistrement des cron jobs
// =============================================

export function initAnneesScolairesCronJobs(): void {
    logger.info('[Cron] 📅 Enregistrement des cron jobs années scolaires...');

    // Activation auto — Quotidien 00h05
    scheduleWithLock('activation-annees-scolaires', '5 0 * * *', async () => {
        const enabled = await getParamBoolean('annees_scolaires.transition_auto', { defaultValue: false });
        if (!enabled) {
            logger.debug('[Cron] transition_auto désactivé pour années scolaires — skip');
            return;
        }
        await cronActivationAnneesScolaires();
    });

    // Clôture auto — Quotidien 00h10
    scheduleWithLock('cloture-annees-scolaires', '10 0 * * *', async () => {
        const enabled = await getParamBoolean('annees_scolaires.transition_auto', { defaultValue: false });
        if (!enabled) {
            logger.debug('[Cron] transition_auto désactivé pour années scolaires — skip');
            return;
        }
        await cronClotureAnneesScolaires();
    });
}
