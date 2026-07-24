/**
 * ==================================
 * eLISAschool — Pré-nettoyage HeuresCours
 * ==================================
 * Supprime les lignes orphelines dans heures_cours
 * avant que TypeORM synchronize crée la FK.
 * Exécution : node dist/pre-sync-cleanup.js
 */

import { AppDataSource } from '../database/data-source';
import { logger } from '../common/utils/logger.util';

async function preSyncCleanup(): Promise<void> {
    logger.info('🧹 Pré-nettoyage heures_cours — vérification des orphelins...');

    const orphanCount = await AppDataSource.query(`
        DELETE FROM heures_cours
        WHERE classeAnneeId IS NOT NULL
          AND classeAnneeId != ''
          AND NOT EXISTS (
              SELECT 1 FROM classes_annees WHERE id = heures_cours.classeAnneeId
          )
    `);

    logger.info(`✅ ${orphanCount?.[1] || 0} lignes orphelines supprimées de heures_cours`);

    // Vérifier aussi les heures_cours avec salleId orphelins
    const orphanSalle = await AppDataSource.query(`
        DELETE FROM heures_cours
        WHERE salleId IS NOT NULL
          AND salleId != ''
          AND NOT EXISTS (
              SELECT 1 FROM salles WHERE id = heures_cours.salleId
          )
    `);
    logger.info(`✅ ${orphanSalle?.[1] || 0} heures_cours avec salleId orpheline supprimées`);
}

preSyncCleanup()
    .then(() => {
        logger.info('✅ Pré-nettoyage terminé');
        process.exit(0);
    })
    .catch((err) => {
        logger.error('❌ Échec pré-nettoyage:', err);
        process.exit(1);
    });