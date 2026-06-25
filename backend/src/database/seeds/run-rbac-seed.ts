/**
 * ==================================
 * eLISAschool - Script d'exécution du seed RBAC uniquement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Exécute UNIQUEMENT le seed RBAC (rôles, permissions, mappings)
 * Plus rapide que le seed complet pour la synchronisation code ↔ DB
 * 
 * Usage: npm run seed:rbac
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';
import { RBACSeedService } from './rbac.seed';
import { logger } from '@common/utils/logger.util';

// Charger le fichier .env depuis la racine du projet
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

async function main(): Promise<void> {
    try {
        logger.info('🔐 Seed RBAC: Synchronisation Rôles et Permissions...');
        logger.info('🔌 Connexion à la base de données...');
        
        // Créer une DataSource avec synchronize pour créer les tables si nécessaire
        const SeedDataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '7002'),
            username: process.env.DB_USER || 'elisaschool_user',
            password: process.env.DB_PASSWORD || 'elisaschool_password',
            database: process.env.DB_NAME || 'elisaschool',
            synchronize: true,  // Activé pour créer les tables si manquantes
            logging: false,      // Réduire les logs
            entities: [__dirname + '/../../modules/**/entities/*.entity.{js,ts}'],
        });
        
        await SeedDataSource.initialize();
        logger.info('✅ Connexion établie');

        // Injecter dans AppDataSource pour le service RBAC
        const { AppDataSource } = require('../data-source');
        Object.assign(AppDataSource, SeedDataSource);

        // Exécuter le seed RBAC uniquement
        const rbacSeedService = new RBACSeedService();
        const result = await rbacSeedService.runAllSeeds();

        logger.info('');
        logger.info('✅ Seed RBAC terminé avec succès !');
        logger.info(`📊 Résumé:`);
        logger.info(`   - Rôles créés: ${result.roles}`);
        logger.info(`   - Permissions créées: ${result.permissions}`);
        logger.info(`   - Mappings rôle→permissions: ${result.mappings}`);
        logger.info('');
        logger.info('💡 La base de données est maintenant synchronisée avec roles.enum.ts');

        await SeedDataSource.destroy();
        logger.info('🔌 Connexion fermée');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur lors de l\'exécution du seed RBAC:', error);
        process.exit(1);
    }
}

main();
