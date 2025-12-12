/**
 * ==================================
 * eLISAschool Backend - Point d'entrée principal
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '@database/data-source';
import { createApp } from './app';
import { logger } from '@common/utils/logger.util';
import { envConfig } from '@config/env.config';

// Chargement des variables d'environnement
dotenv.config();

/**
 * Fonction principale de démarrage du serveur
 */
async function bootstrap(): Promise<void> {
    try {
        // Initialisation de la connexion à la base de données
        logger.info('🔌 Connexion à la base de données PostgreSQL...');
        await AppDataSource.initialize();
        logger.info('✅ Connexion à la base de données établie avec succès');

        // Création et configuration de l'application Express
        const app = createApp();
        const port = envConfig.app.port;

        // Démarrage du serveur HTTP
        app.listen(port, () => {
            logger.info(`🚀 Serveur eLISAschool démarré sur le port ${port}`);
            logger.info(`📚 Documentation API: http://localhost:${port}/api/docs`);
            logger.info(`🏥 Health check: http://localhost:${port}/api/health`);
            logger.info(`🌍 Environnement: ${envConfig.app.nodeEnv}`);
        });

        // Gestion de l'arrêt gracieux
        process.on('SIGTERM', async () => {
            logger.info('📴 Signal SIGTERM reçu, arrêt gracieux...');
            await AppDataSource.destroy();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            logger.info('📴 Signal SIGINT reçu, arrêt gracieux...');
            await AppDataSource.destroy();
            process.exit(0);
        });

    } catch (error) {
        logger.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

// Lancement de l'application
bootstrap();
