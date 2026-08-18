/**
 * ==========================================
 * eLISAschool - Seed Bundle Promotions v4.0
 * ==========================================
 *
 * Peuple la table `bundle_promotions` avec des combos de packs quota.
 *
 * 2 bundles :
 *   - BUNDLE-ELEVES-STOCKAGE : Pack +50 élèves + Pack stockage 10Go → −15%
 *   - BUNDLE-SMS-STOCKAGE    : Pack 500 SMS + Pack stockage 50Go → −20%
 *
 * Les packIds sont résolus dynamiquement par code pack.
 * Idempotent : upsert par code unique.
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { AppDataSource } from '../../data-source';
import { BundlePromotion, TypeRemiseBundle } from '@modules/billing/entities/bundle-promotion.entity';
import { PackQuota } from '@modules/billing/entities/pack-quota.entity';
import { logger } from '@common/utils/logger.util';

interface BundleSeed {
    code: string;
    nom: string;
    description?: string;
    packCodes: string[];
    typeRemise: TypeRemiseBundle;
    valeur: number;
    codeCoupon?: string;
    maxUtilisations?: number;
    dateFin?: Date;
    priorite: number;
    actif: boolean;
}

const BUNDLES: BundleSeed[] = [
    {
        code: 'BUNDLE-ELEVES-STOCKAGE',
        nom: 'Bundle Élèves + Stockage',
        description: 'Pack +50 élèves + Pack +10 Go stockage → remise 15% sur le total des deux packs',
        packCodes: ['PACK_ELEVES_50', 'PACK_STOCKAGE_10GO'],
        typeRemise: TypeRemiseBundle.POURCENTAGE,
        valeur: 15,
        maxUtilisations: 100,
        priorite: 10,
        actif: true,
    },
    {
        code: 'BUNDLE-SMS-STOCKAGE',
        nom: 'Bundle SMS + Stockage',
        description: 'Pack 500 SMS + Pack +50 Go stockage → remise 20% sur le total des deux packs',
        packCodes: ['PACK_SMS_500', 'PACK_STOCKAGE_50GO'],
        typeRemise: TypeRemiseBundle.POURCENTAGE,
        valeur: 20,
        codeCoupon: 'SMSSTOCKAGE',
        maxUtilisations: 50,
        dateFin: new Date('2027-06-30'),
        priorite: 20,
        actif: true,
    },
];

export async function seedBundlePromotions(): Promise<{ created: number; updated: number }> {
    const bundleRepo = AppDataSource.getRepository(BundlePromotion);
    const packRepo = AppDataSource.getRepository(PackQuota);

    logger.info('[Seed v4] Insertion des bundle promotions...');

    let created = 0;
    let updated = 0;

    for (const bundle of BUNDLES) {
        // Résoudre les packIds depuis les codes
        const packIds: string[] = [];
        for (const code of bundle.packCodes) {
            const pack = await packRepo.findOne({ where: { code } });
            if (pack) {
                packIds.push(pack.id);
            } else {
                logger.warn(`[Seed v4] Pack "${code}" introuvable — bundle "${bundle.code}" ignoré`);
                break;
            }
        }
        if (packIds.length !== bundle.packCodes.length) continue;

        const existing = await bundleRepo.findOne({ where: { code: bundle.code } });

        if (existing) {
            await bundleRepo.update(existing.id, {
                nom: bundle.nom,
                description: bundle.description,
                packIds,
                typeRemise: bundle.typeRemise,
                valeur: bundle.valeur,
                codeCoupon: bundle.codeCoupon,
                maxUtilisations: bundle.maxUtilisations,
                dateFin: bundle.dateFin ?? existing.dateFin,
                priorite: bundle.priorite,
                actif: bundle.actif,
            });
            updated++;
        } else {
            const entity = bundleRepo.create({
                code: bundle.code,
                nom: bundle.nom,
                description: bundle.description,
                packIds,
                typeRemise: bundle.typeRemise,
                valeur: bundle.valeur,
                codeCoupon: bundle.codeCoupon,
                maxUtilisations: bundle.maxUtilisations,
                dateDebut: new Date(),
                dateFin: bundle.dateFin,
                utilisations: 0,
                priorite: bundle.priorite,
                actif: bundle.actif,
            });
            await bundleRepo.save(entity);
            created++;
        }
    }

    logger.info(`[Seed v4] ✅ Bundles: ${created} créés, ${updated} mis à jour (${BUNDLES.length} total)`);
    return { created, updated };
}
