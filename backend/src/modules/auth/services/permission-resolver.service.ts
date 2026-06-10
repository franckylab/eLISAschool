/**
 * ==================================
 * eLISAschool - Service de Résolution des Permissions
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Résout les permissions effectives d'un utilisateur en combinant :
 * - Permissions du rôle principal
 * - Permissions des rôles secondaires
 * - Permissions héritées (rôles parents)
 * - Permissions personnalisées (GRANTED/DENIED)
 * 
 * Avec cache in-memory pour optimiser les performances
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import Role from '@modules/auth/entities/role.entity';
import Permission from '@modules/auth/entities/permission.entity';
import UtilisateurRole from '@modules/auth/entities/utilisateur-role.entity';
import UtilisateurPermission, { TypePermission } from '@modules/auth/entities/utilisateur-permission.entity';
import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';

/**
 * Interface pour le cache de permissions
 */
interface PermissionCacheEntry {
    permissions: Set<string>;
    timestamp: number;
}

/**
 * Service de résolution des permissions avec cache
 */
export class PermissionResolverService {
    private roleRepo: Repository<Role>;
    private permissionRepo: Repository<Permission>;
    private utilisateurRoleRepo: Repository<UtilisateurRole>;
    private utilisateurPermissionRepo: Repository<UtilisateurPermission>;

    // Cache in-memory
    private userPermissionCache: Map<string, PermissionCacheEntry> = new Map();
    private globalPermissionCache: Map<string, Permission> = new Map();
    
    // TTL du cache : 5 minutes
    private readonly CACHE_TTL = 5 * 60 * 1000;

    constructor() {
        this.roleRepo = AppDataSource.getRepository(Role);
        this.permissionRepo = AppDataSource.getRepository(Permission);
        this.utilisateurRoleRepo = AppDataSource.getRepository(UtilisateurRole);
        this.utilisateurPermissionRepo = AppDataSource.getRepository(UtilisateurPermission);

        // NOTE: preloadGlobalPermissions() est appelé séparément après la connexion DB
        // pour éviter l'erreur "No metadata for Permission was found"
    }

    /**
     * Précharge toutes les permissions actives en mémoire
     * Doit être appelée APRÈS la connexion à la base de données
     */
    async preloadGlobalPermissions(): Promise<void> {
        try {
            const permissions = await this.permissionRepo.find({ where: { actif: true } });
            for (const perm of permissions) {
                this.globalPermissionCache.set(perm.code, perm);
            }
            logger.info(`🔐 Cache global préchargé: ${this.globalPermissionCache.size} permissions`);
        } catch (error) {
            logger.error('Erreur lors du préchargement des permissions:', error);
        }
    }

    /**
     * Résout toutes les permissions effectives d'un utilisateur
     * @param utilisateurId - ID de l'utilisateur
     * @returns Set de codes de permissions
     */
    async resolvePermissions(utilisateurId: string): Promise<Set<string>> {
        // 1. Vérifier le cache Redis (distribué)
        const redisCacheKey = `permissions:${utilisateurId}`;
        const cachedRedis = await redisService.get<string>(redisCacheKey);
        
        if (cachedRedis) {
            try {
                const permissionsArray = JSON.parse(cachedRedis) as string[];
                return new Set(permissionsArray);
            } catch {
                // Cache corrompu, on continue
            }
        }

        // 2. Vérifier le cache in-memory (local)
        const cached = this.getFromCache(utilisateurId);
        if (cached) {
            return cached;
        }

        try {
            // 1. Charger les rôles de l'utilisateur (principal + secondaires)
            const utilisateurRoles = await this.utilisateurRoleRepo.find({
                where: { utilisateurId },
                relations: ['role'],
            });

            if (utilisateurRoles.length === 0) {
                // Utilisateur sans rôles → permissions vides
                const emptySet = new Set<string>();
                this.setToCache(utilisateurId, emptySet);
                return emptySet;
            }

            // 2. Collecter toutes les permissions des rôles
            const allPermissions = new Set<string>();

            for (const ur of utilisateurRoles) {
                const role = ur.role;
                
                // Charger les permissions du rôle
                await this.loadRolePermissionsRecursive(role, allPermissions);
            }

            // 3. Appliquer les permissions personnalisées de l'utilisateur
            const userPermissions = await this.utilisateurPermissionRepo.find({
                where: { utilisateurId },
                relations: ['permission'],
            });

            for (const up of userPermissions) {
                if (up.type === TypePermission.GRANTED) {
                    // Ajouter la permission
                    allPermissions.add(up.permission.code);
                } else if (up.type === TypePermission.DENIED) {
                    // Retirer la permission (override)
                    allPermissions.delete(up.permission.code);
                }
            }

            // 4. Cacher le résultat
            this.setToCache(utilisateurId, allPermissions);

            logger.debug(`🔐 Permissions résolues pour utilisateur ${utilisateurId}: ${allPermissions.size} permissions`);

            return allPermissions;
        } catch (error) {
            logger.error(`Erreur lors de la résolution des permissions pour ${utilisateurId}:`, error);
            // En cas d'erreur, retourner un set vide (sécuritaire)
            return new Set<string>();
        }
    }

    /**
     * Charge récursivement les permissions d'un rôle et de ses parents
     */
    private async loadRolePermissionsRecursive(role: Role, permissions: Set<string>, visited: Set<string> = new Set()): Promise<void> {
        // Éviter les cycles d'héritage
        if (visited.has(role.id)) {
            return;
        }
        visited.add(role.id);

        // Charger les permissions directes du rôle
        if (!role.permissions || role.permissions.length === 0) {
            // Charger depuis la base si pas encore chargé
            const roleWithPerms = await this.roleRepo.findOne({
                where: { id: role.id },
                relations: ['permissions'],
            });

            if (roleWithPerms && roleWithPerms.permissions) {
                for (const perm of roleWithPerms.permissions) {
                    if (perm.actif) {
                        permissions.add(perm.code);
                    }
                }
            }
        } else {
            // Permissions déjà chargées
            for (const perm of role.permissions) {
                if (perm.actif) {
                    permissions.add(perm.code);
                }
            }
        }

        // Charger récursivement les permissions du rôle parent (héritage)
        if (role.parentId) {
            const parentRole = await this.roleRepo.findOne({
                where: { id: role.parentId },
                relations: ['permissions'],
            });

            if (parentRole) {
                await this.loadRolePermissionsRecursive(parentRole, permissions, visited);
            }
        }
    }

    /**
     * Vérifie si un utilisateur a une permission spécifique
     */
    async hasPermission(utilisateurId: string, permissionCode: string): Promise<boolean> {
        const permissions = await this.resolvePermissions(utilisateurId);
        return permissions.has(permissionCode);
    }

    /**
     * Vérifie si un utilisateur a au moins une des permissions requises
     */
    async hasAnyPermission(utilisateurId: string, permissionCodes: string[]): Promise<boolean> {
        const permissions = await this.resolvePermissions(utilisateurId);
        return permissionCodes.some(code => permissions.has(code));
    }

    /**
     * Vérifie si un utilisateur a toutes les permissions requises
     */
    async hasAllPermissions(utilisateurId: string, permissionCodes: string[]): Promise<boolean> {
        const permissions = await this.resolvePermissions(utilisateurId);
        return permissionCodes.every(code => permissions.has(code));
    }

    /**
     * Récupère les rôles d'un utilisateur avec leurs codes
     */
    async getUserRoles(utilisateurId: string): Promise<Array<{ code: string; libelle: string; estPrincipal: boolean }>> {
        const utilisateurRoles = await this.utilisateurRoleRepo.find({
            where: { utilisateurId },
            relations: ['role'],
        });

        return utilisateurRoles.map(ur => ({
            code: ur.role.code,
            libelle: ur.role.libelle,
            estPrincipal: ur.estPrincipal,
        }));
    }

    /**
     * Invalide le cache pour un utilisateur spécifique
     * À appeler après modification des rôles/permissions de l'utilisateur
     */
    invalidateCache(utilisateurId: string): void {
        this.userPermissionCache.delete(utilisateurId);
        
        // Invalider aussi le cache Redis
        redisService.delete(`permissions:${utilisateurId}`).catch(err => {
            logger.error('[PermissionResolver] Erreur invalidation Redis', err);
        });
        
        logger.debug(`🔐 Cache invalidé pour utilisateur ${utilisateurId}`);
    }

    /**
     * Invalide le cache pour un utilisateur spécifique (alias)
     */
    invalidateUserCache(utilisateurId: string): void {
        this.invalidateCache(utilisateurId);
    }

    /**
     * Invalide le cache pour TOUS les utilisateurs ayant un rôle spécifique
     * À appeler après modification des permissions d'un rôle
     */
    async invalidateCacheForRole(roleId: string): Promise<void> {
        // Trouver tous les utilisateurs avec ce rôle
        const utilisateurRoles = await this.utilisateurRoleRepo.find({
            where: { roleId },
            select: ['utilisateurId'],
        });

        for (const ur of utilisateurRoles) {
            this.userPermissionCache.delete(ur.utilisateurId);
            
            // Invalider aussi le cache Redis
            await redisService.delete(`permissions:${ur.utilisateurId}`).catch(err => {
                logger.error('[PermissionResolver] Erreur invalidation Redis', err);
            });
        }

        logger.debug(`🔐 Cache invalidé pour ${utilisateurRoles.length} utilisateurs ayant le rôle ${roleId}`);
    }

    /**
     * Invalide tout le cache (après modification majeure)
     */
    invalidateAllCache(): void {
        this.userPermissionCache.clear();
        
        // Invalider aussi tout le cache Redis des permissions
        redisService.deleteByPattern('permissions:*').catch(err => {
            logger.error('[PermissionResolver] Erreur invalidation Redis globale', err);
        });
        
        logger.info('🔐 Cache des permissions complètement invalidé (in-memory + Redis)');
    }

    /**
     * Recharge le cache global des permissions
     */
    async refreshGlobalPermissions(): Promise<void> {
        this.globalPermissionCache.clear();
        await this.preloadGlobalPermissions();
    }

    /**
     * Récupère une permission depuis le cache global
     */
    getPermissionByCode(code: string): Permission | undefined {
        return this.globalPermissionCache.get(code);
    }

    /**
     * Récupère toutes les permissions depuis le cache global
     */
    getAllPermissions(): Permission[] {
        return Array.from(this.globalPermissionCache.values());
    }

    // ==================================
    // Méthodes de cache
    // ==================================

    private getFromCache(utilisateurId: string): Set<string> | null {
        const entry = this.userPermissionCache.get(utilisateurId);
        
        if (!entry) {
            return null;
        }

        // Vérifier l'expiration du cache
        const now = Date.now();
        if (now - entry.timestamp > this.CACHE_TTL) {
            this.userPermissionCache.delete(utilisateurId);
            return null;
        }

        return entry.permissions;
    }

    private setToCache(utilisateurId: string, permissions: Set<string>): void {
        this.userPermissionCache.set(utilisateurId, {
            permissions: new Set(permissions), // Clone pour éviter les mutations
            timestamp: Date.now(),
        });
    }

    /**
     * Statistiques du cache (pour debugging/monitoring)
     */
    getCacheStats(): { userCacheSize: number; globalCacheSize: number; ttl: number } {
        return {
            userCacheSize: this.userPermissionCache.size,
            globalCacheSize: this.globalPermissionCache.size,
            ttl: this.CACHE_TTL,
        };
    }
}

// Instance singleton
export const permissionResolverService = new PermissionResolverService();
export default PermissionResolverService;
