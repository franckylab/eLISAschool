/**
 * ==================================
 * eLISAschool - Script d'exécution des seeds de démonstration
 * ==================================
 * Usage: npm run seed:demo
 * Résout les IDs d'établissement depuis la base, puis exécute les seeds demo.
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { runSystemSeeds } from './initial.seed';
import { seedUtilisateursParRole } from './demo/seed-utilisateurs-par-role';
import { seedElevesExemples } from './demo/seed-eleves-exemples';
import { seedGroupesEtablissements } from './demo/seed-groupes-etablissements';
import { seedChefEtablissementSecondaire } from './demo/seed-chef-etablissement-secondaire';
import { seedHeuresCoursEtEdt } from './demo/seed-heures-cours-edt';
import { seedPersonnelDemo } from './demo/seed-personnel-demo';
import { seedBulletinsPaieDemo } from './demo/seed-bulletins-paie-demo';
import { seedOrganisationDemo } from './demo/seed-organisation-demo';
import { logger } from '@common/utils/logger.util';

const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

async function resolveEtablissementIds(): Promise<{ etablissementPrincipalId: string; etablissementSecondaireId: string; superAdminId?: string }> {
    const { AppDataSource } = require('../data-source');

    if (!AppDataSource.isInitialized) {
        logger.info('🔌 Connexion à la base de données...');
        const SeedDataSource = new DataSource({
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
        await SeedDataSource.initialize();
        Object.assign(AppDataSource, SeedDataSource);
    }

    const etabRepo = AppDataSource.getRepository(Etablissement);
    const etablissements = await etabRepo.find({
        order: { createdAt: 'ASC' },
        take: 2,
    });

    if (etablissements.length === 0) {
        logger.warn('⚠ Aucun établissement trouvé. Exécution des seeds système d\'abord...');
        const ids = await runSystemSeeds();
        return { etablissementPrincipalId: ids.etablissementPrincipalId, etablissementSecondaireId: ids.etablissementSecondaireId };
    }

    const etablissementPrincipalId = etablissements[0].id;
    const etablissementSecondaireId = etablissements.length >= 2 ? etablissements[1].id : etablissementPrincipalId;

    const { Utilisateur } = require('@modules/auth/entities');
    const userRepo = AppDataSource.getRepository(Utilisateur);
    const superAdmin = await userRepo.findOne({ where: { email: 'admin@elisaschool.cm' } });

    return { etablissementPrincipalId, etablissementSecondaireId, superAdminId: superAdmin?.id };
}

async function main(): Promise<void> {
    try {
        logger.info('🎭 Seed démonstration...');

        const { etablissementPrincipalId, etablissementSecondaireId, superAdminId } = await resolveEtablissementIds();

        logger.info(`🏫 Établissement principal: ${etablissementPrincipalId}`);

        // 1. Chef établissement secondaire (demo)
        await seedChefEtablissementSecondaire(etablissementSecondaireId);

        // 2. Groupes d'établissements (demo)
        if (superAdminId) {
            await seedGroupesEtablissements(etablissementPrincipalId, superAdminId);
        }

        // 3. Utilisateurs de test (1 par rôle)
        await seedUtilisateursParRole(etablissementPrincipalId, etablissementSecondaireId);

        // 4. Membres du personnel avec contrats
        await seedPersonnelDemo(etablissementPrincipalId);

        // 5. Élèves exemples (principal uniquement)
        const { AppDataSource } = require('../data-source');
        const { AnneeScolaire, StatutAnneeScolaire } = require('@modules/annees-scolaires/entities');
        const anneeRepo = AppDataSource.getRepository(AnneeScolaire);
        const anneeActive = await anneeRepo.findOne({
            where: { statut: StatutAnneeScolaire.EN_COURS, etablissementId: etablissementPrincipalId },
        });
        if (anneeActive) {
            await seedElevesExemples(etablissementPrincipalId, anneeActive.id);
        }

        // 6. Heures cours et EDT (demo)
        await seedHeuresCoursEtEdt(etablissementPrincipalId);

        // 7. Organisation démo (affectations + fonctions)
        await seedOrganisationDemo(etablissementPrincipalId);

        // 8. Bulletins de paie avec éléments salaire (cotisations, primes, retenues)
        await seedBulletinsPaieDemo(etablissementPrincipalId);

        logger.info('✅ Seeds démonstration exécutés avec succès');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur lors de l\'exécution des seeds démo:', error);
        process.exit(1);
    }
}

main();
