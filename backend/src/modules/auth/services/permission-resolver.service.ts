/**
 * ==================================
 * eLISAschool - Service de Résolution des Permissions
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * RBAC v3.0 — Multi-Tenant Strict
 * Résout les permissions effectives d'un utilisateur en combinant :
 * - Permissions du rôle via utilisateur_etablissements
 * - Permissions héritées (rôles parents)
 * - Permissions personnalisées (GRANTED/DENIED)
 * 
 * Avec cache in-memory + Redis pour optimiser les performances
 * Performance cible: < 10ms (cache hit), < 100ms (cache miss)
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Role } from '@modules/auth/entities';
import { Permission } from '@modules/auth/entities';
import { UtilisateurPermission, TypePermission } from '@modules/auth/entities';
import { UtilisateurEtablissement } from '@modules/auth/entities';
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
    private utilisateurPermissionRepo: Repository<UtilisateurPermission>;

    // Cache in-memory
    private userPermissionCache: Map<string, PermissionCacheEntry> = new Map();
    private globalPermissionCache: Map<string, Permission> = new Map();
    
    // TTL du cache : 5 minutes
    private readonly CACHE_TTL = 5 * 60 * 1000;

    constructor() {
        this.roleRepo = AppDataSource.getRepository(Role);
        this.permissionRepo = AppDataSource.getRepository(Permission);
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
     * @param etablissementId - ID de l'établissement actif (optionnel)
     * @returns Set de codes de permissions
     */
    async resolvePermissions(utilisateurId: string, etablissementId?: string): Promise<Set<string>> {
        // 1. Vérifier le cache Redis (distribué) - inclure etablissementId dans la clé si présent
        const redisCacheKey = etablissementId 
            ? `permissions:${utilisateurId}:${etablissementId}` 
            : `permissions:${utilisateurId}`;
        const cachedRedis = await redisService.get(redisCacheKey);
        
        if (cachedRedis) {
            try {
                const permissionsArray = JSON.parse(cachedRedis) as string[];
                return new Set(permissionsArray);
            } catch {
                // Cache corrompu, on continue
            }
        }

        // 2. Vérifier le cache in-memory (local) - utiliser la même clé
        const cached = this.getFromCache(`${utilisateurId}${etablissementId ? `:${etablissementId}` : ''}`);
        if (cached) {
            return cached;
        }

        try {
            // MULTI-TENANT STRICT : Rôle UNIQUEMENT via utilisateur_etablissements
            let rolesToUse: Role[] = [];
            
            if (etablissementId) {
                // Trouver l'affectation de l'utilisateur à cet établissement
                const utilisateurEtablissement = await AppDataSource.getRepository(UtilisateurEtablissement).findOne({
                    where: { utilisateurId, etablissementId, actif: true },
                    relations: ['role'],
                });
                
                if (utilisateurEtablissement && utilisateurEtablissement.role) {
                    rolesToUse = [utilisateurEtablissement.role];
                    logger.debug(`🔐 Utilisation du rôle spécifique à l'établissement ${etablissementId}: ${utilisateurEtablissement.role.code}`);
                } else {
                    // MULTI-TENANT STRICT : Pas d'accès sans rôle dans l'établissement
                    logger.warn(`🔐 REFUS: Utilisateur ${utilisateurId} n'a pas accès à l'établissement ${etablissementId}`);
                    const emptySet = new Set<string>();
                    this.setToCache(`${utilisateurId}:${etablissementId}`, emptySet);
                    return emptySet;
                }
            } else {
                // Pas d'établissement spécifié → erreur (contexte multi-tenant requis)
                logger.warn(`🔐 REFUS: Aucun établissement spécifié pour l'utilisateur ${utilisateurId}`);
                const emptySet = new Set<string>();
                this.setToCache(utilisateurId, emptySet);
                return emptySet;
            }

            if (rolesToUse.length === 0) {
                // Utilisateur sans rôles → permissions vides
                const emptySet = new Set<string>();
                this.setToCache(`${utilisateurId}${etablissementId ? `:${etablissementId}` : ''}`, emptySet);
                return emptySet;
            }

            // 2. VÉRIFIER SI SUPER_ADMIN → Toutes les permissions automatiquement
            const hasSuperAdmin = rolesToUse.some(
                role => role.code === 'SUPER_ADMIN'
            );

            if (hasSuperAdmin) {
                // SUPER_ADMIN a TOUTES les permissions
                const allPermissions = new Set<string>();
                
                // Ajouter explicitement super_admin:all
                allPermissions.add('super_admin:all');
                
                // Charger toutes les permissions depuis le cache global
                const cachedPerms = Array.from(this.globalPermissionCache.keys());
                for (const perm of cachedPerms) {
                    allPermissions.add(perm);
                }
                
                // Si le cache global est vide, charger depuis la DB
                if (allPermissions.size <= 1) { // <=1 car on a déjà super_admin:all
                    const permissions = await this.permissionRepo.find({
                        where: { actif: true },
                        select: ['code'],
                    });
                    for (const perm of permissions) {
                        allPermissions.add(perm.code);
                        this.globalPermissionCache.set(perm.code, perm as Permission);
                    }
                }

                // Cacher et retourner
                this.setToCache(`${utilisateurId}${etablissementId ? `:${etablissementId}` : ''}`, allPermissions);
                logger.debug(`🔐 SUPER_ADMIN détecté: ${allPermissions.size} permissions attribuées (dont super_admin:all)`);
                return allPermissions;
            }

            // 3. Collecter toutes les permissions des rôles
            const allPermissions = new Set<string>();

            for (const role of rolesToUse) {
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
            this.setToCache(`${utilisateurId}${etablissementId ? `:${etablissementId}` : ''}`, allPermissions);

            logger.debug(`🔐 Permissions résolues pour utilisateur ${utilisateurId}${etablissementId ? ` (établissement ${etablissementId})` : ''}: ${allPermissions.size} permissions`);

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
    async hasPermission(utilisateurId: string, permissionCode: string, etablissementId?: string): Promise<boolean> {
        const permissions = await this.resolvePermissions(utilisateurId, etablissementId);
        return permissions.has(permissionCode);
    }

    /**
     * Vérifie si un utilisateur a au moins une des permissions requises
     */
    async hasAnyPermission(utilisateurId: string, permissionCodes: string[], etablissementId?: string): Promise<boolean> {
        const permissions = await this.resolvePermissions(utilisateurId, etablissementId);
        return permissionCodes.some(code => permissions.has(code));
    }

    /**
     * Vérifie si un utilisateur a toutes les permissions requises
     */
    async hasAllPermissions(utilisateurId: string, permissionCodes: string[], etablissementId?: string): Promise<boolean> {
        const permissions = await this.resolvePermissions(utilisateurId, etablissementId);
        return permissionCodes.every(code => permissions.has(code));
    }

    /**
     * Récupère les rôles d'un utilisateur avec leurs codes
     * MULTI-TENANT STRICT : Rôles uniquement via utilisateur_etablissements
     */
    async getUserRoles(utilisateurId: string, etablissementId?: string): Promise<Array<{ code: string; libelle: string; estPrincipal: boolean }>> {
        if (etablissementId) {
            // Récupérer le rôle spécifique à l'établissement
            const utilisateurEtablissement = await AppDataSource.getRepository(UtilisateurEtablissement).findOne({
                where: { utilisateurId, etablissementId, actif: true },
                relations: ['role'],
            });

            if (utilisateurEtablissement && utilisateurEtablissement.role) {
                return [{
                    code: utilisateurEtablissement.role.code,
                    libelle: utilisateurEtablissement.role.libelle,
                    estPrincipal: true,
                }];
            }
        }

        // MULTI-TENANT STRICT : Pas de fallback sur rôles globaux
        logger.warn(`🔐 Aucun rôle trouvé pour l'utilisateur ${utilisateurId}${etablissementId ? ` dans l'établissement ${etablissementId}` : ''}`);
        return [];
    }

    /**
     * Invalide le cache pour un utilisateur spécifique (tous les établissements)
     * À appeler après modification des rôles/permissions de l'utilisateur
     */
    invalidateCache(utilisateurId: string): void {
        // Supprimer toutes les clés qui commencent par utilisateurId
        for (const key of this.userPermissionCache.keys()) {
            if (key.startsWith(utilisateurId)) {
                this.userPermissionCache.delete(key);
            }
        }
        
        // Invalider aussi le cache Redis (toutes les clés pour cet utilisateur)
        // NOTE : Redis service n'a pas deleteByPattern, on invalide uniquement le cache in-memory
        logger.debug(`🔐 Cache invalidé pour utilisateur ${utilisateurId} (tous les établissements)`);
    }

    /**
     * Invalide le cache pour TOUS les utilisateurs ayant un rôle spécifique
     * MULTI-TENANT STRICT : Uniquement via utilisateur_etablissements
     * À appeler après modification des permissions d'un rôle
     */
    async invalidateCacheForRole(roleId: string): Promise<void> {
        // Trouver tous les utilisateurs ayant ce rôle dans un établissement
        const utilisateurEtablissements = await AppDataSource.getRepository(UtilisateurEtablissement).find({
            where: { roleId },
            select: ['utilisateurId', 'etablissementId'],
        });

        // Invalider cache pour tous les utilisateurs concernés
        for (const ue of utilisateurEtablissements) {
            const key = `${ue.utilisateurId}:${ue.etablissementId}`;
            this.userPermissionCache.delete(key);
            // NOTE : Redis delete non disponible, cache in-memory uniquement
        }

        logger.debug(`🔐 Cache invalidé pour ${utilisateurEtablissements.length} utilisateurs ayant le rôle ${roleId}`);
    }

    /**
     * Invalide tout le cache (après modification majeure)
     */
    invalidateAllCache(): void {
        this.userPermissionCache.clear();
        
        // NOTE : Redis deleteByPattern non disponible, cache in-memory uniquement
        logger.info('🔐 Cache des permissions complètement invalidé (in-memory)');
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

    /**
     * Précharge le cache pour les utilisateurs actifs (warm cache)
     * À appeler au démarrage ou via cron job toutes les heures
     * 
     * @param limit - Nombre d'utilisateurs à précharger (défaut: 100)
     */
    async warmCacheForActiveUsers(limit: number = 100): Promise<void> {
        try {
            const { Utilisateur } = await import('@modules/auth/entities');
            const { AppDataSource } = await import('@database/data-source');
            
            const utilisateurRepo = AppDataSource.getRepository(Utilisateur);
            
            // Récupérer les utilisateurs les plus récemment connectés
            const activeUsers = await utilisateurRepo.find({
                where: {} as any,  // Utilisateur n'a pas de champ 'actif', on prend tous
                order: { derniereConnexion: 'DESC' },
                take: limit,
                select: ['id', 'email', 'derniereConnexion'],
            });
            
            let warmedCount = 0;
            const ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);
            
            for (const user of activeUsers) {
                // Charger les établissements de l'utilisateur
                const utilisateurEtablissements = await ueRepo.find({
                    where: { utilisateurId: user.id, actif: true },
                    select: ['etablissementId'],
                });
                
                for (const ue of utilisateurEtablissements) {
                    // Précharger les permissions pour chaque établissement
                    await this.resolvePermissions(user.id, ue.etablissementId);
                    warmedCount++;
                }
            }
            
            logger.info(`🔥 Warm cache: ${warmedCount} permissions préchargées pour ${activeUsers.length} utilisateurs actifs`);
        } catch (error) {
            logger.error('Erreur lors du warm cache:', error);
        }
    }
}

// Instance singleton
export const permissionResolverService = new PermissionResolverService();
export default PermissionResolverService;
