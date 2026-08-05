/**
 * ==================================
 * eLISAschool — Post-sync : index uniques partiels
 * ==================================
 * Recrée les index uniques partiels que TypeORM synchronize
 * ne peut pas gérer (clause WHERE).
 * ==================================
 */

import { DataSource } from 'typeorm';
import { logger } from '@common/utils/logger.util';

/**
 * Index uniques partiels à maintenir après chaque synchronize.
 * TypeORM ne supporte pas les index partiels (WHERE) via les décorateurs,
 * donc on les recrée systématiquement au démarrage.
 */
const PARTIAL_UNIQUE_INDEXES = [
    {
        name: 'idx_heures_cours_no_dup',
        sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_heures_cours_no_dup
              ON heures_cours ("enseignantId", date, "heureDebut", "creneauId")
              WHERE "deletedAt" IS NULL`,
    },
    {
        name: 'idx_heures_cours_no_dup_manuel',
        sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_heures_cours_no_dup_manuel
              ON heures_cours ("enseignantId", date, "heureDebut")
              WHERE "deletedAt" IS NULL AND "creneauId" IS NULL`,
    },
    {
        name: 'UQ_jours_feries_nom_pays_etab',
        sql: `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_jours_feries_nom_pays_etab"
              ON jours_feries ("nom", "pays", "etablissementId")
              WHERE "etablissementId" IS NOT NULL`,
    },
];

/**
 * Ré-applique les index uniques partiels après synchronize TypeORM.
 * Idempotent : sans effet si les index existent déjà.
 */
export async function applyPartialIndexes(ds: DataSource): Promise<void> {
    const queryRunner = ds.createQueryRunner();
    try {
        for (const idx of PARTIAL_UNIQUE_INDEXES) {
            await queryRunner.query(idx.sql);
        }
        logger.info(`✅ ${PARTIAL_UNIQUE_INDEXES.length} index partiels vérifiés/créés`);
    } catch (err: any) {
        logger.warn(`⚠ Index partiels: ${err.message}`);
    } finally {
        await queryRunner.release();
    }
}
