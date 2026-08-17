/**
 * ==========================================
 * eLISAschool - Seed : Stratégies d'expiration (migration 213)
 * ==========================================
 *
 * Seed idempotent des stratégies d'expiration d'abonnement.
 * v3.2 : une stratégie par plan (5 stratégies) pour un contrôle maximal.
 *
 *   - decouverte : 7j lecture seule → archive (gratuit = rapide)
 *   - starter    : 10j lecture seule → 10j verrouillé → archive
 *   - standard   : 15j lecture seule → 15j verrouillé → archive (défaut)
 *   - pro        : 20j lecture seule → 20j verrouillé → 15j archive
 *   - enterprise : 30j lecture seule → 30j verrouillé → 30j archive (SLA)
 *
 * Version: 3.2.0
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
        nom: 'Découverte — Dégradation accélérée (7 jours)',
        phases: [
            { nom: 'LECTURE_SEULE', jours: 7, comportement: ComportementPhase.READ_ONLY },
            { nom: 'ARCHIVE', jours: null, comportement: ComportementPhase.ARCHIVED },
        ],
        planSlug: 'decouverte',
        estDefaut: false,
    },
    {
        code: 'starter',
        nom: 'Starter — Dégradation courte (20 jours)',
        phases: [
            { nom: 'LECTURE_SEULE', jours: 10, comportement: ComportementPhase.READ_ONLY },
            { nom: 'VERROUILLE', jours: 10, comportement: ComportementPhase.LOCKED },
            { nom: 'ARCHIVE', jours: null, comportement: ComportementPhase.ARCHIVED },
        ],
        planSlug: 'starter',
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
        code: 'pro',
        nom: 'Pro — Dégradation étendue (55 jours)',
        phases: [
            { nom: 'LECTURE_SEULE', jours: 20, comportement: ComportementPhase.READ_ONLY },
            { nom: 'VERROUILLE', jours: 20, comportement: ComportementPhase.LOCKED },
            { nom: 'PRE_ARCHIVE', jours: 15, comportement: ComportementPhase.ARCHIVED },
            { nom: 'ARCHIVE', jours: null, comportement: ComportementPhase.ARCHIVED },
        ],
        planSlug: 'pro',
        estDefaut: false,
    },
    {
        code: 'enterprise',
        nom: 'Enterprise — SLA négocié (90 jours)',
        phases: [
            { nom: 'LECTURE_SEULE', jours: 30, comportement: ComportementPhase.READ_ONLY },
            { nom: 'VERROUILLE', jours: 30, comportement: ComportementPhase.LOCKED },
            { nom: 'PRE_ARCHIVE', jours: 30, comportement: ComportementPhase.ARCHIVED },
            { nom: 'ARCHIVE', jours: null, comportement: ComportementPhase.ARCHIVED },
        ],
        planSlug: 'enterprise',
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

    logger.info(`⏳ Seed stratégies expiration : ${created} créées, ${skipped} ignorées (déjà existantes)`);
    return { created, skipped };
}

export default seedStrategiesExpiration;
