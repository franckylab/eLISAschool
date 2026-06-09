/**
 * ==================================
 * eLISAschool - Service de gestion des permissions
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * CRUD pour les permissions
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import Permission from '@modules/auth/entities/permission.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Service de gestion des permissions
 */
export class PermissionsService {
    private permissionRepo: Repository<Permission>;

    constructor() {
        this.permissionRepo = AppDataSource.getRepository(Permission);
    }

    /**
     * Récupérer toutes les permissions
     */
    async findAll(filters?: { module?: string; actif?: boolean }): Promise<Permission[]> {
        const where: any = {};

        if (filters?.module) {
            where.module = filters.module;
        }

        if (filters?.actif !== undefined) {
            where.actif = filters.actif;
        }

        return this.permissionRepo.find({
            where,
            order: { module: 'ASC', action: 'ASC' },
        });
    }

    /**
     * Récupérer une permission par ID
     */
    async findById(id: string): Promise<Permission> {
        const permission = await this.permissionRepo.findOne({ where: { id } });

        if (!permission) {
            throw new AppError('Permission non trouvée', 404, 'PERMISSION_NOT_FOUND');
        }

        return permission;
    }

    /**
     * Récupérer une permission par code
     */
    async findByCode(code: string): Promise<Permission> {
        const permission = await this.permissionRepo.findOne({ where: { code } });

        if (!permission) {
            throw new AppError('Permission non trouvée', 404, 'PERMISSION_NOT_FOUND');
        }

        return permission;
    }

    /**
     * Créer une nouvelle permission
     */
    async createPermission(data: {
        code: string;
        libelle: string;
        module: string;
        action: string;
        description?: string;
    }): Promise<Permission> {
        // Vérifier si le code existe déjà
        const existing = await this.permissionRepo.findOne({ where: { code: data.code } });
        if (existing) {
            throw new AppError('Ce code de permission existe déjà', 409, 'PERMISSION_CODE_EXISTS');
        }

        const permission = this.permissionRepo.create({
            ...data,
            actif: true,
        });

        await this.permissionRepo.save(permission);

        logger.info(`Permission créée: ${permission.libelle} (${permission.code})`);

        // Recharger le cache global
        await this.refreshGlobalCache();

        return permission;
    }

    /**
     * Mettre à jour une permission
     */
    async updatePermission(id: string, updateDto: Partial<Permission>): Promise<Permission> {
        const permission = await this.findById(id);

        // Vérifier le code si modifié
        if (updateDto.code && updateDto.code !== permission.code) {
            const existing = await this.permissionRepo.findOne({ where: { code: updateDto.code } });
            if (existing) {
                throw new AppError('Ce code de permission existe déjà', 409, 'PERMISSION_CODE_EXISTS');
            }
            permission.code = updateDto.code;
        }

        if (updateDto.libelle) permission.libelle = updateDto.libelle;
        if (updateDto.description !== undefined) permission.description = updateDto.description;
        if (updateDto.actif !== undefined) permission.actif = updateDto.actif;

        await this.permissionRepo.save(permission);

        logger.info(`Permission modifiée: ${permission.libelle}`);

        // Invalider tout le cache (les permissions sont utilisées partout)
        await this.refreshGlobalCache();

        return permission;
    }

    /**
     * Supprimer une permission
     */
    async deletePermission(id: string): Promise<void> {
        const permission = await this.findById(id);

        await this.permissionRepo.remove(permission);

        logger.info(`Permission supprimée: ${permission.libelle}`);

        // Recharger le cache global
        await this.refreshGlobalCache();
    }

    /**
     * Recharger le cache global des permissions
     */
    private async refreshGlobalCache(): Promise<void> {
        // Le PermissionResolverService gère le cache
        // On pourrait l'importer et appeler refreshGlobalPermissions()
        // Mais pour éviter les dépendances circulaires, on laisse le cache se refresh automatiquement
        logger.debug('Cache des permissions à recharger');
    }

    /**
     * Regrouper les permissions par module
     */
    async groupByModule(): Promise<Record<string, Permission[]>> {
        const permissions = await this.findAll();
        const grouped: Record<string, Permission[]> = {};

        for (const perm of permissions) {
            if (!grouped[perm.module]) {
                grouped[perm.module] = [];
            }
            grouped[perm.module].push(perm);
        }

        return grouped;
    }
}

export const permissionsService = new PermissionsService();
export default PermissionsService;
