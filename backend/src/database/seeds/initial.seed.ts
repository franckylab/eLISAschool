/**
 * ==================================
 * eLISAschool - Seed des données initiales
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Inclut: Configuration app, Paramètres système, Super admin
 */

import { AppDataSource } from '../data-source';
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';
import { RBACSeedService } from './rbac.seed';
import { logger } from '@common/utils/logger.util';

/**
 * Exécute tous les seeds de données initiales
 */
export async function runSeeds(): Promise<void> {
    logger.info('🌱 Exécution des seeds...');

    // 1. Configuration (app, modules, paramètres)
    await seedConfiguration();

    // 2. RBAC (rôles, permissions, mappings)
    await seedRBAC();

    // 3. Super admin
    await seedSuperAdmin();

    logger.info('✅ Seeds exécutés avec succès');
}

/**
 * Seed de la configuration via le service dédié
 */
async function seedConfiguration(): Promise<void> {
    const seedService = new ConfigurationSeedService();
    const result = await seedService.runAllSeeds();

    logger.info(`Configuration seeds: App=${result.app}, Modules=${result.modules}, Params=${result.parametres}`);
}

/**
 * Seed du système RBAC (rôles, permissions, mappings)
 */
async function seedRBAC(): Promise<void> {
    const rbacSeedService = new RBACSeedService();
    const result = await rbacSeedService.runAllSeeds();

    logger.info(`RBAC seeds: ${result.roles} rôles, ${result.permissions} permissions, ${result.mappings} mappings, ${result.userRoles} user-roles`);
}

/**
 * Seed du super administrateur par défaut
 */
async function seedSuperAdmin(): Promise<void> {
    const userRepo = AppDataSource.getRepository(Utilisateur);
    const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);

    const existant = await userRepo.findOne({
        where: { email: 'admin@elisaschool.cm' },
    });

    if (existant) {
        logger.info('Super admin déjà existant, skip...');
        return;
    }

    const superAdmin = userRepo.create({
        email: 'admin@elisaschool.cm',
        matricule: 'ADMIN001',
        motDePasse: 'AdminSecret123!',
        role: Role.SUPER_ADMIN,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        langue: 'fr',
    });

    await userRepo.save(superAdmin);

    const profil = profilRepo.create({
        utilisateurId: superAdmin.id,
        nom: 'ADMINISTRATEUR',
        prenom: 'Super',
        telephone: '+237690000000',
    });

    await profilRepo.save(profil);

    logger.info('✅ Super admin créé: admin@elisaschool.cm');
    logger.warn('⚠️  ATTENTION: Changez le mot de passe par défaut en production !');
}

export default runSeeds;
