import { AppDataSource } from '../../data-source';
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur, UtilisateurEtablissement, RoleEntity } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

export async function seedChefEtablissementSecondaire(etablissementSecondaireId: string): Promise<void> {
    const userRepo = AppDataSource.getRepository(Utilisateur);
    const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
    const utilisateurEtablissementRepo = AppDataSource.getRepository(UtilisateurEtablissement);
    const roleRepo = AppDataSource.getRepository(RoleEntity);

    const existant = await userRepo.findOne({
        where: { email: 'chef.palmiers@elisaschool.cm' },
    });

    if (existant) {
        logger.info('Chef établissement secondaire déjà existant, skip...');
        return;
    }

    const role = await roleRepo.findOne({
        where: { code: Role.CHEF_ETABLISSEMENT },
    });

    if (!role) {
        logger.warn('⚠ Rôle CHEF_ETABLISSEMENT non trouvé');
        return;
    }

    const chefEtablissement = userRepo.create({
        email: 'chef.palmiers@elisaschool.cm',
        matricule: 'CHEF-002',
        motDePasse: 'Test123456!',
        role: Role.CHEF_ETABLISSEMENT,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        langue: 'fr',
        maxEtablissementsPersonnel: 1,
    });

    await userRepo.save(chefEtablissement);

    const profil = profilRepo.create({
        utilisateurId: chefEtablissement.id,
        nom: 'ONGUENE',
        prenom: 'Claire',
        telephone: '+237690111111',
    });

    await profilRepo.save(profil);

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
}
