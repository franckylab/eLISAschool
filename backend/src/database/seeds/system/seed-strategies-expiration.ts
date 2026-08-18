/**
 * ==========================================
 * eLISAschool - Seed : Stratégies d'expiration v3.4 (migration 213)
 * ==========================================
 *
 * Seed idempotent des stratégies d'expiration d'abonnement.
 * v3.4 : une stratégie par plan (3 stratégies) pour un contrôle maximal.
 *
 *   - decouverte : 10j lecture seule → 5j verrouillé → archive
 *   - standard   : 15j lecture seule → 15j verrouillé → archive (défaut)
 *   - premium    : 30j lecture seule → 30j verrouillé → 30j archive (SLA)
 *
 * Version: 3.4.0
 * Auteur: franck arlos chendjou
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { StrategieExpiration, ComportementPhase, PhaseExpiration } from '@modules/billing/entities/strategie-expiration.entity';
import { logger } from '@common/utils/logger.util';

const STRATEGIES: Array<{
    code: string;
    nom: string;
    phases: PhaseExpiration[];
    planSlug?: string;
    estDefaut: boolean;
}> = [
    {
        code: 'decouverte',
        nom: 'Découverte — Dégradation courte (15 jours)',
        phases: [
            { nom: 'LECTURE_SEULE', jours: 10, comportement: ComportementPhase.READ_ONLY },
            { nom: 'VERROUILLE', jours: 5, comportement: ComportementPhase.LOCKED },
            { nom: 'ARCHIVE', jours: null, comportement: ComportementPhase.ARCHIVED },
        ],
        planSlug: 'decouverte',
        estDefaut: false,
    },
    {
        code: 'standard',
        nom: 'Standard — Dégradation gracieuse (30 jours)',
        phases: [
            { nom: 'LECTURE_SEULE', jours: 15, comportement: ComportementPhase.READ_ONLY },
            { nom: 'VERROUILLE', jours: 15, comportement: ComportementPhase.LOCKED },
            { nom: 'ARCHIVE', jours: null, comportement: ComportementPhase.ARCHIVED },
        ],
        planSlug: 'standard',
        estDefaut: true,
    },
    {
        code: 'premium',
        nom: 'Premium — SLA étendu (90 jours)',
        phases: [
            { nom: 'LECTURE_SEULE', jours: 30, comportement: ComportementPhase.READ_ONLY },
            { nom: 'VERROUILLE', jours: 30, comportement: ComportementPhase.LOCKED },
            { nom: 'PRE_ARCHIVE', jours: 30, comportement: ComportementPhase.ARCHIVED },
            { nom: 'ARCHIVE', jours: null, comportement: ComportementPhase.ARCHIVED },
        ],
        planSlug: 'premium',
        estDefaut: false,
    },
];

/**
 * Seed idempotent des stratégies d'expiration.
 * @returns { created, skipped }
 */
export async function seedStrategiesExpiration(): Promise<{ created: number; skipped: number }> {
    const repo = AppDataSource.getRepository(StrategieExpiration);
    let created = 0;
    let skipped = 0;

    for (const strategie of STRATEGIES) {
        const existing = await repo.findOne({ where: { code: strategie.code } });
        if (existing) {
            skipped++;
            continue;
        }

        const entity = repo.create({ ...strategie, actif: true });
        await repo.save(entity);
        created++;
    }

    logger.info(`⏳ Seed stratégies expiration v3.4 : ${created} créées, ${skipped} ignorées (déjà existantes)`);
    return { created, skipped };
}

export default seedStrategiesExpiration;
