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
import Role from '@modules/auth/entities/role.entity';
import Permission from '@modules/auth/entities/permission.entity';
import UtilisateurRole from '@modules/auth/entities/utilisateur-role.entity';
import Utilisateur from '@modules/auth/entities/utilisateur.entity';
import { CreateRoleDto, AssignPermissionsToRoleDto } from '../dto/create-role.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';
import { Role as RoleEnum } from '@shared/enums/roles.enum';

/**
 * Service de gestion des rôles
 */
export class RolesService {
    private roleRepo: Repository<Role>;
    private permissionRepo: Repository<Permission>;
    private utilisateurRoleRepo: Repository<UtilisateurRole>;
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.roleRepo = AppDataSource.getRepository(Role);
        this.permissionRepo = AppDataSource.getRepository(Permission);
        this.utilisateurRoleRepo = AppDataSource.getRepository(UtilisateurRole);
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
    async findAllRoles(filters?: { estSysteme?: boolean; etablissementId?: string }): Promise<Role[]> {
        const where: any = {};

        if (filters?.estSysteme !== undefined) {
            where.estSysteme = filters.estSysteme;
        }

        if (filters?.etablissementId) {
            where.etablissementId = filters.etablissementId;
        }

        return this.roleRepo.find({
            where,
            relations: ['permissions', 'parent'],
            order: { libelle: 'ASC' },
        });
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

        // Vérifier si des utilisateurs ont ce rôle
        const utilisateurRoles = await this.utilisateurRoleRepo.find({
            where: { roleId: id },
        });

        if (utilisateurRoles.length > 0) {
            throw new AppError(
                `Impossible de supprimer ce rôle : ${utilisateurRoles.length} utilisateur(s) l'ont assigné`,
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
     * Lister les utilisateurs ayant un rôle spécifique
     */
    async getUsersWithRole(roleId: string): Promise<Utilisateur[]> {
        const utilisateurRoles = await this.utilisateurRoleRepo.find({
            where: { roleId },
            relations: ['utilisateur', 'utilisateur.profil'],
        });

        return utilisateurRoles.map(ur => ur.utilisateur);
    }
}

export const rolesService = new RolesService();
export default RolesService;
