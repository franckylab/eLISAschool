/**
 * ==================================
 * eLISAschool - Seed des rôles initiaux
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { AppDataSource } from '../data-source';
import { Utilisateur, ProfilUtilisateur, Role, StatutUtilisateur } from '@modules/auth/entities';
import { ConfigurationApp } from '@modules/configuration/entities';
import { logger } from '@common/utils/logger.util';

/**
 * Exécute les seeds de données initiales
 */
export async function runSeeds(): Promise<void> {
    logger.info('🌱 Exécution des seeds...');

    await seedConfigurationApp();
    await seedSuperAdmin();

    logger.info('✅ Seeds exécutés avec succès');
}

/**
 * Seed de la configuration initiale
 */
async function seedConfigurationApp(): Promise<void> {
    const configRepo = AppDataSource.getRepository(ConfigurationApp);

    const existant = await configRepo.findOne({ where: {} });
    if (existant) {
        logger.info('Configuration app déjà existante, skip...');
        return;
    }

    const config = configRepo.create({
        nomEtablissement: 'eLISAschool Demo',
        typeEtablissement: 'MIXTE',
        langueDefaut: 'fr',
        devise: 'XOF',
        fuseauHoraire: 'Africa/Douala',
        couleurPrimaire: '#28a745',
        couleurSecondaire: '#ffc107',
        couleurAccent: '#007bff',
        theme: 'default',
        messageAccueil: 'Bienvenue sur eLISAschool - Votre solution de gestion scolaire',
        modulesActifs: {
            auth: true,
            utilisateurs: true,
            configuration: true,
            notifications: true,
            messagerie: true,
            cantine: true,
            transport: true,
            notes: true,
            clubs: true,
        },
        version: '1.0.0',
    });

    await configRepo.save(config);
    logger.info('Configuration app créée');
}

/**
 * Seed du super administrateur par défaut
 */
async function seedSuperAdmin(): Promise<void> {
    const userRepo = AppDataSource.getRepository(Utilisateur);
    const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);

    // Vérifier si un super admin existe déjà
    const existant = await userRepo.findOne({
        where: { role: Role.SUPER_ADMIN },
    });

    if (existant) {
        logger.info('Super admin déjà existant, skip...');
        return;
    }

    // Créer le super admin
    const superAdmin = userRepo.create({
        email: 'admin@elisaschool.cm',
        matricule: 'ADMIN001',
        motDePasse: 'AdminSecret123!', // À changer en production !
        role: Role.SUPER_ADMIN,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        langue: 'fr',
    });

    await userRepo.save(superAdmin);

    // Créer le profil associé
    const profil = profilRepo.create({
        utilisateurId: superAdmin.id,
        nom: 'ADMINISTRATEUR',
        prenom: 'Super',
        telephone: '+237690000000',
    });

    await profilRepo.save(profil);

    logger.info('Super admin créé: admin@elisaschool.cm');
    logger.warn('⚠️  ATTENTION: Changez le mot de passe par défaut en production !');
}

export default runSeeds;
