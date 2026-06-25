/**
 * ==================================
 * eLISAschool - Vérificateur d'État des Seeds
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Vérifie quelles données ont déjà été seedées
 * Affiche un rapport détaillé
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';
import { logger } from '@common/utils/logger.util';

// Charger le fichier .env
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

async function checkSeedsStatus(): Promise<void> {
    try {
        logger.info('🔍 Vérification de l\'état des seeds...\n');

        const AppDataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '7002'),
            username: process.env.DB_USER || 'elisaschool_user',
            password: process.env.DB_PASSWORD || 'elisaschool_password',
            database: process.env.DB_NAME || 'elisaschool',
            synchronize: false,
            logging: false,
            entities: [__dirname + '/../../modules/**/entities/*.entity.{js,ts}'],
        });

        await AppDataSource.initialize();
        logger.info('✅ Connexion à la base de données établie\n');

        // Vérifier chaque entité
        const checks = [
            { name: 'Établissements', entity: 'Etablissement', module: '@modules/etablissement/entities' },
            { name: 'Cycles', entity: 'Cycle', module: '@modules/cycles/entities' },
            { name: 'Niveaux', entity: 'Niveau', module: '@modules/niveaux/entities' },
            { name: 'Filières', entity: 'Filiere', module: '@modules/filieres/entities' },
            { name: 'Spécialités', entity: 'Specialite', module: '@modules/specialites/entities/specialite.entity' },
            { name: 'Examens Nationaux', entity: 'ExamenNational', module: '@modules/examens-nationaux/entities' },
            { name: 'Compétences', entity: 'Competence', module: '@modules/competences/entities/competence.entity' },
            { name: 'Années Scolaires', entity: 'AnneeScolaire', module: '@modules/annees-scolaires/entities' },
            { name: 'Classes', entity: 'Classe', module: '@modules/classes/entities' },
            { name: 'Matières', entity: 'Matiere', module: '@modules/matieres/entities' },
            { name: 'Matières-Niveaux', entity: 'MatiereNiveau', module: '@modules/matieres/entities/matiere-niveau.entity' },
            { name: 'Utilisateurs', entity: 'Utilisateur', module: '@modules/auth/entities' },
            { name: 'Élèves', entity: 'Eleve', module: '@modules/eleves/entities' },
            { name: 'Rôles', entity: 'Role', module: '@modules/auth/entities' },
            { name: 'Permissions', entity: 'Permission', module: '@modules/auth/entities' },
        ];

        logger.info('📊 Rapport d\'état des seeds:');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const results: Array<{ name: string; count: number; status: string }> = [];

        for (const check of checks) {
            try {
                const { [check.entity]: EntityClass } = await import(check.module);
                const repo = AppDataSource.getRepository(EntityClass);
                const count = await repo.count();
                
                let status = '❌ Vide';
                if (count > 0) {
                    status = count > 10 ? '✅ OK' : '⚠️ Partiel';
                }

                results.push({ name: check.name, count, status });
                logger.info(`${status.padEnd(8)} ${check.name.padEnd(25)} ${count.toString().padStart(6)} enregistrment(s)`);
            } catch (error) {
                logger.error(`❌ Erreur pour ${check.name}:`, error);
                results.push({ name: check.name, count: 0, status: '❌ Erreur' });
            }
        }

        logger.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Résumé
        const totalEntities = results.reduce((sum, r) => sum + r.count, 0);
        const emptySeeds = results.filter(r => r.count === 0).length;
        const okSeeds = results.filter(r => r.status === '✅ OK').length;

        logger.info('\n📈 Résumé:');
        logger.info(`  Total entités: ${totalEntities}`);
        logger.info(`  Seeds OK: ${okSeeds}/${results.length}`);
        logger.info(`  Seeds vides: ${emptySeeds}/${results.length}`);
        logger.info(`  Complétion: ${Math.round((okSeeds / results.length) * 100)}%`);

        if (emptySeeds > 0) {
            logger.info('\n💡 Conseil: Exécutez `npm run seed` pour créer les données manquantes');
        } else {
            logger.info('\n✅ Tous les seeds sont correctement initialisés!');
        }

        await AppDataSource.destroy();
        logger.info('\n🔌 Connexion fermée');

    } catch (error) {
        logger.error('❌ Erreur lors de la vérification:', error);
        process.exit(1);
    }
}

// Exécution
checkSeedsStatus();
