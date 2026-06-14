/**
 * ==================================
 * eLISAschool - Seed Utilisateurs par Rôle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée un utilisateur de test pour chaque rôle (sauf SUPER_ADMIN)
 * Tous liés à l'établissement par défaut avec le même mot de passe
 */

import { AppDataSource } from '../data-source';
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur, UtilisateurRole } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

/**
 * Configuration des utilisateurs de test par rôle
 */
const DEFAULT_PASSWORD = 'Test123456!';

interface UserRoleConfig {
    role: Role;
    email: string;
    matricule: string;
    nom: string;
    prenom: string;
    telephone: string;
}

/**
 * Liste des utilisateurs à créer (un par rôle sauf SUPER_ADMIN)
 */
const USERS_TO_CREATE: UserRoleConfig[] = [
    // Direction
    { role: Role.ADMIN, email: 'admin.test@elisaschool.cm', matricule: 'ADMIN-001', nom: 'ADMIN', prenom: 'Test', telephone: '+237690000001' },
    { role: Role.CHEF_ETABLISSEMENT, email: 'chef.etablissement@elisaschool.cm', matricule: 'CHEF-001', nom: 'DUPONT', prenom: 'Jean', telephone: '+237690000002' },
    { role: Role.PROVISEUR, email: 'proviseur@elisaschool.cm', matricule: 'PROV-001', nom: 'MBA', prenom: 'Pierre', telephone: '+237690000003' },
    { role: Role.PRINCIPAL, email: 'principal@elisaschool.cm', matricule: 'PRIN-001', nom: 'NGO', prenom: 'Marie', telephone: '+237690000004' },
    { role: Role.DIRECTEUR, email: 'directeur@elisaschool.cm', matricule: 'DIR-001', nom: 'TCHUENTE', prenom: 'Paul', telephone: '+237690000005' },
    { role: Role.CENSEUR, email: 'censeur@elisaschool.cm', matricule: 'CENS-001', nom: 'FOGUET', prenom: 'André', telephone: '+237690000006' },
    { role: Role.DIRECTEUR_ADJOINT, email: 'directeur.adjoint@elisaschool.cm', matricule: 'DIRADJ-001', nom: 'KAMGA', prenom: 'Rose', telephone: '+237690000007' },
    { role: Role.RESPONSABLE_PEDAGOGIQUE, email: 'resp.pedagogique@elisaschool.cm', matricule: 'RESPED-001', nom: 'TSONDE', prenom: 'Claire', telephone: '+237690000008' },
    
    // Enseignants
    { role: Role.ENSEIGNANT, email: 'enseignant@elisaschool.cm', matricule: 'ENS-001', nom: 'MARTIN', prenom: 'Luc', telephone: '+237690000009' },
    { role: Role.PROFESSEUR_CERTIFIE, email: 'prof.certifie@elisaschool.cm', matricule: 'PCERT-001', nom: 'BELL', prenom: 'François', telephone: '+237690000010' },
    { role: Role.PROFESSEUR_AGREGE, email: 'prof.agrege@elisaschool.cm', matricule: 'PAGREG-001', nom: 'FOTA', prenom: 'Emmanuel', telephone: '+237690000011' },
    { role: Role.INSTITUTEUR, email: 'instituteur@elisaschool.cm', matricule: 'INST-001', nom: 'POUGA', prenom: 'Alice', telephone: '+237690000012' },
    { role: Role.MAITRE_AUXILIAIRE, email: 'maitre.auxiliaire@elisaschool.cm', matricule: 'MAUX-001', nom: 'TEMGOUA', prenom: 'David', telephone: '+237690000013' },
    { role: Role.PROFESSEUR_TECHNIQUE, email: 'prof.technique@elisaschool.cm', matricule: 'PTECH-001', nom: 'KENGNE', prenom: 'Robert', telephone: '+237690000014' },
    { role: Role.EDUCATEUR_MATERNELLE, email: 'educateur.maternelle@elisaschool.cm', matricule: 'EDUMAT-001', nom: 'NJOCK', prenom: 'Sarah', telephone: '+237690000015' },
    { role: Role.PROFESSEUR_PRINCIPAL, email: 'prof.principal@elisaschool.cm', matricule: 'PPRINC-001', nom: 'MBAPPE', prenom: 'Henri', telephone: '+237690000016' },
    { role: Role.COORDINATEUR_DISCIPLINE, email: 'coordinateur@elisaschool.cm', matricule: 'COORD-001', nom: 'ATCHO', prenom: 'Michel', telephone: '+237690000017' },
    
    // Orientation & conseil
    { role: Role.CONSEILLER_ORIENTEUR, email: 'conseiller.orientation@elisaschool.cm', matricule: 'CORIENT-001', nom: 'BILA', prenom: 'Sophie', telephone: '+237690000018' },
    { role: Role.PSYCHOLOGUE_SCOLAIRE, email: 'psychologue@elisaschool.cm', matricule: 'PSY-001', nom: 'ESSOMBA', prenom: 'Catherine', telephone: '+237690000019' },
    { role: Role.ASSISTANT_SOCIAL, email: 'assistant.social@elisaschool.cm', matricule: 'ASSOSOC-001', nom: 'MBOCK', prenom: 'Thérèse', telephone: '+237690000020' },
    
    // Personnel administratif
    { role: Role.PERSONNEL, email: 'personnel@elisaschool.cm', matricule: 'PERS-001', nom: 'PERSONNEL', prenom: 'Test', telephone: '+237690000021' },
    { role: Role.SECRETAIRE_DIRECTION, email: 'secretaire@elisaschool.cm', matricule: 'SECRET-001', nom: 'NGOUBA', prenom: 'Isabelle', telephone: '+237690000022' },
    { role: Role.COMPTABLE, email: 'comptable@elisaschool.cm', matricule: 'COMPT-001', nom: 'TAGNE', prenom: 'Patrick', telephone: '+237690000023' },
    { role: Role.GESTIONNAIRE, email: 'gestionnaire@elisaschool.cm', matricule: 'GEST-001', nom: 'KWATSA', prenom: 'Joseph', telephone: '+237690000024' },
    { role: Role.BIBLIOTHECAIRE, email: 'bibliothequaire@elisaschool.cm', matricule: 'BIBLIO-001', nom: 'MOUOKO', prenom: 'Anne', telephone: '+237690000025' },
    { role: Role.DOCUMENTALISTE, email: 'documentaliste@elisaschool.cm', matricule: 'DOCUM-001', nom: 'EYONG', prenom: 'Louis', telephone: '+237690000026' },
    { role: Role.ARCHIVISTE, email: 'archiviste@elisaschool.cm', matricule: 'ARCH-001', nom: 'FOSSOUO', prenom: 'Marguerite', telephone: '+237690000027' },
    
    // Personnel technique
    { role: Role.TECHNICIEN_LABO, email: 'technicien.labo@elisaschool.cm', matricule: 'TECHLAB-001', nom: 'TCHATAT', prenom: 'Daniel', telephone: '+237690000028' },
    { role: Role.TECHNICIEN_INFO, email: 'technicien.info@elisaschool.cm', matricule: 'TECHINFO-001', nom: 'KUIATE', prenom: 'Serge', telephone: '+237690000029' },
    { role: Role.CONSEILLER_TIC, email: 'conseiller.tic@elisaschool.cm', matricule: 'CTIC-001', nom: 'DONGMO', prenom: 'Patrick', telephone: '+237690000030' },
    { role: Role.AIDE_EDUCATEUR, email: 'aide.educateur@elisaschool.cm', matricule: 'AIDEEDU-001', nom: 'TSAFACK', prenom: 'Nathalie', telephone: '+237690000031' },
    
    // Surveillance & vie scolaire
    { role: Role.SURVEILLANT_GENERAL, email: 'surveillant.general@elisaschool.cm', matricule: 'SURVGEN-001', nom: 'MBOMBOCK', prenom: 'Jacques', telephone: '+237690000032' },
    { role: Role.SURVEILLANT, email: 'surveillant@elisaschool.cm', matricule: 'SURV-001', nom: 'NKOUATOU', prenom: 'Bernard', telephone: '+237690000033' },
    
    // Services spécifiques
    { role: Role.RESPONSABLE_CANTINE, email: 'resp.cantine@elisaschool.cm', matricule: 'RESPCANT-001', nom: 'NJENGAT', prenom: 'Cécile', telephone: '+237690000034' },
    { role: Role.RESPONSABLE_TRANSPORT, email: 'resp.transport@elisaschool.cm', matricule: 'RESPTRAN-001', nom: 'TCHOUPO', prenom: 'Marc', telephone: '+237690000035' },
    { role: Role.RESPONSABLE_INFRASTRUCTURE, email: 'resp.infrastructure@elisaschool.cm', matricule: 'RESPINFRA-001', nom: 'DJOUMESSI', prenom: 'Victor', telephone: '+237690000036' },
    
    // Parents et élèves
    { role: Role.PARENT, email: 'parent@elisaschool.cm', matricule: 'PAR-001', nom: 'PARENT', prenom: 'Test', telephone: '+237690000037' },
    { role: Role.ELEVE, email: 'eleve@elisaschool.cm', matricule: 'ELV-001', nom: 'ELEVE', prenom: 'Test', telephone: '+237690000038' },
];

/**
 * Seed des utilisateurs par rôle
 * @param etablissementId ID de l'établissement par défaut
 * @returns Nombre d'utilisateurs créés
 */
export async function seedUtilisateursParRole(etablissementId: string): Promise<number> {
    const utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
    const utilisateurRoleRepo = AppDataSource.getRepository(UtilisateurRole);
    const roleRepo = AppDataSource.getRepository('Role');

    let count = 0;

    logger.info('👥 Création des utilisateurs par rôle...');

    for (const config of USERS_TO_CREATE) {
        // Vérifier si l'utilisateur existe déjà
        const existing = await utilisateurRepo.findOne({
            where: { email: config.email },
        });

        if (existing) {
            logger.debug(`  ⏭ Utilisateur déjà existant: ${config.email}`);
            continue;
        }

        // Trouver le rôle
        const role = await roleRepo.findOne({
            where: { code: config.role },
        });

        if (!role) {
            logger.warn(`  ⚠ Rôle non trouvé: ${config.role}`);
            continue;
        }

        // Créer l'utilisateur
        const utilisateur = utilisateurRepo.create({
            email: config.email,
            matricule: config.matricule,
            motDePasse: DEFAULT_PASSWORD,
            role: config.role, // Rôle principal (legacy)
            statut: StatutUtilisateur.ACTIF,
            emailVerifie: true,
            langue: 'fr',
            etablissementId: etablissementId,
        });

        await utilisateurRepo.save(utilisateur);

        // Créer le profil
        const profil = profilRepo.create({
            utilisateurId: utilisateur.id,
            nom: config.nom,
            prenom: config.prenom,
            telephone: config.telephone,
        });

        await profilRepo.save(profil);

        // Créer le lien utilisateur-role (nouveau système multi-rôles)
        const utilisateurRole = utilisateurRoleRepo.create({
            utilisateurId: utilisateur.id,
            roleId: (role as any).id,
            estPrincipal: true,
            dateAttribution: new Date(),
        });

        await utilisateurRoleRepo.save(utilisateurRole);

        count++;
        logger.debug(`  ✓ Utilisateur créé: ${config.email} → ${config.role}`);
    }

    logger.info(`✅ ${count} utilisateurs créés (mot de passe: ${DEFAULT_PASSWORD})`);
    return count;
}

export default seedUtilisateursParRole;
