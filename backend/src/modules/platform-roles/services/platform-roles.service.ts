/**
 * ==================================
 * eLISAschool - Service Role Builder
 * ==================================
 * Gestion des rôles plateforme (défaut + personnalisés).
 *
 * Règles :
 * - Rôles système (estSysteme=true) non supprimables/modifiables
 * - Permissions granulaires par module
 * - Scope global ou par groupe
 *
 * V2.3 — Panel Admin Enterprise
 */

import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { Role } from '@modules/auth/entities/role.entity';
import { Permission } from '@modules/auth/entities/permission.entity';
import type { CreerRoleDto, ModifierRoleDto } from '../dto/platform-roles.dto';

const permissionRepo = AppDataSource.getRepository(Permission);

export class PlatformRolesService {
    private repo = AppDataSource.getRepository(Role);

    // =============================================
    // LISTE
    // =============================================

    async getListeRoles() {
        const roles = await this.repo.find({
            relations: ['permissions'],
            order: { estSysteme: 'DESC', libelle: 'ASC' },
        });

        return roles.map(r => this.mapRole(r));
    }

    // =============================================
    // DÉTAIL
    // =============================================

    async getDetailRole(id: string) {
        const role = await this.repo.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }
        return this.mapRole(role);
    }

    // =============================================
    // CRÉATION
    // =============================================

    async creerRole(dto: CreerRoleDto) {
        // Générer un code unique à partir du nom
        const code = dto.nom.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

        // Vérifier unicité du code
        const existing = await this.repo.findOne({ where: { code } });
        if (existing) {
            throw new AppError('Un rôle avec ce nom existe déjà', 409, 'ROLE_NAME_EXISTS');
        }

        // Résoudre les permissions depuis leurs codes
        const permissions = await this.resoudrePermissions(dto.permissions);

        const role = this.repo.create({
            code,
            libelle: dto.nom,
            description: dto.description || null,
            estSysteme: false,
            permissions,
        });

        const saved = await this.repo.save(role);
        return this.mapRole(saved);
    }

    // =============================================
    // MODIFICATION
    // =============================================

    async modifierRole(id: string, dto: ModifierRoleDto) {
        const role = await this.repo.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        if (role.estSysteme) {
            throw new AppError(
                'Impossible de modifier un rôle système',
                403,
                'SYSTEM_ROLE_IMMUTABLE',
            );
        }

        if (dto.nom !== undefined) role.libelle = dto.nom;
        if (dto.description !== undefined) role.description = dto.description;
        if (dto.permissions !== undefined) {
            role.permissions = await this.resoudrePermissions(dto.permissions);
        }

        const saved = await this.repo.save(role);
        return this.mapRole(saved);
    }

    // =============================================
    // SUPPRESSION
    // =============================================

    async supprimerRole(id: string) {
        const role = await this.repo.findOne({ where: { id } });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        if (role.estSysteme) {
            throw new AppError(
                'Impossible de supprimer un rôle système',
                403,
                'SYSTEM_ROLE_IMMUTABLE',
            );
        }

        await this.repo.remove(role);
        return { success: true, message: 'Rôle supprimé' };
    }

    // =============================================
    // PERMISSIONS DÉTAIL
    // =============================================

    async getPermissions(id: string) {
        const role = await this.repo.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        return {
            roleId: role.id,
            nom: role.libelle,
            permissions: role.permissions.map(p => p.code),
        };
    }

    // =============================================
    // MATRICE PERMISSIONS (tous les modules)
    // =============================================

    async getMatricePermissions() {
        const roles = await this.repo.find({
            where: { estSysteme: true },
            relations: ['permissions'],
        });

        const modules = [
            { module: 'administration', label: 'Administration', actions: ['create', 'read', 'update', 'delete'] },
            { module: 'securite', label: 'Sécurité', actions: ['create', 'read', 'update', 'delete'] },
            { module: 'support', label: 'Support', actions: ['create', 'read', 'update', 'delete'] },
            { module: 'commercial', label: 'Commercial', actions: ['create', 'read', 'update', 'delete'] },
            { module: 'monitoring', label: 'Monitoring', actions: ['read'] },
            { module: 'audit', label: 'Audit', actions: ['read'] },
            { module: 'roles', label: 'Rôles', actions: ['manage'] },
        ];

        return {
            modules,
            roles: roles.map(r => ({
                id: r.id,
                nom: r.libelle,
                permissions: r.permissions.map(p => p.code),
                estSysteme: r.estSysteme,
            })),
        };
    }

    // =============================================
    // UTILITAIRES
    // =============================================

    private mapRole(role: Role) {
        return {
            id: role.id,
            nom: role.libelle,
            description: role.description || null,
            estSysteme: role.estSysteme,
            permissions: role.permissions ? role.permissions.map(p => p.code) : [],
            etablissementId: role.etablissementId || null,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    }

    /**
     * Résout un tableau de codes permission en entités Permission.
     * Les codes inconnus sont ignorés silencieusement.
     */
    private async resoudrePermissions(codes: string[]): Promise<Permission[]> {
        if (codes.length === 0) return [];
        const permissions = await permissionRepo
            .createQueryBuilder('p')
            .where('p.code IN (:...codes)', { codes })
            .getMany();
        return permissions;
    }
}

export const platformRolesService = new PlatformRolesService();
