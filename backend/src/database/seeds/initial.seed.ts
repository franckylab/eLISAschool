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
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur, UtilisateurEtablissement, UtilisateurRole } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';
import { RBACSeedService } from './rbac.seed';
import { seedEtablissementsParDefaut, EtablissementsDefaut } from './seed-etablissement-par-defaut';
import { seedUtilisateursParRole } from './seed-utilisateurs-par-role';
import { seedStructureAcademique } from './seed-structure-academique';
import { seedClassesParDefaut } from './seed-classes-par-defaut';
import { seedGroupesEtablissements } from './seed-groupes-etablissements';
import { logger } from '@common/utils/logger.util';

/**
 * Exécute tous les seeds de données initiales
 */
export async function runSeeds(): Promise<void> {
    logger.info('🌱 Exécution des seeds...');

    // 1. Établissements par défaut (2 établissements)
    const etablissements = await seedEtablissementsParDefaut();
    const etablissementPrincipalId = etablissements.principal;
    const etablissementSecondaireId = etablissements.secondaire;

    logger.info(`🏫 Établissement principal: ${etablissementPrincipalId}`);
    logger.info(`🏫 Établissement secondaire: ${etablissementSecondaireId}`);

    // 2. Structure académique pour les 2 établissements
    await seedStructureAcademique(etablissementPrincipalId);
    await seedStructureAcademique(etablissementSecondaireId);

    // 3. Classes par défaut pour les 2 établissements
    await seedClassesParDefaut(etablissementPrincipalId);
    await seedClassesParDefaut(etablissementSecondaireId);

    // 4. Configuration (modules, paramètres système) - scopé au principal
    await seedConfiguration(etablissementPrincipalId);

    // 5. RBAC (rôles, permissions, mappings)
    await seedRBAC();

    // 6. Super admin (lié aux 2 établissements)
    await seedSuperAdmin(etablissementPrincipalId, etablissementSecondaireId);

    // 7. Groupes d'établissements (après super admin pour l'admin du groupe)
    const superAdmin = await getSuperAdmin();
    if (superAdmin) {
        await seedGroupesEtablissements(etablissementPrincipalId, superAdmin.id);
    }

    // 8. Chef établissement pour le 2ème établissement
    await seedChefEtablissementSecondaire(etablissementSecondaireId);

    // 9. Utilisateurs de test par rôle (liés au principal + chef lié aux 2 établissements)
    await seedUtilisateursParRole(etablissementPrincipalId, etablissementSecondaireId);

    logger.info('✅ Seeds exécutés avec succès');
    logger.info(`🏫 Établissement principal: ${etablissementPrincipalId}`);
    logger.info(`🏫 Établissement secondaire: ${etablissementSecondaireId}`);
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
 * Récupère le super admin pour l'utiliser comme propriétaire des groupes
 */
async function getSuperAdmin() {
    const userRepo = AppDataSource.getRepository(Utilisateur);
    return await userRepo.findOne({
        where: { email: 'admin@elisaschool.cm' },
    });
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
 * Seed du super administrateur par défaut (lié aux 2 établissements)
 * @param etablissementPrincipalId ID de l'établissement principal
 * @param etablissementSecondaireId ID de l'établissement secondaire
 */
async function seedSuperAdmin(etablissementPrincipalId: string, etablissementSecondaireId: string): Promise<void> {
    const userRepo = AppDataSource.getRepository(Utilisateur);
    const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
    const utilisateurEtablissementRepo = AppDataSource.getRepository(UtilisateurEtablissement);

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
        etablissementId: etablissementPrincipalId, // Établissement principal (legacy)
        maxEtablissementsPersonnel: 0, // 0 = illimité pour super_admin
    });

    await userRepo.save(superAdmin);

    const profil = profilRepo.create({
        utilisateurId: superAdmin.id,
        nom: 'ADMINISTRATEUR',
        prenom: 'Super',
        telephone: '+237690000000',
    });

    await profilRepo.save(profil);

    // CRITIQUE: Lier le Super Admin aux 2 établissements
    
    // Lien avec l'établissement principal
    const superAdminPrincipal = utilisateurEtablissementRepo.create({
        utilisateurId: superAdmin.id,
        etablissementId: etablissementPrincipalId,
        role: Role.SUPER_ADMIN,
        etablissementPrincipal: true, // Principal par défaut
        actif: true,
        dateDebut: new Date(),
    });

    await utilisateurEtablissementRepo.save(superAdminPrincipal);

    // Lien avec l'établissement secondaire
    const superAdminSecondaire = utilisateurEtablissementRepo.create({
        utilisateurId: superAdmin.id,
        etablissementId: etablissementSecondaireId,
        role: Role.SUPER_ADMIN,
        etablissementPrincipal: false,
        actif: true,
        dateDebut: new Date(),
    });

    await utilisateurEtablissementRepo.save(superAdminSecondaire);

    logger.info('✅ Super admin créé: admin@elisaschool.cm');
    logger.info(`🔗 Super admin lié à l'établissement principal: ${etablissementPrincipalId}`);
    logger.info(`🔗 Super admin lié à l'établissement secondaire: ${etablissementSecondaireId}`);
    logger.warn('⚠️  ATTENTION: Changez le mot de passe par défaut en production !');
}

/**
 * Seed du chef d'établissement pour le 2ème établissement
 * @param etablissementSecondaireId ID de l'établissement secondaire
 */
async function seedChefEtablissementSecondaire(etablissementSecondaireId: string): Promise<void> {
    const userRepo = AppDataSource.getRepository(Utilisateur);
    const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
    const utilisateurRoleRepo = AppDataSource.getRepository(UtilisateurRole);
    const utilisateurEtablissementRepo = AppDataSource.getRepository(UtilisateurEtablissement);
    const roleRepo = AppDataSource.getRepository('Role');

    // Vérifier si l'utilisateur existe déjà
    const existant = await userRepo.findOne({
        where: { email: 'chef.palmiers@elisaschool.cm' },
    });

    if (existant) {
        logger.info('Chef établissement secondaire déjà existant, skip...');
        return;
    }

    // Trouver le rôle CHEF_ETABLISSEMENT
    const role = await roleRepo.findOne({
        where: { code: Role.CHEF_ETABLISSEMENT },
    });

    if (!role) {
        logger.warn('⚠ Rôle CHEF_ETABLISSEMENT non trouvé');
        return;
    }

    // Créer l'utilisateur
    const chefEtablissement = userRepo.create({
        email: 'chef.palmiers@elisaschool.cm',
        matricule: 'CHEF-002',
        motDePasse: 'Test123456!',
        role: Role.CHEF_ETABLISSEMENT,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        langue: 'fr',
        etablissementId: etablissementSecondaireId,
        maxEtablissementsPersonnel: 1, // Mono-établissement
    });

    await userRepo.save(chefEtablissement);

    // Créer le profil
    const profil = profilRepo.create({
        utilisateurId: chefEtablissement.id,
        nom: 'ONGUENE',
        prenom: 'Claire',
        telephone: '+237690111111',
    });

    await profilRepo.save(profil);

    // Créer le lien utilisateur-rôle
    const utilisateurRole = utilisateurRoleRepo.create({
        utilisateurId: chefEtablissement.id,
        roleId: (role as any).id,
        estPrincipal: true,
        dateAttribution: new Date(),
    });

    await utilisateurRoleRepo.save(utilisateurRole);

    // CRITIQUE: Créer l'entrée dans UtilisateurEtablissement
    const utilisateurEtablissement = utilisateurEtablissementRepo.create({
        utilisateurId: chefEtablissement.id,
        etablissementId: etablissementSecondaireId,
        role: Role.CHEF_ETABLISSEMENT,
        etablissementPrincipal: true,
        actif: true,
        dateDebut: new Date(),
    });

    await utilisateurEtablissementRepo.save(utilisateurEtablissement);

    logger.info('✅ Chef établissement secondaire créé: chef.palmiers@elisaschool.cm');
    logger.info(`🔗 Lié à l'établissement: ${etablissementSecondaireId}`);
}

export default runSeeds;
