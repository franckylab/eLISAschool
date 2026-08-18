/**
 * ==========================================
 * eLISAschool - Seed Remises Abonnement v3.4
 * ==========================================
 *
 * Crée les règles de remise commerciale v3.4 (migration 213 + 214).
 * Idempotent : upsert par code unique.
 *
 * Cohérent avec les 3 plans v3.4 :
 *   - Découverte (14 900 F, 100 élèves inclus)
 *   - Standard   (39 900 F, 300 élèves inclus)
 *   - Premium    (59 900 F, illimité)
 *
 * 4 règles automatiques + 3 promotions (code coupon) :
 *   - VOL-500  : -10% permanent si ≥500 élèves (cible Standard+)
 *   - VOL-1000 : -20% permanent si ≥1000 élèves (cible Premium)
 *   - FID-12M  : -5% permanent après 12 mois d'ancienneté
 *   - FID-24M  : -10% permanent après 24 mois d'ancienneté
 *   - PROMO-RENTREE-2026 : -20% 1ʳᵉ facture, code RENTREE2026
 *   - PROMO-LANCEMENT-V2 : -15% 3 cycles, code LANCEMENT
 *   - PROMO-BF-2026      : -25% 1ʳᵉ facture, code BF2026
 *
 * Plafond global 40% appliqué par remise.service.ts.
 *
 * Version: 3.4.0
 * Auteur: franck arlos chendjou
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

    // ─── Promotions (code coupon, non cumulables, avec dateFin) ───
    {
        code: 'PROMO-RENTREE-2026',
        nom: 'Promotion rentrée scolaire 2026',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 20,
        dureeApplication: DureeApplicationRemise.PREMIERE_FACTURE,
        cible: CibleRemise.GLOBAL,
        cumulable: false,
        priorite: 100,
        codeCoupon: 'RENTREE2026',
        maxUtilisations: 50,
        dateDebut: new Date('2026-09-01'),
        dateFin: new Date('2026-11-30'),
        actif: true,
    },
    {
        code: 'PROMO-LANCEMENT-V3',
        nom: 'Promotion lancement v3.4',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 15,
        dureeApplication: DureeApplicationRemise.N_CYCLES,
        nbCycles: 3,
        cible: CibleRemise.GLOBAL,
        cumulable: false,
        priorite: 90,
        codeCoupon: 'LANCEMENT',
        dateDebut: new Date('2026-08-01'),
        dateFin: new Date('2027-02-28'),
        actif: true,
    },
    {
        code: 'PROMO-BF-2026',
        nom: 'Black Friday 2026',
        typeRemise: TypeRemise.POURCENTAGE,
        valeur: 25,
        dureeApplication: DureeApplicationRemise.PREMIERE_FACTURE,
        cible: CibleRemise.GLOBAL,
        cumulable: false,
        priorite: 110,
        codeCoupon: 'BF2026',
        maxUtilisations: 30,
        dateDebut: new Date('2026-11-20'),
        dateFin: new Date('2026-12-05'),
        actif: true,
    },
];

export async function seedRemises(): Promise<{ created: number; updated: number }> {
    const remiseRepo = AppDataSource.getRepository(RemiseAbonnement);

    logger.info('[Seed] Insertion des remises abonnement v3.4...');

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
                dateFin: remise.dateFin,
                utilisations: 0,
            });
            await remiseRepo.save(entity);
            created++;
        }
    }

    logger.info(`[Seed] ✅ Remises abonnement v3.4: ${created} créées, ${updated} mises à jour (${REMISES.length} total)`);
    return { created, updated };
}
