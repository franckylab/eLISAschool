/**
 * ==================================
 * eLISAschool - Seed Remises Abonnement
 * ==================================
 * Version: 3.1.0
 *
 * Crée les règles de remise commerciale v3.1 (migration 213 + 214).
 * Idempotent : upsert par code unique.
 *
 * 5 règles automatiques + 3 promotions (code coupon)
 * v3.1 : conditions d'éligibilité (conditionElevesMin, conditionAncienneteMois)
 * v3.2 : suppression remises CYCLE (doublon avec CycleFacturationConfig.remisePourcent)
 *        + dateDebut/dateFin sur les promotions
 *        + GRP-3ETAB désactivé (condition groupe non implémentée)
 */

import { AppDataSource } from '../../data-source';
import {
    RemiseAbonnement,
    TypeRemise,
    DureeApplicationRemise,
    CibleRemise,
} from '@modules/billing/entities/remise-abonnement.entity';
import { logger } from '@common/utils/logger.util';

interface RemiseSeed {
    code: string;
    nom: string;
    typeRemise: TypeRemise;
    valeur: number;
    dureeApplication: DureeApplicationRemise;
    nbCycles?: number;
    cible: CibleRemise;
    cibleCycle?: string;
    cumulable: boolean;
    priorite: number;
    codeCoupon?: string;
    maxUtilisations?: number;
    conditionElevesMin?: number;
    conditionAncienneteMois?: number;
    dateDebut?: Date;
    dateFin?: Date;
    actif: boolean;
}

const REMISES: RemiseSeed[] = [
    // ─── Règles de volume (automatiques, cumulables) ───
    {
        code: 'VOL-500',
        nom: 'Remise volume >500 élèves',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 10,
        dureeApplication: DureeApplicationRemise.PERMANENTE,
        cible: CibleRemise.GLOBAL,
        cumulable: true,
        priorite: 10,
        conditionElevesMin: 500,
        actif: true,
    },
    {
        code: 'VOL-1000',
        nom: 'Remise volume >1000 élèves',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 20,
        dureeApplication: DureeApplicationRemise.PERMANENTE,
        cible: CibleRemise.GLOBAL,
        cumulable: true,
        priorite: 20,
        conditionElevesMin: 1000,
        actif: true,
    },

    // ─── Règles de fidélité (automatiques, cumulables) ───
    {
        code: 'FID-12M',
        nom: 'Fidélité 12 mois',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 5,
        dureeApplication: DureeApplicationRemise.PERMANENTE,
        cible: CibleRemise.GLOBAL,
        cumulable: true,
        priorite: 30,
        conditionAncienneteMois: 12,
        actif: true,
    },
    {
        code: 'FID-24M',
        nom: 'Fidélité 24 mois',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 10,
        dureeApplication: DureeApplicationRemise.PERMANENTE,
        cible: CibleRemise.GLOBAL,
        cumulable: true,
        priorite: 40,
        conditionAncienneteMois: 24,
        actif: true,
    },

    // ─── Remise groupe — DÉSACTIVÉE (condition non implémentée) ───
    {
        code: 'GRP-3ETAB',
        nom: 'Remise groupe ≥3 établissements',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 15,
        dureeApplication: DureeApplicationRemise.PERMANENTE,
        cible: CibleRemise.GLOBAL,
        cumulable: false,
        priorite: 50,
        actif: false, // ← Désactivé : aucun filtrage groupe n'est implémenté
        // À réactiver quand conditionGroupeMin sera implémenté dans remise.service.ts
    },

    // ─── Remises cycle — SUPPRIMÉES (doublon avec CycleFacturationConfig.remisePourcent) ───
    // Les remises CYCLE-ANNUEL (10%) et CYCLE-SEMESTRIEL (7.5%) faisaient doublon
    // avec le champ remisePourcent de la config cycle de facturation.
    // La source unique de vérité pour les remises cycle est CycleFacturationConfig.

    // ─── Promotions (code coupon, non cumulables, avec dateFin) ───
    {
        code: 'PROMO-RENTREE-2025',
        nom: 'Promotion rentrée scolaire 2025',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 20,
        dureeApplication: DureeApplicationRemise.PREMIERE_FACTURE,
        cible: CibleRemise.GLOBAL,
        cumulable: false,
        priorite: 100,
        codeCoupon: 'RENTREE2025',
        maxUtilisations: 50,
        dateDebut: new Date('2025-09-01'),
        dateFin: new Date('2025-11-30'),
        actif: true,
    },
    {
        code: 'PROMO-LANCEMENT',
        nom: 'Promotion lancement plateforme',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 15,
        dureeApplication: DureeApplicationRemise.N_CYCLES,
        nbCycles: 3,
        cible: CibleRemise.GLOBAL,
        cumulable: false,
        priorite: 90,
        codeCoupon: 'LANCEMENT',
        dateDebut: new Date('2025-08-01'),
        dateFin: new Date('2026-02-28'),
        actif: true,
    },
    {
        code: 'PROMO-BF-2025',
        nom: 'Black Friday 2025',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 25,
        dureeApplication: DureeApplicationRemise.PREMIERE_FACTURE,
        cible: CibleRemise.GLOBAL,
        cumulable: false,
        priorite: 110,
        codeCoupon: 'BF2025',
        maxUtilisations: 30,
        dateDebut: new Date('2025-11-20'),
        dateFin: new Date('2025-12-05'),
        actif: true,
    },
];

export async function seedRemises(): Promise<{ created: number; updated: number }> {
    const remiseRepo = AppDataSource.getRepository(RemiseAbonnement);

    logger.info('[Seed] Insertion des remises abonnement v3...');

    let created = 0;
    let updated = 0;

    for (const remise of REMISES) {
        const existing = await remiseRepo.findOne({ where: { code: remise.code } });

        if (existing) {
            await remiseRepo.update(existing.id, {
                nom: remise.nom,
                typeRemise: remise.typeRemise,
                valeur: remise.valeur,
                dureeApplication: remise.dureeApplication,
                nbCycles: remise.nbCycles,
                cible: remise.cible,
                cibleCycle: remise.cibleCycle,
                cumulable: remise.cumulable,
                priorite: remise.priorite,
                codeCoupon: remise.codeCoupon,
                maxUtilisations: remise.maxUtilisations,
                dateDebut: remise.dateDebut ?? existing.dateDebut,
                dateFin: remise.dateFin ?? existing.dateFin,
                conditionElevesMin: remise.conditionElevesMin,
                conditionAncienneteMois: remise.conditionAncienneteMois,
                actif: remise.actif,
            });
            updated++;
        } else {
            const entity = remiseRepo.create({
                code: remise.code,
                nom: remise.nom,
                typeRemise: remise.typeRemise,
                valeur: remise.valeur,
                dureeApplication: remise.dureeApplication,
                nbCycles: remise.nbCycles,
                cible: remise.cible,
                cibleCycle: remise.cibleCycle,
                cumulable: remise.cumulable,
                priorite: remise.priorite,
                codeCoupon: remise.codeCoupon,
                maxUtilisations: remise.maxUtilisations,
                conditionElevesMin: remise.conditionElevesMin,
                conditionAncienneteMois: remise.conditionAncienneteMois,
                actif: remise.actif,
                dateDebut: remise.dateDebut ?? new Date(),
                dateFin: remise.dateFin ?? null,
                utilisations: 0,
            });
            await remiseRepo.save(entity);
            created++;
        }
    }

    logger.info(`[Seed] ✅ Remises abonnement: ${created} créées, ${updated} mises à jour (${REMISES.length} total)`);
    return { created, updated };
}
