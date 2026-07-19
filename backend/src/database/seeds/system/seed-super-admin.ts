import { AppDataSource } from '../../data-source';
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur, UtilisateurEtablissement, Role as RoleEntity } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

export async function seedSuperAdmin(
    etablissementPrincipalId: string,
    etablissementSecondaireId: string,
): Promise<void> {
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
        maxEtablissementsPersonnel: 0,
    });

    await userRepo.save(superAdmin);

    const profil = profilRepo.create({
        utilisateurId: superAdmin.id,
        nom: 'ADMINISTRATEUR',
        prenom: 'Super',
        telephone: '+237690000000',
    });

    await profilRepo.save(profil);

    const roleSuperAdmin = await roleRepo.findOne({ where: { code: Role.SUPER_ADMIN } });
    if (!roleSuperAdmin) {
        logger.error('❌ Rôle SUPER_ADMIN non trouvé en base');
        return;
    }

    const superAdminPrincipal = utilisateurEtablissementRepo.create({
        utilisateurId: superAdmin.id,
        etablissementId: etablissementPrincipalId,
        roleId: roleSuperAdmin.id,
        etablissementPrincipal: true,
        actif: true,
        dateDebut: new Date(),
    });

    await utilisateurEtablissementRepo.save(superAdminPrincipal);

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
    logger.warn('⚠️  ATTENTION: Changez le mot de passe par défaut en production !');
}
