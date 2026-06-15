/**
 * ==================================
 * eLISAschool - Seed Module Emploi-du-Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Crée les paramètres système et permissions pour le module emploi-du-temps
 */

import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';

export async function seedEmploiDuTemps(): Promise<void> {
    // Initialiser la connexion si nécessaire
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    logger.info('[Seed] Début seed module emploi-du-temps...');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
        // 1. Paramètre d'activation du module
        await queryRunner.query(`
            INSERT INTO parametres_systeme (cle, valeur, "typeValeur", "module", description, "etablissementId", visible)
            VALUES (
                'emploi-du-temps.actif',
                'false',
                'BOOLEAN',
                'emploi-du-temps',
                'Activer le module emploi-du-temps',
                NULL,
                true
            )
            ON CONFLICT (cle)
            DO NOTHING;
        `);
        logger.info('[Seed] ✅ Paramètre emploi-du-temps.actif créé');

        // 2. Paramètre de validation workflow
        await queryRunner.query(`
            INSERT INTO parametres_systeme (cle, valeur, "typeValeur", "module", description, "etablissementId", visible)
            VALUES (
                'emploi-du-temps.require_validation',
                'false',
                'BOOLEAN',
                'emploi-du-temps',
                'Exiger une validation pour la création d''emploi du temps',
                NULL,
                true
            )
            ON CONFLICT (cle)
            DO NOTHING;
        `);
        logger.info('[Seed] ✅ Paramètre emploi-du-temps.require_validation créé');

        // Note: Les permissions sont gérées automatiquement par le système RBAC
        // lors de l'attribution des rôles ADMIN et SUPER_ADMIN

        logger.info('[Seed] ✅ Seed module emploi-du-temps terminé avec succès');
    } catch (error) {
        logger.error('[Seed] ❌ Erreur seed module emploi-du-temps:', error);
        throw error;
    } finally {
        await queryRunner.release();
    }
}
