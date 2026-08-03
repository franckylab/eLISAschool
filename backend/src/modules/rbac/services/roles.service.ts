/**
 * ==================================
 * eLISAschool - Service de gestion des rôles
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * CRUD pour les rôles et gestion des permissions
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { RoleEntity as Role } from '@modules/auth/entities';
import { Permission } from '@modules/auth/entities';
import { UtilisateurEtablissement } from '@modules/auth/entities';
import { Utilisateur } from '@modules/auth/entities';
import { CreateRoleDto, AssignPermissionsToRoleDto } from '../dto/create-role.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';
import { Role as RoleEnum } from '@shared/enums/roles.enum';

/**
 * Service de gestion des rôles
 * RBAC v3.0 — Multi-Tenant Strict : comptage via utilisateur_etablissements
 */
export class RolesService {
    private roleRepo: Repository<Role>;
    private permissionRepo: Repository<Permission>;
    private utilisateurEtablissementRepo: Repository<UtilisateurEtablissement>;
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.roleRepo = AppDataSource.getRepository(Role);
        this.permissionRepo = AppDataSource.getRepository(Permission);
        this.utilisateurEtablissementRepo = AppDataSource.getRepository(UtilisateurEtablissement);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    }

    /**
     * Créer un nouveau rôle
     */
    async createRole(createDto: CreateRoleDto, createdBy?: string): Promise<Role> {
        // Vérifier si le code existe déjà
        const existing = await this.roleRepo.findOne({ where: { code: createDto.code } });
        if (existing) {
            throw new AppError('Ce code de rôle existe déjà', 409, 'ROLE_CODE_EXISTS');
        }

        // Vérifier le rôle parent si fourni
        if (createDto.parentId) {
            const parent = await this.roleRepo.findOne({ where: { id: createDto.parentId } });
            if (!parent) {
                throw new AppError('Rôle parent non trouvé', 404, 'PARENT_ROLE_NOT_FOUND');
            }
        }

        // Créer le rôle
        const roleData: any = {
            code: createDto.code,
            libelle: createDto.libelle,
            description: createDto.description,
            etablissementId: createDto.etablissementId,
            estSysteme: false,
            estActif: true,
        };

        if (createDto.parentId) {
            roleData.parentId = createDto.parentId;
        }

        const role = this.roleRepo.create(roleData) as unknown as Role;

        // Assigner les permissions si fournies
        if (createDto.permissionIds && createDto.permissionIds.length > 0) {
            const permissions = await this.permissionRepo.find({
                where: { id: In(createDto.permissionIds) },
            });
            role.permissions = permissions;
        }

        await this.roleRepo.save(role);

        logger.info(`Rôle créé: ${role.libelle} (${role.code}) par ${createdBy}`);

        return role;
    }

    /**
     * Récupérer tous les rôles
     */
    async findAllRoles(filters?: { estSysteme?: boolean; etablissementId?: string }): Promise<Array<Role & { nbUtilisateurs: number }>> {
        const where: any = {};

        if (filters?.estSysteme !== undefined) {
            where.estSysteme = filters.estSysteme;
        }

        if (filters?.etablissementId) {
            where.etablissementId = filters.etablissementId;
        }

        const roles = await this.roleRepo.find({
            where,
            relations: ['permissions', 'parent'],
            order: { libelle: 'ASC' },
        });

        // Compter le nombre d'utilisateurs pour chaque rôle (via utilisateur_etablissements)
        const rolesWithCount = await Promise.all(
            roles.map(async (role) => {
                const count = await this.utilisateurEtablissementRepo.count({
                    where: { roleId: role.id, actif: true },
                });
                return {
                    ...role,
                    nbUtilisateurs: count,
                };
            })
        );

        return rolesWithCount;
    }

    /**
     * Récupérer un rôle par ID
     */
    async findRoleById(id: string): Promise<Role> {
        const role = await this.roleRepo.findOne({
            where: { id },
            relations: ['permissions', 'parent'],
        });

        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        return role;
    }

    /**
     * Mettre à jour un rôle
     */
    async updateRole(id: string, updateDto: Partial<CreateRoleDto>, updatedBy?: string): Promise<Role> {
        const role = await this.findRoleById(id);

        // Empêcher la modification des rôles système
        if (role.estSysteme) {
            throw new AppError('Les rôles système ne peuvent pas être modifiés', 400, 'SYSTEM_ROLE_IMMUTABLE');
        }

        // Vérifier le code si modifié
        if (updateDto.code && updateDto.code !== role.code) {
            const existing = await this.roleRepo.findOne({ where: { code: updateDto.code } });
            if (existing) {
                throw new AppError('Ce code de rôle existe déjà', 409, 'ROLE_CODE_EXISTS');
            }
            role.code = updateDto.code;
        }

        if (updateDto.libelle) role.libelle = updateDto.libelle;
        if (updateDto.description !== undefined) role.description = updateDto.description;

        // Mettre à jour le rôle parent
        if (updateDto.parentId !== undefined) {
            if (updateDto.parentId) {
                // Empêcher l'auto-référence
                if (updateDto.parentId === id) {
                    throw new AppError('Un rôle ne peut pas être son propre parent', 400, 'SELF_REFERENCE');
                }

                const parent = await this.roleRepo.findOne({ where: { id: updateDto.parentId } });
                if (!parent) {
                    throw new AppError('Rôle parent non trouvé', 404, 'PARENT_ROLE_NOT_FOUND');
                }
                role.parentId = updateDto.parentId;
            } else {
                role.parentId = undefined;
            }
        }

        await this.roleRepo.save(role);

        logger.info(`Rôle modifié: ${role.libelle} par ${updatedBy}`);

        // Invalider le cache pour tous les utilisateurs ayant ce rôle
        await permissionResolverService.invalidateCacheForRole(id);

        return role;
    }

    /**
     * Supprimer un rôle
     */
    async deleteRole(id: string, deletedBy?: string): Promise<void> {
        const role = await this.findRoleById(id);

        // Empêcher la suppression des rôles système
        if (role.estSysteme) {
            throw new AppError('Les rôles système ne peuvent pas être supprimés', 400, 'SYSTEM_ROLE_IMMUTABLE');
        }

        // Vérifier si des utilisateurs ont ce rôle (via utilisateur_etablissements)
        const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
            where: { roleId: id, actif: true },
        });

        if (utilisateurEtablissements.length > 0) {
            throw new AppError(
                `Impossible de supprimer ce rôle : ${utilisateurEtablissements.length} utilisateur(s) l'ont assigné`,
                400,
                'ROLE_IN_USE'
            );
        }

        await this.roleRepo.remove(role);

        logger.info(`Rôle supprimé: ${role.libelle} par ${deletedBy}`);
    }

    /**
     * Assigner des permissions à un rôle
     */
    async assignPermissionsToRole(
        roleId: string,
        assignDto: AssignPermissionsToRoleDto,
        updatedBy?: string
    ): Promise<Role> {
        const role = await this.findRoleById(roleId);

        // Empêcher la modification des rôles système
        if (role.estSysteme) {
            throw new AppError('Les permissions des rôles système ne peuvent pas être modifiées', 400, 'SYSTEM_ROLE_IMMUTABLE');
        }

        // Récupérer les permissions
        const permissions = await this.permissionRepo.find({
            where: { id: In(assignDto.permissionIds) },
        });

        if (permissions.length !== assignDto.permissionIds.length) {
            throw new AppError('Certaines permissions sont introuvables', 404, 'PERMISSIONS_NOT_FOUND');
        }

        // Assigner les permissions (remplace les anciennes)
        role.permissions = permissions;
        await this.roleRepo.save(role);

        logger.info(`${permissions.length} permissions assignées au rôle ${role.libelle} par ${updatedBy}`);

        // Invalider le cache pour tous les utilisateurs ayant ce rôle
        await permissionResolverService.invalidateCacheForRole(roleId);

        return role;
    }

    /**
     * Récupérer les permissions d'un rôle
     */
    async getRolePermissions(roleId: string): Promise<Permission[]> {
        const role = await this.findRoleById(roleId);
        return role.permissions || [];
    }

    /**
     * Récupérer toutes les permissions avec leur statut d'assignation pour un rôle
     * Retourne la liste complète des permissions, chacune annotée de son statut
     * (assigned: true/false, source: 'role' | 'none')
     */
    async getRolePermissionsDetail(roleId: string): Promise<Array<{
        permissionId: string;
        code: string;
        libelle: string;
        module: string;
        action: string;
        source: 'role' | 'none';
    }>> {
        const role = await this.findRoleById(roleId);
        const assignedIds = new Set((role.permissions || []).map(p => p.id));

        const allPermissions = await this.permissionRepo.find({
            where: { actif: true },
            order: { module: 'ASC', code: 'ASC' },
        });

        return allPermissions.map(p => ({
            permissionId: p.id,
            code: p.code,
            libelle: p.libelle,
            module: p.module,
            action: p.action,
            source: assignedIds.has(p.id) ? 'role' : 'none',
        }));
    }

    /**
     * Assigner un batch de permissions à un rôle (delta add/remove)
     */
    async batchAssignRolePermissions(
        roleId: string,
        dto: { addedPermissionIds: string[]; removedPermissionIds: string[] },
        updatedBy?: string,
    ): Promise<Role> {
        const role = await this.findRoleById(roleId);

        // Empêcher la modification des rôles système
        if (role.estSysteme) {
            throw new AppError('Les permissions des rôles système ne peuvent pas être modifiées', 400, 'SYSTEM_ROLE_IMMUTABLE');
        }

        const currentIds = new Set((role.permissions || []).map(p => p.id));

        // Ajouter les nouvelles permissions
        if (dto.addedPermissionIds.length > 0) {
            const toAdd = await this.permissionRepo.find({
                where: { id: In(dto.addedPermissionIds) },
            });
            for (const perm of toAdd) {
                currentIds.add(perm.id);
            }
        }

        // Retirer les permissions
        for (const id of dto.removedPermissionIds) {
            currentIds.delete(id);
        }

        // Recharger les permissions finales
        const finalPermissions = await this.permissionRepo.find({
            where: { id: In([...currentIds]) },
        });

        role.permissions = finalPermissions;
        await this.roleRepo.save(role);

        logger.info(`Permissions batch modifiées pour le rôle ${role.libelle} par ${updatedBy} (${dto.addedPermissionIds.length} ajoutées, ${dto.removedPermissionIds.length} retirées)`);

        await permissionResolverService.invalidateCacheForRole(roleId);

        return role;
    }

    /**
     * Lister les utilisateurs ayant un rôle spécifique
     * MULTI-TENANT STRICT : Via utilisateur_etablissements
     */
    async getUsersWithRole(roleId: string): Promise<Array<{
        id: string;
        email: string;
        matricule: string;
        nom?: string;
        prenom?: string;
        telephone?: string;
        statut: string;
        derniereConnexion?: Date;
        etablissementId?: string;
    }>> {
        const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
            where: { roleId, actif: true },
            relations: ['utilisateur'],
        });

        // Si aucun utilisateur n'a ce rôle, retourner un tableau vide
        if (utilisateurEtablissements.length === 0) {
            return [];
        }

        // Récupérer les IDs des utilisateurs
        const utilisateurIds = utilisateurEtablissements.map(ue => ue.utilisateurId);

        // Charger les profils séparément
        const profils = await AppDataSource
            .getRepository('ProfilUtilisateur')
            .createQueryBuilder('p')
            .where('p.utilisateurId IN (:...ids)', { ids: utilisateurIds })
            .getMany()
            .catch(() => []); // En cas d'erreur, retourner un tableau vide

        // Créer un map utilisateurId -> profil
        const profilMap = new Map<string, any>();
        profils.forEach(p => {
            profilMap.set((p as any).utilisateurId, p);
        });

        // Mapper pour inclure les informations du profil et l'établissement
        return utilisateurEtablissements.map(ue => {
            const user = ue.utilisateur;
            const profil = profilMap.get(user.id);
            
            return {
                id: user.id,
                email: user.email,
                matricule: user.matricule,
                nom: profil?.nom || '',
                prenom: profil?.prenom || '',
                telephone: profil?.telephone || '',
                statut: user.statut,
                derniereConnexion: user.derniereConnexion,
                etablissementId: ue.etablissementId,
            };
        });
    }

    /**
     * Obtenir les statistiques des rôles
     */
    async getRoleStats(etablissementId?: string): Promise<{
        totalRoles: number;
        rolesSysteme: number;
        rolesPersonnalises: number;
        rolesParModule: Array<{ module: string; count: number }>;
    }> {
        const where: any = {};
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        // Compter tous les rôles
        const totalRoles = await this.roleRepo.count({ where });

        // Compter les rôles système
        const rolesSysteme = await this.roleRepo.count({
            where: { ...where, estSysteme: true },
        });

        // Compter les rôles personnalisés
        const rolesPersonnalises = await this.roleRepo.count({
            where: { ...where, estSysteme: false },
        });

        // Récupérer tous les rôles avec permissions pour l'analyse par module
        const roles = await this.roleRepo.find({
            where,
            relations: ['permissions'],
        });

        // Analyser les rôles par module
        const moduleMap = new Map<string, number>();
        for (const role of roles) {
            if (role.permissions && role.permissions.length > 0) {
                const modules = new Set(
                    role.permissions.map(p => p.module).filter(Boolean)
                );
                for (const module of modules) {
                    moduleMap.set(module, (moduleMap.get(module) || 0) + 1);
                }
            }
        }

        const rolesParModule = Array.from(moduleMap.entries())
            .map(([module, count]) => ({ module, count }))
            .sort((a, b) => b.count - a.count);

        return {
            totalRoles,
            rolesSysteme,
            rolesPersonnalises,
            rolesParModule,
        };
    }
}

export const rolesService = new RolesService();
export default RolesService;
