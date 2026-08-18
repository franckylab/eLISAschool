/**
 * ==================================
 * eLISAschool - Script Migration 215
 * ==================================
 * Renommage module responsables-eleves → parents
 * Table: responsables_eleves → parents
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Exécution: npx ts-node -r tsconfig-paths/register src/database/migrations/run-215-rename-parents.ts
 */

import { AppDataSource } from '../data-source';
import { logger } from '../../common/utils/logger.util';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    logger.info('🚀 Démarrage de la migration 215 : rename responsables_eleves → parents...');
    let connexionCreeParScript = false;

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            connexionCreeParScript = true;
            logger.info('✅ Connecté à la base de données');
        } else {
            logger.info('ℹ️ Connexion déjà établie, réutilisation');
        }

        const migrationPath = path.join(__dirname, '../../../database/migrations/215-rename-responsables-to-parents.sql');
        
        if (!fs.existsSync(migrationPath)) {
            logger.error(`❌ Fichier migration introuvable: ${migrationPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf-8');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            // Exécuter le SQL complet (le fichier contient son propre BEGIN/COMMIT)
            await queryRunner.query(sql);
            logger.info('✅ Migration 215 complétée avec succès');

            // Vérification post-migration
            const tableExists = await queryRunner.query(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parents')"
            );
            logger.info(`📊 Table 'parents' existe: ${tableExists[0].exists}`);

            const oldTableExists = await queryRunner.query(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'responsables_eleves')"
            );
            logger.info(`📊 Table 'responsables_eleves' existe encore: ${oldTableExists[0].exists}`);

            if (tableExists[0].exists) {
                const count = await queryRunner.query('SELECT COUNT(*) FROM parents');
                logger.info(`📊 Nombre de parents dans la table: ${count[0].count}`);
            }

            // Vérifier le module catalogue
            const moduleExists = await queryRunner.query(
                "SELECT code, nom, categorie FROM modules_catalogue WHERE code = 'parents'"
            );
            if (moduleExists.length > 0) {
                logger.info(`📊 Module catalogue 'parents': ${moduleExists[0].nom} (${moduleExists[0].categorie})`);
            }

            // Vérifier les permissions
            const perms = await queryRunner.query(
                "SELECT code FROM permissions WHERE code LIKE 'parents:%' ORDER BY code"
            );
            logger.info(`📊 Permissions parents: ${perms.map((p: any) => p.code).join(', ')}`);

        } catch (error) {
            logger.error('❌ Échec de la migration 215', error);
            throw error;
        } finally {
            await queryRunner.release();
        }

    } catch (error) {
        logger.error('❌ Erreur lors de la migration', error);
        process.exit(1);
    } finally {
        // Détruire la connexion uniquement si le script l'a créée
        if (connexionCreeParScript && AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        process.exit(0);
    }
}

// Exécuter uniquement en mode standalone (pas au démarrage de l'app)
if (require.main === module) {
    runMigration();
}
