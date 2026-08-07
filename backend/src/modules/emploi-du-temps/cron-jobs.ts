/**
 * ==================================
 * eLISAschool - Cron Jobs Emploi du Temps
 * ==================================
 *
 * Q7 — Matérialisation automatique des instances HeureCours.
 * Cadence configurable par établissement (jours de semaine + heures,
 * plusieurs valeurs). Défaut : samedi 21:00 + mercredi 21:00.
 * Chaque déclenchement matérialise [lundi de la semaine courante,
 * dimanche de la semaine suivante], clampé aux bornes de l'année
 * scolaire EN_COURS, pour tous les créneaux VALIDE + genereAutomatiquement.
 */

import cron from 'node-cron';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { Etablissement } from '@modules/etablissement/entities';
import { PreferenceEmploiDuTemps, MaterialisationAutoConfig } from './entities';
import { JourSemaine } from './entities';
import { heureCoursService } from './services/heure-cours.service';

/** Horaires par défaut quand aucun config matérialisationAuto en base */
export const DEFAULT_MATERIALISATION_AUTO: MaterialisationAutoConfig = {
    actif: true,
    horaires: [
        { jour: JourSemaine.SAMEDI, heure: '21:00' },
        { jour: JourSemaine.MERCREDI, heure: '21:00' },
    ],
};

/** Garde anti re-exécution : dernière date de matérialisation par établissement */
const dernierRunParEtablissement = new Map<string, string>();

const FUSEAU_ETABLISSEMENT = 'Africa/Douala';

/** Heure/jour/date dans le fuseau de l'établissement (le serveur tourne en UTC) */
function maintenantFuseau(): { jour: string; hhmm: string; date: string } {
    const fmtJour = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU_ETABLISSEMENT, weekday: 'long' });
    const fmtHeure = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU_ETABLISSEMENT, hour: '2-digit', minute: '2-digit', hour12: false });
    const fmtDate = new Intl.DateTimeFormat('fr-CA', { timeZone: FUSEAU_ETABLISSEMENT, year: 'numeric', month: '2-digit', day: '2-digit' });
    const maintenant = new Date();
    return {
        jour: fmtJour.format(maintenant).toUpperCase(),
        hhmm: fmtHeure.format(maintenant),
        date: fmtDate.format(maintenant),
    };
}

/**
 * Matérialise les instances HeureCours d'un établissement si un horaire
 * configuré correspond au jour/heure courant et n'a pas déjà tourné aujourd'hui.
 */
export async function materialiserSiNecessaire(etablissementId: string): Promise<void> {
    const preferenceRepo = AppDataSource.getRepository(PreferenceEmploiDuTemps);

    let preferences = await preferenceRepo.findOne({ where: { etablissementId } });
    if (!preferences) {
        preferences = preferenceRepo.create({ etablissementId });
        await preferenceRepo.save(preferences);
    }

    const config: MaterialisationAutoConfig = preferences.materialisationAuto ?? DEFAULT_MATERIALISATION_AUTO;
    if (!config.actif || !config.horaires?.length) return;

    const { jour, hhmm, date } = maintenantFuseau();
    if (dernierRunParEtablissement.get(etablissementId) === date) return;

    const declenche = config.horaires.some(h => h.jour === jour && h.heure === hhmm);
    if (!declenche) return;

    dernierRunParEtablissement.set(etablissementId, date);

    const resultat = await heureCoursService.materialiserSemainesCourantes({ etablissementId });
    logger.info(`[CRON EDT] Matérialisation auto ${etablissementId}: ${resultat.created} instance(s) créée(s), ${resultat.skipped} ignorée(s)`);
}

export function initEmploiDuTempsCronJobs(): void {
    // Vérification chaque minute : la config horaire détermine le déclenchement.
    cron.schedule('* * * * *', async () => {
        try {
            const etablissementRepo = AppDataSource.getRepository(Etablissement);
            const etablissements = await etablissementRepo.find({ select: ['id'] });

            for (const etab of etablissements) {
                try {
                    await materialiserSiNecessaire(etab.id);
                } catch (error) {
                    logger.error(`[CRON EDT] Erreur matérialisation ${etab.id}:`, error);
                }
            }
        } catch (error) {
            logger.error('[CRON EDT] Erreur boucle matérialisation:', error);
        }
    }, {
        timezone: FUSEAU_ETABLISSEMENT,
    });

    logger.info('[CRON EDT] Tâche de matérialisation automatique planifiée (configurable par établissement).');
}
