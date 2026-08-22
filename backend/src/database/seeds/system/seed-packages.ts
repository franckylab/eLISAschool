/**
 * ==========================================
 * eLISAschool - Seed Package Promotions v4.0
 * ==========================================
 *
 * Peuple la table `package_promotions` avec des combos de packs quota.
 *
 * 2 packages :
 *   - PACKAGE-ELEVES-STOCKAGE : Pack +50 élèves + Pack stockage 10Go → −15%
 *   - PACKAGE-SMS-STOCKAGE    : Pack 500 SMS + Pack stockage 50Go → −20%
 *
 * Les packIds sont résolus dynamiquement par code pack.
 * Idempotent : upsert par code unique.
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { AppDataSource } from '../../data-source';
import { PackagePromotion, TypeRemisePackage } from '@modules/billing/entities/package-promotion.entity';
import { PackQuota } from '@modules/billing/entities/pack-quota.entity';
import { logger } from '@common/utils/logger.util';

interface PackageSeed {
    code: string;
    nom: string;
    description?: string;
    packCodes: string[];
    typeRemise: TypeRemisePackage;
    valeur: number;
    codeCoupon?: string;
    maxUtilisations?: number;
    dateFin?: Date;
    priorite: number;
    actif: boolean;
}

const PACKAGES: PackageSeed[] = [
    {
        code: 'PACKAGE-ELEVES-STOCKAGE',
        nom: 'Package Élèves + Stockage',
        description: 'Pack +50 élèves + Pack +10 Go stockage → remise 15% sur le total des deux packs',
        packCodes: ['PACK_ELEVES_50', 'PACK_STOCKAGE_10GO'],
        typeRemise: TypeRemisePackage.POURCENTAGE,
        valeur: 15,
        maxUtilisations: 100,
        priorite: 10,
        actif: true,
    },
    {
        code: 'PACKAGE-SMS-STOCKAGE',
        nom: 'Package SMS + Stockage',
        description: 'Pack 500 SMS + Pack +50 Go stockage → remise 20% sur le total des deux packs',
        packCodes: ['PACK_SMS_500', 'PACK_STOCKAGE_50GO'],
        typeRemise: TypeRemisePackage.POURCENTAGE,
        valeur: 20,
        codeCoupon: 'SMSSTOCKAGE',
        maxUtilisations: 50,
        dateFin: new Date('2027-06-30'),
        priorite: 20,
        actif: true,
    },
];

export async function seedPackagePromotions(): Promise<{ created: number; updated: number }> {
    const packageRepo = AppDataSource.getRepository(PackagePromotion);
    const packRepo = AppDataSource.getRepository(PackQuota);

    logger.info('[Seed v4] Insertion des package promotions...');

    let created = 0;
    let updated = 0;

    for (const pkg of PACKAGES) {
        // Résoudre les packIds depuis les codes
        const packIds: string[] = [];
        for (const code of pkg.packCodes) {
            const pack = await packRepo.findOne({ where: { code } });
            if (pack) {
                packIds.push(pack.id);
            } else {
                logger.warn(`[Seed v4] Pack "${code}" introuvable — package "${pkg.code}" ignoré`);
                break;
            }
        }
        if (packIds.length !== pkg.packCodes.length) continue;

        const existing = await packageRepo.findOne({ where: { code: pkg.code } });

        if (existing) {
            await packageRepo.update(existing.id, {
                nom: pkg.nom,
                description: pkg.description,
                packIds,
                typeRemise: pkg.typeRemise,
                valeur: pkg.valeur,
                codeCoupon: pkg.codeCoupon,
                maxUtilisations: pkg.maxUtilisations,
                dateFin: pkg.dateFin ?? existing.dateFin,
                priorite: pkg.priorite,
                actif: pkg.actif,
            });
            updated++;
        } else {
            const entity = packageRepo.create({
                code: pkg.code,
                nom: pkg.nom,
                description: pkg.description,
                packIds,
                typeRemise: pkg.typeRemise,
                valeur: pkg.valeur,
                codeCoupon: pkg.codeCoupon,
                maxUtilisations: pkg.maxUtilisations,
                dateDebut: new Date(),
                dateFin: pkg.dateFin,
                utilisations: 0,
                priorite: pkg.priorite,
                actif: pkg.actif,
            });
            await packageRepo.save(entity);
            created++;
        }
    }

    logger.info(`[Seed v4] ✅ Packages: ${created} créés, ${updated} mis à jour (${PACKAGES.length} total)`);
    return { created, updated };
}
