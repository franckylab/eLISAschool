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
        // Uniquement sur les récurrents : un même JF récurrent (nom+pays) ne doit
        // exister qu'une fois par établissement. Les JF non récurrents (variables
        // par année) partagent le même nom mais ont des dates différentes → pas contraints.
        sql: `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_jours_feries_nom_pays_etab"
              ON jours_feries ("nom", "pays", "etablissementId")
              WHERE "etablissementId" IS NOT NULL AND "estRecurrent" = true`,
    },
];

/**
 * Supprime les doublons existants avant de créer les index uniques.
 * Pour chaque groupe de doublons, garde l'entrée la plus ancienne (MIN createdAt).
 */
const DEDUP_BEFORE_INDEX = [
    {
        name: 'jours_feries (récurrents)',
        sql: `DELETE FROM jours_feries
              WHERE "etablissementId" IS NOT NULL
                AND "estRecurrent" = true
                AND id NOT IN (
                    SELECT DISTINCT ON ("nom", "pays", "etablissementId") id
                    FROM jours_feries
                    WHERE "etablissementId" IS NOT NULL
                      AND "estRecurrent" = true
                    ORDER BY "nom", "pays", "etablissementId", "createdAt" ASC
                )`,
    },
];

/**
 * Ré-applique les index uniques partiels après synchronize TypeORM.
 * Idempotent : sans effet si les index existent déjà.
 * Nettoie les doublons avant création d'index pour éviter l'erreur
 * "could not create unique index".
 */
export async function applyPartialIndexes(ds: DataSource): Promise<void> {
    const queryRunner = ds.createQueryRunner();
    try {
        // 1. Nettoyer les doublons existants
        for (const dedup of DEDUP_BEFORE_INDEX) {
            const result = await queryRunner.query(dedup.sql);
            const deleted = result?.[1] ?? 0; // pg RETURNING rowCount
            if (deleted > 0) {
                logger.info(`🧹 ${dedup.name} : ${deleted} doublons nettoyés`);
            }
        }

        // 2. Créer les index partiels
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
