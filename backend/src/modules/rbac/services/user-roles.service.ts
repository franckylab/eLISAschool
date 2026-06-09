/**
 * ==================================
 * eLISAschool - Service de gestion des rôles et permissions des utilisateurs
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion des rôles et permissions personnalisées au niveau utilisateur
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import Utilisateur from '@modules/auth/entities/utilisateur.entity';
import Role from '@modules/auth/entities/role.entity';
import Permission from '@modules/auth/entities/permission.entity';
import UtilisateurRole from '@modules/auth/entities/utilisateur-role.entity';
import UtilisateurPermission, { TypePermission } from '@modules/auth/entities/utilisateur-permission.entity';
import { AssignRoleToUserDto, AssignPermissionToUserDto } from '@modules/rbac/dto/create-role.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';
import { Role as RoleEnum } from '@shared/enums/roles.enum';

/**
 * Service de gestion des rôles et permissions des utilisateurs
 */
export class UserRolesService {
    private utilisateurRepo: Repository<Utilisateur>;
    private utilisateurRoleRepo: Repository<UtilisateurRole>;
    private utilisateurPermissionRepo: Repository<UtilisateurPermission>;
    private roleRepo: Repository<Role>;
    private permissionRepo: Repository<Permission>;

    constructor() {
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
        this.utilisateurRoleRepo = AppDataSource.getRepository(UtilisateurRole);
        this.utilisateurPermissionRepo = AppDataSource.getRepository(UtilisateurPermission);
        this.roleRepo = AppDataSource.getRepository(Role);
        this.permissionRepo = AppDataSource.getRepository(Permission);
    }

    /**
     * Assigner un rôle à un utilisateur
     */
    async assignRoleToUser(
        utilisateurId: string,
        assignDto: AssignRoleToUserDto,
        assignedBy?: string
    ): Promise<UtilisateurRole> {
        // Vérifier que l'utilisateur existe
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id: utilisateurId } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Vérifier que le rôle existe
        const role = await this.roleRepo.findOne({ where: { id: assignDto.roleId } });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        // Vérifier si l'assignation existe déjà
        const existing = await this.utilisateurRoleRepo.findOne({
            where: { utilisateurId, roleId: assignDto.roleId },
        });

        if (existing) {
            throw new AppError('Ce rôle est déjà assigné à cet utilisateur', 409, 'ROLE_ALREADY_ASSIGNED');
        }

        // Si c'est le rôle principal, marquer les autres comme non-principaux
        if (assignDto.estPrincipal) {
            await this.utilisateurRoleRepo.update(
                { utilisateurId, estPrincipal: true },
                { estPrincipal: false }
            );
        }

        // Créer l'assignation
        const utilisateurRole = this.utilisateurRoleRepo.create({
            utilisateurId,
            roleId: assignDto.roleId,
            estPrincipal: assignDto.estPrincipal,
            attribuePar: assignedBy,
            dateAttribution: new Date(),
        });

        await this.utilisateurRoleRepo.save(utilisateurRole);

        logger.info(`Rôle ${role.code} assigné à l'utilisateur ${utilisateur.email} par ${assignedBy}`);

        // Mettre à jour le champ role (principal) dans utilisateur pour backward compat
        if (assignDto.estPrincipal || !utilisateur.role) {
            utilisateur.role = role.code as unknown as RoleEnum;
            await this.utilisateurRepo.save(utilisateur);
        }

        // Invalider le cache de l'utilisateur
        await permissionResolverService.invalidateUserCache(utilisateurId);

        return utilisateurRole;
    }

    /**
     * Retirer un rôle à un utilisateur
     */
    async removeRoleFromUser(utilisateurId: string, roleId: string, removedBy?: string): Promise<void> {
        // Vérifier que l'assignation existe
        const utilisateurRole = await this.utilisateurRoleRepo.findOne({
            where: { utilisateurId, roleId },
            relations: ['role'],
        });

        if (!utilisateurRole) {
            throw new AppError('Ce rôle n\'est pas assigné à cet utilisateur', 404, 'ROLE_NOT_ASSIGNED');
        }

        // Empêcher la suppression si c'est le seul rôle
        const allRoles = await this.utilisateurRoleRepo.find({ where: { utilisateurId } });
        if (allRoles.length <= 1) {
            throw new AppError('Impossible de supprimer le dernier rôle d\'un utilisateur', 400, 'LAST_ROLE');
        }

        await this.utilisateurRoleRepo.remove(utilisateurRole);

        logger.info(`Rôle ${utilisateurRole.role.code} retiré de l'utilisateur ${utilisateurId} par ${removedBy}`);

        // Si c'était le rôle principal, assigner un nouveau rôle principal
        if (utilisateurRole.estPrincipal) {
            const remainingRoles = await this.utilisateurRoleRepo.find({ where: { utilisateurId } });
            if (remainingRoles.length > 0) {
                remainingRoles[0].estPrincipal = true;
                await this.utilisateurRoleRepo.save(remainingRoles[0]);

                // Mettre à jour le champ role dans utilisateur
                const utilisateur = await this.utilisateurRepo.findOne({ where: { id: utilisateurId } });
                if (utilisateur) {
                    const principalRole = await this.roleRepo.findOne({ where: { id: remainingRoles[0].roleId } });
                    if (principalRole) {
                        utilisateur.role = principalRole.code as unknown as RoleEnum;
                        await this.utilisateurRepo.save(utilisateur);
                    }
                }
            }
        }

        // Invalider le cache de l'utilisateur
        await permissionResolverService.invalidateUserCache(utilisateurId);
    }

    /**
     * Récupérer tous les rôles d'un utilisateur
     */
    async getUserRoles(utilisateurId: string): Promise<UtilisateurRole[]> {
        return this.utilisateurRoleRepo.find({
            where: { utilisateurId },
            relations: ['role', 'role.permissions'],
            order: { estPrincipal: 'DESC', dateAttribution: 'ASC' },
        });
    }

    /**
     * Récupérer le rôle principal d'un utilisateur
     */
    async getPrimaryRole(utilisateurId: string): Promise<Role | null> {
        const utilisateurRole = await this.utilisateurRoleRepo.findOne({
            where: { utilisateurId, estPrincipal: true },
            relations: ['role'],
        });

        return utilisateurRole?.role || null;
    }

    /**
     * Assigner une permission personnalisée à un utilisateur
     */
    async assignPermissionToUser(
        utilisateurId: string,
        assignDto: AssignPermissionToUserDto,
        assignedBy?: string
    ): Promise<UtilisateurPermission> {
        // Vérifier que l'utilisateur existe
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id: utilisateurId } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Vérifier que la permission existe
        const permission = await this.permissionRepo.findOne({ where: { id: assignDto.permissionId } });
        if (!permission) {
            throw new AppError('Permission non trouvée', 404, 'PERMISSION_NOT_FOUND');
        }

        // Vérifier si l'assignation existe déjà
        const existing = await this.utilisateurPermissionRepo.findOne({
            where: { utilisateurId, permissionId: assignDto.permissionId },
        });

        if (existing) {
            // Mettre à jour le type
            existing.type = assignDto.type as TypePermission;
            existing.motif = assignDto.motif;
            existing.attribuePar = assignedBy;

            await this.utilisateurPermissionRepo.save(existing);

            logger.info(`Permission ${permission.code} mise à jour pour l'utilisateur ${utilisateur.email}`);
        } else {
            // Créer l'assignation
            const utilisateurPermission = this.utilisateurPermissionRepo.create({
                utilisateurId,
                permissionId: assignDto.permissionId,
                type: assignDto.type as TypePermission,
                motif: assignDto.motif,
                attribuePar: assignedBy,
            });

            await this.utilisateurPermissionRepo.save(utilisateurPermission);

            logger.info(`Permission ${permission.code} (${assignDto.type}) assignée à l'utilisateur ${utilisateur.email}`);
        }

        // Invalider le cache de l'utilisateur
        await permissionResolverService.invalidateUserCache(utilisateurId);

        return await this.utilisateurPermissionRepo.findOne({
            where: { utilisateurId, permissionId: assignDto.permissionId },
            relations: ['permission'],
        }) as UtilisateurPermission;
    }

    /**
     * Retirer une permission personnalisée d'un utilisateur
     */
    async removePermissionFromUser(utilisateurId: string, permissionId: string): Promise<void> {
        const utilisateurPermission = await this.utilisateurPermissionRepo.findOne({
            where: { utilisateurId, permissionId },
        });

        if (!utilisateurPermission) {
            throw new AppError('Cette permission n\'est pas assignée à cet utilisateur', 404, 'PERMISSION_NOT_ASSIGNED');
        }

        await this.utilisateurPermissionRepo.remove(utilisateurPermission);

        logger.info(`Permission retirée de l'utilisateur ${utilisateurId}`);

        // Invalider le cache de l'utilisateur
        await permissionResolverService.invalidateUserCache(utilisateurId);
    }

    /**
     * Récupérer toutes les permissions personnalisées d'un utilisateur
     */
    async getUserPermissions(utilisateurId: string): Promise<UtilisateurPermission[]> {
        return this.utilisateurPermissionRepo.find({
            where: { utilisateurId },
            relations: ['permission'],
            order: { dateAttribution: 'DESC' },
        });
    }

    /**
     * Récupérer toutes les permissions effectives d'un utilisateur (rôles + custom)
     */
    async getEffectivePermissions(utilisateurId: string): Promise<string[]> {
        const permissions = await permissionResolverService.resolvePermissions(utilisateurId);
        return Array.from(permissions);
    }

    /**
     * Vérifier si un utilisateur a une permission spécifique
     */
    async hasPermission(utilisateurId: string, permission: string): Promise<boolean> {
        return permissionResolverService.hasPermission(utilisateurId, permission);
    }

    /**
     * Remplacer tous les rôles d'un utilisateur
     */
    async replaceUserRoles(
        utilisateurId: string,
        roleIds: string[],
        primaryRoleId?: string,
        updatedBy?: string
    ): Promise<UtilisateurRole[]> {
        // Vérifier que l'utilisateur existe
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id: utilisateurId } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Vérifier que tous les rôles existent
        const roles = await this.roleRepo.find({ where: { id: In(roleIds) } });
        if (roles.length !== roleIds.length) {
            throw new AppError('Un ou plusieurs rôles sont introuvables', 404, 'ROLES_NOT_FOUND');
        }

        // Supprimer les anciens rôles
        await this.utilisateurRoleRepo.delete({ utilisateurId });

        // Assigner les nouveaux rôles
        const utilisateurRoles: UtilisateurRole[] = [];

        for (const roleId of roleIds) {
            const role = roles.find(r => r.id === roleId);
            if (!role) continue;

            const utilisateurRole = this.utilisateurRoleRepo.create({
                utilisateurId,
                roleId,
                estPrincipal: roleId === primaryRoleId || roleIds.indexOf(roleId) === 0,
                attribuePar: updatedBy,
                dateAttribution: new Date(),
            });

            utilisateurRoles.push(utilisateurRole);
        }

        await this.utilisateurRoleRepo.save(utilisateurRoles);

        // Mettre à jour le rôle principal dans utilisateur
        const primaryRole = primaryRoleId ? roles.find(r => r.id === primaryRoleId) : roles[0];
        if (primaryRole) {
            utilisateur.role = primaryRole.code as unknown as RoleEnum;
            await this.utilisateurRepo.save(utilisateur);
        }

        logger.info(`Rôles remplacés pour l'utilisateur ${utilisateur.email} par ${updatedBy}`);

        // Invalider le cache de l'utilisateur
        await permissionResolverService.invalidateUserCache(utilisateurId);

        return utilisateurRoles;
    }
}

export const userRolesService = new UserRolesService();
export default UserRolesService;
