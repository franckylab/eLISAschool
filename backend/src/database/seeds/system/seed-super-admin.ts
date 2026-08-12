import { AppDataSource } from '../../data-source';
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur, UtilisateurEtablissement, RoleEntity } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';
import crypto from 'crypto';

/**
 * Durcissement v9 — Mot de passe seed depuis variable d'environnement.
 * Fallback : mot de passe aléatoire généré (jamais un mot de passe en dur).
 */
function getSeedPassword(): string {
    if (process.env.SEED_ADMIN_PASSWORD && process.env.SEED_ADMIN_PASSWORD.length >= 12) {
        return process.env.SEED_ADMIN_PASSWORD;
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('[Sécurité Seed] SEED_ADMIN_PASSWORD est obligatoire en production (min 12 caractères)');
    }
    // Fallback développement : mot de passe aléatoire
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    const bytes = crypto.randomBytes(16);
    let pwd = '';
    for (let i = 0; i < 16; i++) pwd += chars[bytes[i] % chars.length];
    logger.warn(`[Seed] SEED_ADMIN_PASSWORD non défini — mot de passe aléatoire généré: ${pwd}`);
    return pwd;
}

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
        // ADR-005 : mettre à jour estPlateforme si nécessaire (rétroactif)
        if (!existant.estPlateforme) {
            existant.estPlateforme = true;
            await userRepo.save(existant);
            logger.info('Super admin mis à jour: estPlateforme=true');
        } else {
            logger.info('Super admin déjà existant, skip...');
        }
        return;
    }

    const superAdmin = userRepo.create({
        email: 'admin@elisaschool.cm',
        matricule: 'ADMIN001',
        motDePasse: getSeedPassword(),
        role: Role.SUPER_ADMIN,
        statut: StatutUtilisateur.ACTIF,
        emailVerifie: true,
        langue: 'fr',
        maxEtablissementsPersonnel: 0,
        estPlateforme: true, // ADR-005 : SUPER_ADMIN a accès au Control Plane
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
    if (!process.env.SEED_ADMIN_PASSWORD) {
        logger.warn('⚠️  SEED_ADMIN_PASSWORD non défini — un mot de passe aléatoire a été utilisé.');
    }
}
