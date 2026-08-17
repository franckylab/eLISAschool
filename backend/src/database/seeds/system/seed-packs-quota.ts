/**
 * ==========================================
 * eLISAschool - Seed : Packs de quota (migration 213)
 * ==========================================
 *
 * Seed idempotent des packs d'achat de quota supplémentaire.
 * Valeurs identiques à celles posées par la migration 213 en SQL :
 *
 *   - PACK_ELEVES_50    : +50 élèves   —  5 000 FCFA (cycle courant)
 *   - PACK_ELEVES_200   : +200 élèves  — 18 000 FCFA (cycle courant)
 *   - PACK_STOCKAGE_10GO: +10 Go       —  3 000 FCFA (illimité)
 *   - PACK_SMS_500      : +500 SMS     —  7 500 FCFA (cycle courant)
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { PackQuota, DureeValiditePack } from '@modules/billing/entities/pack-quota.entity';
import { logger } from '@common/utils/logger.util';

const PACKS = [
    {
        code: 'PACK_ELEVES_50', nom: 'Pack +50 élèves', ressource: 'eleves',
        quantite: 50, prix: 5000, dureeValidite: DureeValiditePack.CYCLE_COURANT,
        description: 'Augmente le quota d\'élèves de 50 jusqu\'à la fin du cycle de facturation courant',
        ordre: 1,
    },
    {
        code: 'PACK_ELEVES_200', nom: 'Pack +200 élèves', ressource: 'eleves',
        quantite: 200, prix: 18000, dureeValidite: DureeValiditePack.CYCLE_COURANT,
        description: 'Augmente le quota d\'élèves de 200 jusqu\'à la fin du cycle de facturation courant (tarif dégressif)',
        ordre: 2,
    },
    {
        code: 'PACK_STOCKAGE_10GO', nom: 'Pack +10 Go stockage', ressource: 'stockageGo',
        quantite: 10, prix: 3000, dureeValidite: DureeValiditePack.ILLIMITE,
        description: 'Ajoute définitivement 10 Go de stockage au quota de l\'établissement',
        ordre: 3,
    },
    {
        code: 'PACK_SMS_500', nom: 'Pack 500 SMS', ressource: 'sms',
        quantite: 500, prix: 7500, dureeValidite: DureeValiditePack.CYCLE_COURANT,
        description: 'Crédit de 500 SMS valable jusqu\'à la fin du cycle de facturation courant',
        ordre: 4,
    },
];

/**
 * Seed idempotent des packs de quota.
 * @returns { created, skipped }
 */
export async function seedPacksQuota(): Promise<{ created: number; skipped: number }> {
    const repo = AppDataSource.getRepository(PackQuota);
    let created = 0;
    let skipped = 0;

    for (const pack of PACKS) {
        const existing = await repo.findOne({ where: { code: pack.code } });
        if (existing) {
            skipped++;
            continue;
        }

        const entity = repo.create({ ...pack, devise: 'XAF', actif: true });
        await repo.save(entity);
        created++;
    }

    logger.info(`🎒 Seed packs quota : ${created} créés, ${skipped} ignorés (déjà existants)`);
    return { created, skipped };
}

export default seedPacksQuota;
