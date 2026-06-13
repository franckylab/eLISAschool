/**
 * Script de diagnostic pour identifier l'entité problématique
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';

// Charger le .env depuis la racine du projet
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';

async function diagnose() {
    console.log('🔍 Diagnostic TypeORM - Recherche de l\'entité problématique...\n');

    // Désactiver synchronize pour tester manuellement
    const testConfig = {
        ...databaseConfig,
        synchronize: false,
        logging: false,
    };

    const dataSource = new DataSource(testConfig);

    try {
        await dataSource.initialize();
        console.log('✅ Connexion à la base de données réussie\n');

        // Récupérer toutes les entités
        const entities = dataSource.entityMetadatas;
        console.log(`📊 ${entities.length} entités trouvées\n`);

        // Tester chaque entité
        for (const entity of entities) {
            console.log(`🔎 Testing: ${entity.name}`);
            
            // Vérifier les colonnes avec enum
            for (const column of entity.columns) {
                if (column.enum !== undefined && column.enum !== null) {
                    const isArray = Array.isArray(column.enum);
                    const type = typeof column.enum;
                    
                    if (!isArray) {
                        console.error(`\n❌ ERREUR trouvée !`);
                        console.error(`   Entité: ${entity.name}`);
                        console.error(`   Colonne: ${column.propertyName}`);
                        console.error(`   Type de enum: ${type}`);
                        console.error(`   Valeur de enum:`, column.enum);
                        process.exit(1);
                    }
                }
            }
        }

        console.log('\n✅ Toutes les entités sont valides !');
        await dataSource.destroy();
    } catch (error) {
        console.error('\n❌ Erreur lors du diagnostic:', error);
        process.exit(1);
    }
}

diagnose();
