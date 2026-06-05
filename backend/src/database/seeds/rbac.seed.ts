/**
 * ==================================
 * eLISAschool - Seed RBAC (Rôles et Permissions)
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Initialise les rôles système, les ~85 permissions,
 * et le mapping rôle → permissions depuis DEFAULT_ROLE_PERMISSIONS
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import RoleEntity from '@modules/auth/entities/role.entity';
import Permission from '@modules/auth/entities/permission.entity';
import UtilisateurRole from '@modules/auth/entities/utilisateur-role.entity';
import Utilisateur from '@modules/auth/entities/utilisateur.entity';
import { Role, StatutUtilisateur } from '@modules/auth/entities';
import { DEFAULT_ROLE_PERMISSIONS, Permission as PermissionEnum } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

/**
 * Service de seed pour le système RBAC
 */
export class RBACSeedService {
    private roleRepo: Repository<RoleEntity>;
    private permissionRepo: Repository<Permission>;
    private utilisateurRoleRepo: Repository<UtilisateurRole>;
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.roleRepo = AppDataSource.getRepository(RoleEntity);
        this.permissionRepo = AppDataSource.getRepository(Permission);
        this.utilisateurRoleRepo = AppDataSource.getRepository(UtilisateurRole);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    }

    /**
     * Exécute tous les seeds RBAC
     */
    async runAllSeeds(): Promise<{ roles: number; permissions: number; mappings: number; userRoles: number }> {
        logger.info('🔐 Seed RBAC: Rôles et Permissions...');

        const rolesCount = await this.seedRoles();
        const permissionsCount = await this.seedPermissions();
        const mappingsCount = await this.seedRolePermissions();
        const userRolesCount = await this.seedUtilisateurRoles();

        logger.info(`✅ RBAC Seed terminé: ${rolesCount} rôles, ${permissionsCount} permissions, ${mappingsCount} mappings, ${userRolesCount} user-roles`);

        return {
            roles: rolesCount,
            permissions: permissionsCount,
            mappings: mappingsCount,
            userRoles: userRolesCount,
        };
    }

    /**
     * Seed des 9 rôles système
     */
    private async seedRoles(): Promise<number> {
        const rolesDefinition = [
            { code: Role.SUPER_ADMIN, libelle: 'Super Administrateur', description: 'Accès total à toutes les fonctionnalités' },
            { code: Role.ADMIN, libelle: 'Administrateur', description: 'Administrateur de l\'établissement' },
            { code: Role.CHEF_ETABLISSEMENT, libelle: 'Chef d\'Établissement', description: 'Direction de l\'établissement' },
            { code: Role.ENSEIGNANT, libelle: 'Enseignant', description: 'Enseignant' },
            { code: Role.PERSONNEL, libelle: 'Personnel', description: 'Personnel non-enseignant (secrétaire, etc.)' },
            { code: Role.RESPONSABLE_CANTINE, libelle: 'Responsable Cantine', description: 'Gestion de la cantine' },
            { code: Role.RESPONSABLE_TRANSPORT, libelle: 'Responsable Transport', description: 'Gestion du transport' },
            { code: Role.PARENT, libelle: 'Parent', description: 'Parent d\'élève' },
            { code: Role.ELEVE, libelle: 'Élève', description: 'Élève' },
        ];

        let count = 0;

        for (const roleDef of rolesDefinition) {
            const existing = await this.roleRepo.findOne({ where: { code: roleDef.code } });

            if (!existing) {
                const role = this.roleRepo.create({
                    ...roleDef,
                    estSysteme: true,
                    estActif: true,
                });
                await this.roleRepo.save(role);
                count++;
                logger.debug(`  ✓ Rôle créé: ${roleDef.libelle}`);
            }
        }

        return count;
    }

    /**
     * Seed de toutes les permissions (~85)
     */
    private async seedPermissions(): Promise<number> {
        // Permissions existantes (de l'enum)
        const existingPermissions = Object.values(PermissionEnum);

        // Nouvelles permissions pour couvrir tous les modules
        const newPermissions = [
            // Élèves
            { code: 'eleves:view', libelle: 'Voir les élèves', module: 'eleves', action: 'view' },
            { code: 'eleves:create', libelle: 'Créer un élève', module: 'eleves', action: 'create' },
            { code: 'eleves:edit', libelle: 'Modifier un élève', module: 'eleves', action: 'edit' },
            { code: 'eleves:delete', libelle: 'Supprimer un élève', module: 'eleves', action: 'delete' },
            { code: 'eleves:import', libelle: 'Importer des élèves', module: 'eleves', action: 'import' },
            { code: 'eleves:export', libelle: 'Exporter des élèves', module: 'eleves', action: 'export' },

            // Enseignants / Personnel
            { code: 'enseignants:view', libelle: 'Voir les enseignants', module: 'enseignants', action: 'view' },
            { code: 'enseignants:create', libelle: 'Créer un enseignant', module: 'enseignants', action: 'create' },
            { code: 'enseignants:edit', libelle: 'Modifier un enseignant', module: 'enseignants', action: 'edit' },
            { code: 'enseignants:delete', libelle: 'Supprimer un enseignant', module: 'enseignants', action: 'delete' },
            { code: 'enseignants:assign', libelle: 'Assigner un enseignant', module: 'enseignants', action: 'assign' },

            // Classes
            { code: 'classes:view', libelle: 'Voir les classes', module: 'classes', action: 'view' },
            { code: 'classes:create', libelle: 'Créer une classe', module: 'classes', action: 'create' },
            { code: 'classes:edit', libelle: 'Modifier une classe', module: 'classes', action: 'edit' },
            { code: 'classes:delete', libelle: 'Supprimer une classe', module: 'classes', action: 'delete' },

            // Matières
            { code: 'matieres:view', libelle: 'Voir les matières', module: 'matieres', action: 'view' },
            { code: 'matieres:create', libelle: 'Créer une matière', module: 'matieres', action: 'create' },
            { code: 'matieres:edit', libelle: 'Modifier une matière', module: 'matieres', action: 'edit' },
            { code: 'matieres:delete', libelle: 'Supprimer une matière', module: 'matieres', action: 'delete' },
            { code: 'matieres:assign', libelle: 'Assigner une matière', module: 'matieres', action: 'assign' },

            // Années scolaires
            { code: 'annees:view', libelle: 'Voir les années scolaires', module: 'annees', action: 'view' },
            { code: 'annees:create', libelle: 'Créer une année scolaire', module: 'annees', action: 'create' },
            { code: 'annees:edit', libelle: 'Modifier une année scolaire', module: 'annees', action: 'edit' },
            { code: 'annees:delete', libelle: 'Supprimer une année scolaire', module: 'annees', action: 'delete' },
            { code: 'annees:activer', libelle: 'Activer une année scolaire', module: 'annees', action: 'activer' },

            // Périodes
            { code: 'periodes:view', libelle: 'Voir les périodes', module: 'periodes', action: 'view' },
            { code: 'periodes:create', libelle: 'Créer une période', module: 'periodes', action: 'create' },
            { code: 'periodes:edit', libelle: 'Modifier une période', module: 'periodes', action: 'edit' },
            { code: 'periodes:delete', libelle: 'Supprimer une période', module: 'periodes', action: 'delete' },
            { code: 'periodes:cloturer', libelle: 'Clôturer une période', module: 'periodes', action: 'cloturer' },

            // Cycles
            { code: 'cycles:view', libelle: 'Voir les cycles', module: 'cycles', action: 'view' },
            { code: 'cycles:create', libelle: 'Créer un cycle', module: 'cycles', action: 'create' },
            { code: 'cycles:edit', libelle: 'Modifier un cycle', module: 'cycles', action: 'edit' },
            { code: 'cycles:delete', libelle: 'Supprimer un cycle', module: 'cycles', action: 'delete' },

            // Niveaux
            { code: 'niveaux:view', libelle: 'Voir les niveaux', module: 'niveaux', action: 'view' },
            { code: 'niveaux:create', libelle: 'Créer un niveau', module: 'niveaux', action: 'create' },
            { code: 'niveaux:edit', libelle: 'Modifier un niveau', module: 'niveaux', action: 'edit' },
            { code: 'niveaux:delete', libelle: 'Supprimer un niveau', module: 'niveaux', action: 'delete' },

            // Orientation
            { code: 'orientation:view', libelle: 'Voir l\'orientation', module: 'orientation', action: 'view' },
            { code: 'orientation:create', libelle: 'Créer un profil d\'orientation', module: 'orientation', action: 'create' },
            { code: 'orientation:edit', libelle: 'Modifier l\'orientation', module: 'orientation', action: 'edit' },
            { code: 'orientation:valider', libelle: 'Valider l\'orientation', module: 'orientation', action: 'valider' },

            // Scoring
            { code: 'scoring:view', libelle: 'Voir le scoring', module: 'scoring', action: 'view' },
            { code: 'scoring:configurer', libelle: 'Configurer le scoring', module: 'scoring', action: 'configurer' },
            { code: 'scoring:generer', libelle: 'Générer le scoring', module: 'scoring', action: 'generer' },

            // Monitoring
            { code: 'monitoring:view', libelle: 'Voir le monitoring', module: 'monitoring', action: 'view' },
            { code: 'monitoring:logs', libelle: 'Voir les logs', module: 'monitoring', action: 'logs' },
            { code: 'monitoring:export', libelle: 'Exporter les données de monitoring', module: 'monitoring', action: 'export' },

            // Établissement
            { code: 'etablissement:view', libelle: 'Voir l\'établissement', module: 'etablissement', action: 'view' },
            { code: 'etablissement:edit', libelle: 'Modifier l\'établissement', module: 'etablissement', action: 'edit' },

            // Impressions
            { code: 'impressions:view', libelle: 'Voir les impressions', module: 'impressions', action: 'view' },
            { code: 'impressions:gerer', libelle: 'Gérer les impressions', module: 'impressions', action: 'gerer' },

            // Notifications
            { code: 'notifications:view', libelle: 'Voir les notifications', module: 'notifications', action: 'view' },
            { code: 'notifications:envoyer', libelle: 'Envoyer des notifications', module: 'notifications', action: 'envoyer' },
            { code: 'notifications:configurer', libelle: 'Configurer les notifications', module: 'notifications', action: 'configurer' },

            // Messagerie
            { code: 'messagerie:view', libelle: 'Voir la messagerie', module: 'messagerie', action: 'view' },
            { code: 'messagerie:envoyer', libelle: 'Envoyer des messages', module: 'messagerie', action: 'envoyer' },
            { code: 'messagerie:supprimer', libelle: 'Supprimer des messages', module: 'messagerie', action: 'supprimer' },

            // Requêtes (complément)
            { code: 'requetes:refuser', libelle: 'Refuser une requête', module: 'requetes', action: 'refuser' },
        ];

        // Fusionner avec les permissions existantes (parser les codes)
        const allPermissions = new Map<string, { code: string; libelle: string; module: string; action: string }>();

        // Ajouter les nouvelles permissions
        for (const perm of newPermissions) {
            allPermissions.set(perm.code, perm);
        }

        // Parser les permissions existantes de l'enum
        for (const permCode of existingPermissions) {
            if (!allPermissions.has(permCode)) {
                const [module, action] = permCode.split(':');
                allPermissions.set(permCode, {
                    code: permCode,
                    libelle: this.generateLibelle(module, action),
                    module,
                    action,
                });
            }
        }

        let count = 0;

        for (const permData of allPermissions.values()) {
            const existing = await this.permissionRepo.findOne({ where: { code: permData.code } });

            if (!existing) {
                const permission = this.permissionRepo.create({
                    ...permData,
                    actif: true,
                });
                await this.permissionRepo.save(permission);
                count++;
            }
        }

        logger.info(`  ✓ ${count} permissions créées (total: ${allPermissions.size})`);
        return count;
    }

    /**
     * Génère un libellé lisible depuis un code de permission
     */
    private generateLibelle(module: string, action: string): string {
        const actions: Record<string, string> = {
            view: 'Voir',
            create: 'Créer',
            edit: 'Modifier',
            delete: 'Supprimer',
            manage: 'Gérer',
            validate: 'Valider',
            generate: 'Générer',
            print: 'Imprimer',
            send: 'Envoyer',
            broadcast: 'Diffuser',
            approve: 'Approuver',
        };

        const moduleLabels: Record<string, string> = {
            users: 'les utilisateurs',
            roles: 'les rôles',
            notes: 'les notes',
            bulletins: 'les bulletins',
            cantine: 'la cantine',
            transport: 'le transport',
            materiel: 'le matériel',
            clubs: 'les clubs',
            documents: 'les documents',
            cartes: 'les cartes',
            config: 'la configuration',
            monitoring: 'le monitoring',
            messages: 'les messages',
            notifications: 'les notifications',
            requetes: 'les requêtes',
            gamification: 'la gamification',
        };

        const actionLabel = actions[action] || action;
        const moduleLabel = moduleLabels[module] || module;

        return `${actionLabel} ${moduleLabel}`;
    }

    /**
     * Seed du mapping rôle → permissions depuis DEFAULT_ROLE_PERMISSIONS
     */
    private async seedRolePermissions(): Promise<number> {
        let count = 0;

        // Pour chaque rôle dans DEFAULT_ROLE_PERMISSIONS
        for (const [roleCode, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            const role = await this.roleRepo.findOne({ where: { code: roleCode } });

            if (!role) {
                logger.warn(`  ⚠ Rôle non trouvé: ${roleCode}`);
                continue;
            }

            // Récupérer ou créer les permissions
            const permissionEntities: Permission[] = [];

            for (const permCode of permissions) {
                let permission = await this.permissionRepo.findOne({ where: { code: permCode } });

                if (!permission) {
                    // Créer la permission si elle n'existe pas
                    const [module, action] = permCode.split(':');
                    permission = this.permissionRepo.create({
                        code: permCode,
                        libelle: this.generateLibelle(module, action),
                        module,
                        action,
                        actif: true,
                    });
                    await this.permissionRepo.save(permission);
                }

                permissionEntities.push(permission);
            }

            // Assigner les permissions au rôle
            role.permissions = permissionEntities;
            await this.roleRepo.save(role);
            count += permissionEntities.length;

            logger.debug(`  ✓ ${roleCode}: ${permissionEntities.length} permissions assignées`);
        }

        return count;
    }

    /**
     * Seed des utilisateur_roles pour les utilisateurs existants
     * Migre le champ role (legacy) vers le nouveau système multi-rôles
     */
    private async seedUtilisateurRoles(): Promise<number> {
        const utilisateurs = await this.utilisateurRepo.find();
        let count = 0;

        for (const utilisateur of utilisateurs) {
            // Vérifier si l'utilisateur a déjà des rôles assignés
            const existingRoles = await this.utilisateurRoleRepo.findOne({
                where: { utilisateurId: utilisateur.id },
            });

            if (!existingRoles && utilisateur.role) {
                // Trouver le rôle correspondant
                const role = await this.roleRepo.findOne({
                    where: { code: utilisateur.role },
                });

                if (role) {
                    const utilisateurRole = this.utilisateurRoleRepo.create({
                        utilisateurId: utilisateur.id,
                        roleId: role.id,
                        estPrincipal: true,
                        dateAttribution: new Date(),
                    });
                    await this.utilisateurRoleRepo.save(utilisateurRole);
                    count++;
                    logger.debug(`  ✓ Utilisateur ${utilisateur.email} → Rôle ${role.libelle}`);
                }
            }
        }

        return count;
    }
}

export default RBACSeedService;
