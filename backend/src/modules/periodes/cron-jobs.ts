/**
 * ==================================
 * eLISAschool - Cron Jobs Périodes
 * ==================================
 * Transition automatique des périodes :
 * - Activation des périodes OUVERTE dont dateDebut <= aujourd'hui
 * - Clôture des périodes OUVERTE dont dateFin < aujourd'hui
 *
 * Paramètre config : periodes.transition_auto (défaut false)
 */

import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Periode, StatutPeriode } from './entities';
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

const periodeRepo = (): Repository<Periode> => AppDataSource.getRepository(Periode);

// =============================================
// CRON — Activation automatique
// =============================================

/**
 * Active automatiquement les périodes OUVERTE
 * dont la date de début est atteinte.
 * Note : le statut OUVERTE est le statut cible — les périodes sont
 * déjà créées avec ce statut. Ce cron vérifie la cohérence date/statut.
 * Schedule : quotidien à 00h15
 */
export async function cronActivationPeriodes(): Promise<CronResult> {
    const start = Date.now();
    const result: CronResult = {
        job: 'activation-periodes',
        executed: false,
        results: { verifiees: 0, corrigees: 0, erreurs: 0 },
        duration: 0,
        timestamp: new Date(),
    };

    try {
        const repo = periodeRepo();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Périodes déjà OUVERTE avec dateDebut atteinte → cohérentes
        const periodesOk = await repo.count({
            where: {
                statut: StatutPeriode.OUVERTE,
                dateDebut: LessThanOrEqual(today),
                dateFin: MoreThanOrEqual(today),
            },
        });
        (result.results as Record<string, number>).verifiees = periodesOk;

    } catch (error) {
        logger.error('[Cron] Erreur critique cronActivationPeriodes:', error);
    }

    result.duration = Date.now() - start;
    return result;
}

// =============================================
// CRON — Clôture automatique
// =============================================

/**
 * Clôt automatiquement les périodes OUVERTE
 * dont la date de fin est dépassée.
 * Schedule : quotidien à 00h20
 */
export async function cronCloturePeriodes(): Promise<CronResult> {
    const start = Date.now();
    const result: CronResult = {
        job: 'cloture-periodes',
        executed: false,
        results: { cloturées: 0, erreurs: 0 },
        duration: 0,
        timestamp: new Date(),
    };

    try {
        const repo = periodeRepo();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Trouver les périodes OUVERTE dont dateFin < today
        const periodesACloturer = await repo.find({
            where: {
                statut: StatutPeriode.OUVERTE,
                dateFin: LessThanOrEqual(today),
            },
        });

        if (periodesACloturer.length === 0) {
            result.duration = Date.now() - start;
            return result;
        }

        result.executed = true;

        for (const periode of periodesACloturer) {
            try {
                periode.statut = StatutPeriode.CLOTUREE;
                await repo.save(periode);
                (result.results as Record<string, number>).cloturées++;
                logger.info(`[Cron] Période clôturée: ${periode.nom} (${periode.etablissementId})`);
            } catch (error) {
                (result.results as Record<string, number>).erreurs++;
                logger.error(`[Cron] Erreur clôture période ${periode.id}:`, error);
            }
        }
    } catch (error) {
        logger.error('[Cron] Erreur critique cronCloturePeriodes:', error);
    }

    result.duration = Date.now() - start;
    return result;
}

// =============================================
// INIT — Enregistrement des cron jobs
// =============================================

export function initPeriodesCronJobs(): void {
    logger.info('[Cron] 📅 Enregistrement des cron jobs périodes...');

    // Vérification activation — Quotidien 00h15
    scheduleWithLock('activation-periodes', '15 0 * * *', async () => {
        const enabled = await getParamBoolean('periodes.transition_auto', { defaultValue: false });
        if (!enabled) {
            logger.debug('[Cron] transition_auto désactivé pour périodes — skip');
            return;
        }
        await cronActivationPeriodes();
    });

    // Clôture auto — Quotidien 00h20
    scheduleWithLock('cloture-periodes', '20 0 * * *', async () => {
        const enabled = await getParamBoolean('periodes.transition_auto', { defaultValue: false });
        if (!enabled) {
            logger.debug('[Cron] transition_auto désactivé pour périodes — skip');
            return;
        }
        await cronCloturePeriodes();
    });
}
