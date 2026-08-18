/**
 * ==========================================
 * eLISAschool - Seed Promotions v5.0
 * ==========================================
 *
 * Peuple la table `promotions` avec des exemples couvrant toutes les fonctionnalités v5 :
 * 
 * 15 promotions :
 *   - VOL-500  : -10% permanent PLAN si ≥500 élèves
 *   - VOL-1000 : -20% permanent PLAN si ≥1000 élèves
 *   - FID-12M  : -5% permanent après 12 mois d'ancienneté
 *   - FID-24M  : -10% permanent après 24 mois d'ancienneté
 *   - PROMO-RENTREE-2026 : -20% PLAN 1ʳᵉ facture, code RENTREE2026
 *   - PROMO-LANCEMENT-V4 : -15% PLAN 3 cycles, code LANCEMENT
 *   - PROMO-BF-2026      : -25% PLAN 1ʳᵉ facture, code BF2026
 *   - PACK-FIDELITE : -10% PACKS après 6 mois d'ancienneté
 *   - MOD-DECOUVERTE : -15% MODULES 1ʳᵉ facture, code DECOUVERTE
 *   - GRAT-TRANSPORT-3M : module transport gratuit 3 mois, code GRATTRANSPORT
 *   - PROMO-BUNDLE-2026 : -20% PACKS si ≥3 packs, code BUNDLE2026
 *   - QUOTA-SMS-5000 : paliers dégressifs SMS (v5 QUOTA)
 *   - AUTO-NOUVEAU : -10% automatique nouveau client (v5 auto-promo)
 *   - AUTO-UPGRADE : -15% automatique upgrade plan (v5 auto-promo)
 *   - PROMO-PROGRAMMEE : -30% PLAN programmée 01/01/2027 (v5 programmation)
 *
 * Idempotent : upsert par code unique.
 *
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 */

import { AppDataSource } from '../../data-source';
import {
    Promotion,
    TypePromotion,
    ScopePromotion,
    DureeApplicationPromotion,
    TypeAutoPromotion,
    type ConditionsPromotion,
} from '@modules/billing/entities/promotion.entity';
import { logger } from '@common/utils/logger.util';

// =============================================
// DONNÉES SEED
// =============================================

interface PromotionSeed {
    code: string;
    nom: string;
    typePromotion: TypePromotion;
    scope: ScopePromotion;
    valeur: number;
    dureeApplication: DureeApplicationPromotion;
    cumulable: boolean;
    priorite: number;
    codeCoupon?: string;
    maxUtilisations?: number;
    conditions?: ConditionsPromotion;
    dateDebut?: Date;
    dateFin?: Date;
    actif: boolean;
    config?: {
        paliersVolume?: Array<{ min: number; max: number | null; valeur: number }>;
        quotaRessource?: string;
        typeAutomatique?: TypeAutoPromotion;
        declencheur?: Record<string, unknown>;
        noteInterne?: string;
    };
    estProgrammee?: boolean;
    dateProgrammation?: Date;
}

const PROMOTIONS: PromotionSeed[] = [
    // ─── Règles de volume (automatiques, cumulables, scope PLAN) ───
    {
        code: 'VOL-500',
        nom: 'Remise volume >500 élèves',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 10,
        dureeApplication: DureeApplicationPromotion.PERMANENTE,
        cumulable: true,
        priorite: 10,
        conditions: { nombreElevesMin: 500 },
        actif: true,
    },
    {
        code: 'VOL-1000',
        nom: 'Remise volume >1000 élèves',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 20,
        dureeApplication: DureeApplicationPromotion.PERMANENTE,
        cumulable: true,
        priorite: 20,
        conditions: { nombreElevesMin: 1000 },
        actif: true,
    },

    // ─── Règles de fidélité (automatiques, cumulables, scope PLAN) ───
    {
        code: 'FID-12M',
        nom: 'Fidélité 12 mois',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 5,
        dureeApplication: DureeApplicationPromotion.PERMANENTE,
        cumulable: true,
        priorite: 30,
        conditions: { ancienneteMois: 12 },
        actif: true,
    },
    {
        code: 'FID-24M',
        nom: 'Fidélité 24 mois',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 10,
        dureeApplication: DureeApplicationPromotion.PERMANENTE,
        cumulable: true,
        priorite: 40,
        conditions: { ancienneteMois: 24 },
        actif: true,
    },

    // ─── Promotions code coupon (non cumulables, avec dateFin) ───
    {
        code: 'PROMO-RENTREE-2026',
        nom: 'Promotion rentrée scolaire 2026',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 20,
        dureeApplication: DureeApplicationPromotion.PREMIERE_FACTURE,
        cumulable: false,
        priorite: 100,
        codeCoupon: 'RENTREE2026',
        maxUtilisations: 50,
        dateDebut: new Date('2026-09-01'),
        dateFin: new Date('2026-11-30'),
        actif: true,
    },
    {
        code: 'PROMO-LANCEMENT-V4',
        nom: 'Promotion lancement v4.0',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 15,
        dureeApplication: DureeApplicationPromotion.N_CYCLES,
        cumulable: false,
        priorite: 90,
        codeCoupon: 'LANCEMENT',
        conditions: { nbCycles: 3 },
        dateDebut: new Date('2026-08-01'),
        dateFin: new Date('2027-02-28'),
        actif: true,
    },
    {
        code: 'PROMO-BF-2026',
        nom: 'Black Friday 2026',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 25,
        dureeApplication: DureeApplicationPromotion.PREMIERE_FACTURE,
        cumulable: false,
        priorite: 110,
        codeCoupon: 'BF2026',
        maxUtilisations: 30,
        dateDebut: new Date('2026-11-20'),
        dateFin: new Date('2026-12-05'),
        actif: true,
    },

    // ─── Scope PACK : remise sur packs quota ───
    {
        code: 'PACK-FIDELITE',
        nom: 'Fidélité packs quota (6 mois)',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PACK,
        valeur: 10,
        dureeApplication: DureeApplicationPromotion.PERMANENTE,
        cumulable: true,
        priorite: 50,
        conditions: { ancienneteMois: 6 },
        actif: true,
    },

    // ─── Scope MODULE : remise sur modules supplémentaires ───
    {
        code: 'MOD-DECOUVERTE',
        nom: 'Découverte modules supplémentaires',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.MODULE,
        valeur: 15,
        dureeApplication: DureeApplicationPromotion.PREMIERE_FACTURE,
        cumulable: false,
        priorite: 80,
        codeCoupon: 'DECOUVERTE',
        maxUtilisations: 100,
        dateDebut: new Date('2026-08-01'),
        dateFin: new Date('2027-06-30'),
        actif: true,
    },

    // ─── Scope MODULE + type GRATUITE : module offert N mois ───
    {
        code: 'GRAT-TRANSPORT-3M',
        nom: 'Module transport gratuit 3 mois',
        typePromotion: TypePromotion.GRATUITE,
        scope: ScopePromotion.MODULE,
        valeur: 100,
        dureeApplication: DureeApplicationPromotion.N_MOIS_GRATUIT,
        cumulable: false,
        priorite: 120,
        codeCoupon: 'GRATTRANSPORT',
        maxUtilisations: 50,
        conditions: { dureeGratuiteMois: 3, modulesRequis: ['transport'] },
        dateDebut: new Date('2026-09-01'),
        dateFin: new Date('2027-08-31'),
        actif: true,
    },

    // ─── Scope PACK + coupon bundle : remise si ≥3 packs ───
    {
        code: 'PROMO-BUNDLE-2026',
        nom: 'Super bundle packs 2026',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PACK,
        valeur: 20,
        dureeApplication: DureeApplicationPromotion.N_CYCLES,
        cumulable: false,
        priorite: 95,
        codeCoupon: 'BUNDLE2026',
        conditions: { nbCycles: 6, packsRequis: ['pack-1', 'pack-2', 'pack-3'] },
        maxUtilisations: 25,
        dateDebut: new Date('2026-08-01'),
        dateFin: new Date('2027-02-28'),
        actif: true,
    },

    // ─── v5 — Scope QUOTA : paliers dégressifs SMS ───
    {
        code: 'QUOTA-SMS-5000',
        nom: 'Paliers dégressifs SMS (5000+)',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.QUOTA,
        valeur: 10,
        dureeApplication: DureeApplicationPromotion.PERMANENTE,
        cumulable: true,
        priorite: 60,
        config: {
            quotaRessource: 'sms',
            paliersVolume: [
                { min: 1000, max: 4999, valeur: 5 },
                { min: 5000, max: 9999, valeur: 10 },
                { min: 10000, max: null, valeur: 15 },
            ],
        },
        actif: true,
    },

    // ─── v5 — Auto-promotion NOUVEAU_CLIENT ───
    {
        code: 'AUTO-NOUVEAU',
        nom: 'Bienvenue nouveau client -10%',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 10,
        dureeApplication: DureeApplicationPromotion.PREMIERE_FACTURE,
        cumulable: false,
        priorite: 150,
        config: {
            typeAutomatique: TypeAutoPromotion.NOUVEAU_CLIENT,
            noteInterne: 'Appliquée automatiquement lors de la première facture pour les nouveaux clients',
        },
        dateDebut: new Date('2026-01-01'),
        actif: true,
    },

    // ─── v5 — Auto-promotion UPGRADE ───
    {
        code: 'AUTO-UPGRADE',
        nom: 'Upgrade plan -15%',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 15,
        dureeApplication: DureeApplicationPromotion.N_CYCLES,
        cumulable: false,
        priorite: 140,
        conditions: { nbCycles: 3 },
        config: {
            typeAutomatique: TypeAutoPromotion.UPGRADE,
            noteInterne: 'Appliquée automatiquement lors d\'un upgrade de plan',
        },
        dateDebut: new Date('2026-01-01'),
        actif: true,
    },

    // ─── v5 — Promotion programmée ───
    {
        code: 'PROMO-PROGRAMMEE',
        nom: 'Promotion Nouvel An 2027',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 30,
        dureeApplication: DureeApplicationPromotion.PREMIERE_FACTURE,
        cumulable: false,
        priorite: 200,
        codeCoupon: 'NOUVELAN2027',
        maxUtilisations: 100,
        dateDebut: new Date('2027-01-01'),
        dateFin: new Date('2027-01-31'),
        estProgrammee: true,
        dateProgrammation: new Date('2027-01-01T00:00:00'),
        actif: false, // Sera activée automatiquement par le cron job
    },
];

// =============================================
// SEED FUNCTION
// =============================================

export async function seedPromotions(): Promise<{ created: number; updated: number }> {
    const promoRepo = AppDataSource.getRepository(Promotion);

    logger.info('[Seed v5] Insertion des promotions commerciales (v4 + v5)...');

    let created = 0;
    let updated = 0;

    for (const promo of PROMOTIONS) {
        const existing = await promoRepo.findOne({ where: { code: promo.code } });

        if (existing) {
            await promoRepo.update(existing.id, {
                nom: promo.nom,
                typePromotion: promo.typePromotion,
                scope: promo.scope,
                valeur: promo.valeur,
                dureeApplication: promo.dureeApplication,
                cumulable: promo.cumulable,
                priorite: promo.priorite,
                codeCoupon: promo.codeCoupon,
                maxUtilisations: promo.maxUtilisations,
                conditions: promo.conditions,
                config: promo.config as any,
                dateDebut: promo.dateDebut ?? existing.dateDebut,
                dateFin: promo.dateFin ?? existing.dateFin,
                actif: promo.actif,
                estProgrammee: promo.estProgrammee ?? existing.estProgrammee,
                dateProgrammation: promo.dateProgrammation ?? existing.dateProgrammation,
            });
            updated++;
        } else {
            const entity = promoRepo.create({
                code: promo.code,
                nom: promo.nom,
                typePromotion: promo.typePromotion,
                scope: promo.scope,
                valeur: promo.valeur,
                dureeApplication: promo.dureeApplication,
                cumulable: promo.cumulable,
                priorite: promo.priorite,
                codeCoupon: promo.codeCoupon,
                maxUtilisations: promo.maxUtilisations,
                conditions: promo.conditions,
                config: promo.config,
                dateDebut: promo.dateDebut ?? new Date(),
                dateFin: promo.dateFin,
                utilisations: 0,
                actif: promo.actif,
                estProgrammee: promo.estProgrammee ?? false,
                dateProgrammation: promo.dateProgrammation,
            });
            await promoRepo.save(entity);
            created++;
        }
    }

    logger.info(`[Seed v5] ✅ Promotions: ${created} créées, ${updated} mises à jour (${PROMOTIONS.length} total)`);
    return { created, updated };
}
