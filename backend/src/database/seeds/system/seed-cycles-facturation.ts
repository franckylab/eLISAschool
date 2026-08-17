/**
 * ==========================================
 * eLISAschool - Seed : Cycles de facturation (migration 213)
 * ==========================================
 *
 * Seed idempotent des cycles de facturation configurables.
 * Valeurs identiques à celles posées par la migration 213 en SQL —
 * ce seed garantit leur présence même si la migration a été jouée
 * avant l'introduction des INSERT.
 *
 *   - MENSUEL    :  1 mois, remise  0 %
 *   - TRIMESTRIEL:  3 mois, remise  5 %
 *   - SEMESTRIEL :  6 mois, remise  7.5 %
 *   - ANNUEL     : 12 mois, remise 10 %
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { CycleFacturationConfig } from '@modules/billing/entities/cycle-facturation-config.entity';
import { logger } from '@common/utils/logger.util';

const CYCLES = [
    { code: 'MENSUEL', nom: 'Mensuel', nomEn: 'Monthly', dureeMois: 1, remisePourcent: 0, ordre: 1 },
    { code: 'TRIMESTRIEL', nom: 'Trimestriel', nomEn: 'Quarterly', dureeMois: 3, remisePourcent: 5, ordre: 2 },
    { code: 'SEMESTRIEL', nom: 'Semestriel', nomEn: 'Semi-annual', dureeMois: 6, remisePourcent: 7.5, ordre: 3 },
    { code: 'ANNUEL', nom: 'Annuel', nomEn: 'Yearly', dureeMois: 12, remisePourcent: 10, ordre: 4 },
];

/**
 * Seed idempotent des cycles de facturation.
 * @returns { created, skipped }
 */
export async function seedCyclesFacturation(): Promise<{ created: number; skipped: number }> {
    const repo = AppDataSource.getRepository(CycleFacturationConfig);
    let created = 0;
    let skipped = 0;

    for (const cycle of CYCLES) {
        const existing = await repo.findOne({ where: { code: cycle.code } });
        if (existing) {
            skipped++;
            continue;
        }

        const entity = repo.create({ ...cycle, actif: true });
        await repo.save(entity);
        created++;
    }

    logger.info(`🔄 Seed cycles facturation : ${created} créés, ${skipped} ignorés (déjà existants)`);
    return { created, skipped };
}

export default seedCyclesFacturation;
