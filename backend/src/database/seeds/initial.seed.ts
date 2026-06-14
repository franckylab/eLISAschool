/**
 * ==================================
 * eLISAschool - Seed des données initiales
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 * 
 * Inclut: Établissement par défaut, Paramètres système, Modules, RBAC, Super admin
 */

import { AppDataSource } from '../data-source';
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';
import { RBACSeedService } from './rbac.seed';
import { seedEtablissementParDefaut } from './seed-etablissement-par-defaut';
import { seedUtilisateursParRole } from './seed-utilisateurs-par-role';
import { seedStructureAcademique } from './seed-structure-academique';
import { seedClassesParDefaut } from './seed-classes-par-defaut';
import { logger } from '@common/utils/logger.util';

/**
 * Exécute tous les seeds de données initiales
 */
export async function runSeeds(): Promise<void> {
    logger.info('🌱 Exécution des seeds...');

    // 1. Établissement par défaut (source de vérité multi-tenant)
    const etablissementId = await seedEtablissementParDefaut();

    // 2. Configuration (modules, paramètres système)
    await seedConfiguration(etablissementId);

    // 3. RBAC (rôles, permissions, mappings)
    await seedRBAC();

    // 4. Structure académique (types cycles, cycles, niveaux, filières, examens)
    await seedStructureAcademique(etablissementId);

    // 5. Classes par défaut (1 classe par niveau)
    await seedClassesParDefaut(etablissementId);

    // 6. Super admin (lié à l'établissement)
    await seedSuperAdmin(etablissementId);

    // 7. Utilisateurs de test par rôle
    await seedUtilisateursParRole(etablissementId);

    logger.info('✅ Seeds exécutés avec succès');
    logger.info(`🏫 Établissement par défaut: ${etablissementId}`);
}

/**
 * Seed de la configuration via le service dédié
 * @param etablissementId ID de l'établissement pour scopage des paramètres
 */
async function seedConfiguration(etablissementId: string): Promise<void> {
    const seedService = new ConfigurationSeedService();
    const result = await seedService.runAllSeeds();

    logger.info(`Configuration seeds: Modules=${result.modules}, Params=${result.parametres}`);
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
 * @param etablissementId ID de l'établissement pour lier le super admin
 */
async function seedSuperAdmin(etablissementId: string): Promise<void> {
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
        etablissementId: etablissementId, // Lié à l'établissement par défaut
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
    logger.info(`🔗 Super admin lié à l'établissement: ${etablissementId}`);
    logger.warn('⚠️  ATTENTION: Changez le mot de passe par défaut en production !');
}

export default runSeeds;
