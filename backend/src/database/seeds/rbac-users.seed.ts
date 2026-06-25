/**
 * ==================================
 * eLISAschool - Seed Utilisateurs de Test RBAC
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée un utilisateur de test pour CHAQUE rôle système
 * Tous les utilisateurs sont liés à l'établissement par défaut
 * Mot de passe unique : Test123456!
 * 
 * Usage : npm run seed:rbac-users
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Utilisateur, UtilisateurEtablissement, Role, ProfilUtilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { Role as RoleEnum } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';
import * as bcrypt from 'bcryptjs';

/**
 * Service de seed pour les utilisateurs de test RBAC
 */
export class RBACUsersSeedService {
    private userRepo: Repository<Utilisateur>;
    private profilRepo: Repository<ProfilUtilisateur>;
    private ueRepo: Repository<UtilisateurEtablissement>;
    private roleRepo: Repository<Role>;
    private etablissementRepo: Repository<Etablissement>;

    constructor() {
        this.userRepo = AppDataSource.getRepository(Utilisateur);
        this.profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
        this.ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);
        this.roleRepo = AppDataSource.getRepository(Role);
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
    }

    /**
     * Exécute le seed des utilisateurs de test
     */
    async run(): Promise<{ usersCreated: number; usersSkipped: number }> {
        logger.info('👥 Seed Utilisateurs de Test RBAC...');

        // Récupérer l'établissement par défaut
        const etablissement = await this.etablissementRepo.findOne({
            where: {},
            order: { createdAt: 'ASC' }
        });

        if (!etablissement) {
            logger.error('❌ Aucun établissement trouvé. Exécutez d\'abord le seed initial.');
            return { usersCreated: 0, usersSkipped: 0 };
        }

        logger.info(`🏫 Établissement par défaut: ${etablissement.nom} (${etablissement.id.substring(0, 8)})`);

        // Hash du mot de passe de test
        const motDePasse = 'Test123456!';
        const motDePasseHash = await bcrypt.hash(motDePasse, 10);

        // Liste des rôles à créer (exclure SUPER_ADMIN car déjà existant)
        const rolesToCreate = Object.values(RoleEnum).filter(
            role => role !== RoleEnum.SUPER_ADMIN
        );

        let usersCreated = 0;
        let usersSkipped = 0;

        for (const roleCode of rolesToCreate) {
            const email = `test.${roleCode.toLowerCase()}@elisaschool.com`;
            const matricule = `TEST-${roleCode.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-4)}`;

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await this.userRepo.findOne({
                where: { email }
            });

            if (existingUser) {
                logger.debug(`  ⏭ ${roleCode}: utilisateur existe déjà (${email})`);
                usersSkipped++;
                continue;
            }

            // Récupérer le rôle
            const role = await this.roleRepo.findOne({
                where: { code: roleCode }
            });

            if (!role) {
                logger.warn(`  ⚠ Rôle non trouvé: ${roleCode}`);
                usersSkipped++;
                continue;
            }

            try {
                // Créer l'utilisateur
                const utilisateur = this.userRepo.create({
                    email,
                    matricule,
                    motDePasse: motDePasseHash,
                    role: roleCode as any,
                    langue: 'fr',
                });

                await this.userRepo.save(utilisateur);

                // ✅ CRÉER le profil utilisateur
                const profil = this.profilRepo.create({
                    utilisateurId: utilisateur.id,
                    nom: roleCode,
                    prenom: 'Test',
                    telephone: '+237690000000',
                });
                await this.profilRepo.save(profil);

                // Créer la liaison utilisateur-établissement
                const ue = this.ueRepo.create({
                    utilisateurId: utilisateur.id,
                    etablissementId: etablissement.id,
                    roleId: role.id,
                    actif: true,
                    etablissementPrincipal: true,
                });

                await this.ueRepo.save(ue);

                usersCreated++;
                logger.debug(`  ✓ ${roleCode}: ${email} créé`);
            } catch (error) {
                logger.error(`  ✗ Erreur lors de la création de ${roleCode}:`, error);
                usersSkipped++;
            }
        }

        logger.info(`✅ Seed terminé: ${usersCreated} créés, ${usersSkipped} ignorés`);
        logger.info(`🔐 Mot de passe pour tous les utilisateurs: ${motDePasse}`);

        return { usersCreated, usersSkipped };
    }
}

/**
 * Point d'entrée pour exécution standalone
 */
async function main() {
    try {
        await AppDataSource.initialize();
        logger.info('✅ Connexion DB établie');

        const seedService = new RBACUsersSeedService();
        const result = await seedService.run();

        logger.info('📊 Résumé:');
        logger.info(`   - Utilisateurs créés: ${result.usersCreated}`);
        logger.info(`   - Utilisateurs ignorés: ${result.usersSkipped}`);
        logger.info('');
        logger.info('💡 Tous les utilisateurs ont le mot de passe: Test123456!');

        await AppDataSource.destroy();
        logger.info('🔌 Connexion fermée');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur lors du seed:', error);
        process.exit(1);
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    main();
}

export default RBACUsersSeedService;
