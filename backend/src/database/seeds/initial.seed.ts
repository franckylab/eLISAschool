/**
 * ==================================
 * eLISAschool - Seed des données initiales
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 * 
 * Inclut: Établissements, Structure académique, Années scolaires, Classes,
 *         Matières, Matières-Niveaux, Configuration, RBAC, Utilisateurs, Élèves
 */

import { AppDataSource } from '../data-source';
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur, UtilisateurEtablissement, Role as RoleEntity } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';
import { RBACSeedService } from './rbac.seed';
import { seedEtablissementsParDefaut, EtablissementsDefaut } from './seed-etablissement-par-defaut';
import { seedStructureAcademique } from './seed-structure-academique';
import { seedAnneesScolaires } from './seed-annees-scolaires';
import { seedClassesParDefaut } from './seed-classes-par-defaut';
import { seedMatieres } from './seed-matieres';
import { seedMatieresNiveaux } from './seed-matieres-niveaux';
import { seedElevesExemples } from './seed-eleves-exemples';
import { seedGroupesEtablissements } from './seed-groupes-etablissements';
import { seedUtilisateursParRole } from './seed-utilisateurs-par-role';
import { seedTypePersonnel } from './seed-type-personnel';
import { seedOrganisation } from './seed-organisation';
import { seedTemplatesOrganisation } from './seed-templates';
import { seedHeuresCoursEtEdt } from './seed-heures-cours-edt';
import { logger } from '@common/utils/logger.util';

/**
 * Exécute tous les seeds de données initiales
 */
export async function runSeeds(): Promise<void> {
    logger.info('🌱 Exécution des seeds (v5.0)...');

    // 1. Établissements par défaut (2 établissements)
    const etablissements = await seedEtablissementsParDefaut();
    const etablissementPrincipalId = etablissements.principal;
    const etablissementSecondaireId = etablissements.secondaire;

    logger.info(`🏫 Établissement principal: ${etablissementPrincipalId}`);
    logger.info(`🏫 Établissement secondaire: ${etablissementSecondaireId}`);

    // 2. Structure académique pour les 2 établissements
    await seedStructureAcademique(etablissementPrincipalId);
    await seedStructureAcademique(etablissementSecondaireId);

    // 3. Années scolaires pour les 2 établissements
    const anneeActivePrincipal = await seedAnneesScolaires(etablissementPrincipalId);
    const anneeActiveSecondaire = await seedAnneesScolaires(etablissementSecondaireId);

    // 4. Classes par défaut pour les 2 établissements
    if (anneeActivePrincipal) {
        await seedClassesParDefaut(etablissementPrincipalId, anneeActivePrincipal);
    }
    if (anneeActiveSecondaire) {
        await seedClassesParDefaut(etablissementSecondaireId, anneeActiveSecondaire);
    }

    // 5. Matières pour les 2 établissements
    await seedMatieres(etablissementPrincipalId);
    await seedMatieres(etablissementSecondaireId);

    // 6. Matières-Niveaux (coefficients et horaires) pour les 2 établissements
    await seedMatieresNiveaux(etablissementPrincipalId);
    await seedMatieresNiveaux(etablissementSecondaireId);

    // 7. Configuration (modules, paramètres système) - scopé aux 2 établissements
    await seedConfiguration(etablissementPrincipalId);
    await seedConfiguration(etablissementSecondaireId);

    // 8. RBAC (rôles, permissions, mappings)
    await seedRBAC();

    // 9. Super admin (lié aux 2 établissements)
    await seedSuperAdmin(etablissementPrincipalId, etablissementSecondaireId);

    // 10. Groupes d'établissements (après super admin pour l'admin du groupe)
    const superAdmin = await getSuperAdmin();
    if (superAdmin) {
        await seedGroupesEtablissements(etablissementPrincipalId, superAdmin.id);
    }

    // 11. Chef établissement pour le 2ème établissement
    await seedChefEtablissementSecondaire(etablissementSecondaireId);

    // 12. Utilisateurs de test par rôle (liés au principal + chef lié aux 2 établissements)
    await seedUtilisateursParRole(etablissementPrincipalId, etablissementSecondaireId);

    // 12-bis. Types de personnel (nécessaires pour les postes)
    await seedTypePersonnel();

    // 13. Structure organisationnelle (unités, postes, hiérarchies)
    await seedOrganisation(etablissementPrincipalId, 'Lycée Bilingue eLISAschool');
    await seedOrganisation(etablissementSecondaireId, 'Collège Privé Les Palmiers');

    // 14. Templates d'organisation (système)
    const templatesCount = await seedTemplatesOrganisation();
    logger.info(`📋 ${templatesCount} templates système créés`);

    // 15. Élèves exemples (uniquement pour l'établissement principal)
    if (anneeActivePrincipal) {
        await seedElevesExemples(etablissementPrincipalId, anneeActivePrincipal);
    }

    // 16. HeuresCours & EDT pour l'établissement principal
    await seedHeuresCoursEtEdt(etablissementPrincipalId);

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

    logger.info(`RBAC seeds: ${result.roles} rôles, ${result.permissions} permissions, ${result.mappings} mappings`);
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
    const roleRepo = AppDataSource.getRepository(RoleEntity);

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
    
    // Récupérer le rôle SUPER_ADMIN depuis la base
    const roleSuperAdmin = await roleRepo.findOne({ where: { code: Role.SUPER_ADMIN } });
    if (!roleSuperAdmin) {
        logger.error('❌ Rôle SUPER_ADMIN non trouvé en base');
        return;
    }

    // Lien avec l'établissement principal
    const superAdminPrincipal = utilisateurEtablissementRepo.create({
        utilisateurId: superAdmin.id,
        etablissementId: etablissementPrincipalId,
        roleId: roleSuperAdmin.id,
        etablissementPrincipal: true,
        actif: true,
        dateDebut: new Date(),
    });

    await utilisateurEtablissementRepo.save(superAdminPrincipal);

    // Lien avec l'établissement secondaire
    const superAdminSecondaire = utilisateurEtablissementRepo.create({
        utilisateurId: superAdmin.id,
        etablissementId: etablissementSecondaireId,
        roleId: roleSuperAdmin.id,
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
    const utilisateurEtablissementRepo = AppDataSource.getRepository(UtilisateurEtablissement);
    const roleRepo = AppDataSource.getRepository(RoleEntity);

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

    // CRITIQUE: Créer l'entrée dans UtilisateurEtablissement (SEULE source de vérité pour les rôles)
    const roleChef = await roleRepo.findOne({ where: { code: Role.CHEF_ETABLISSEMENT } });
    if (!roleChef) {
        logger.error('❌ Rôle CHEF_ETABLISSEMENT non trouvé en base');
        return;
    }

    const utilisateurEtablissement = utilisateurEtablissementRepo.create({
        utilisateurId: chefEtablissement.id,
        etablissementId: etablissementSecondaireId,
        roleId: roleChef.id,
        etablissementPrincipal: true,
        actif: true,
        dateDebut: new Date(),
    });

    await utilisateurEtablissementRepo.save(utilisateurEtablissement);

    logger.info('✅ Chef établissement secondaire créé: chef.palmiers@elisaschool.cm');
    logger.info(`🔗 Lié à l'établissement: ${etablissementSecondaireId}`);
}

export default runSeeds;
