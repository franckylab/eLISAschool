/**
 * ==================================
 * eLISAschool - DataSource TypeORM
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseConfig } from '@config/database.config';

/**
 * Instance principale de DataSource utilisée par l'application
 * Cette instance est initialisée au démarrage du serveur
 */
export const AppDataSource = new DataSource(databaseConfig);

/**
 * Fonction d'initialisation de la base de données
 * Utilisée principalement pour les tests et les scripts
 */
export async function initializeDatabase(): Promise<DataSource> {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    return AppDataSource;
}

/**
 * Fonction de fermeture de la connexion
 */
export async function closeDatabase(): Promise<void> {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
}

export default AppDataSource;
