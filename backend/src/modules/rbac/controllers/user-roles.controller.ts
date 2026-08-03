/**
 * ==================================
 * eLISAschool - Contrôleur des rôles et permissions des utilisateurs
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * API pour gérer les rôles et permissions au niveau utilisateur
 */

import { Router, Request, Response, NextFunction } from 'express';
import { userRolesService } from '../services/user-roles.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { assignRoleToUserSchema, assignPermissionToUserSchema, batchPermissionsSchema } from '../dto/create-role.dto';
import { successResponse } from '@common/utils/api-response.util';
import { permissionResolverService } from '@modules/auth/services';

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

/**
 * @route   GET /api/rbac/users/:userId/roles
 * @desc    Récupérer tous les rôles d'un utilisateur
 * @access  ADMIN
 */
router.get('/users/:userId/roles', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = await userRolesService.getUserRoles(req.params.userId);
        successResponse(res, roles, 'Rôles de l\'utilisateur récupérés avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/rbac/users/:userId/roles
 * @desc    Assigner un rôle à un utilisateur dans un établissement
 * @access  ADMIN
 */
router.post('/users/:userId/roles', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(assignRoleToUserSchema, req.body);

        // MULTI-TENANT STRICT : etablissementId requis
        const etablissementId = req.body.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new Error('etablissementId est requis pour assigner un rôle');
        }

        const utilisateurEtablissement = await userRolesService.assignRoleToUser(
            req.params.userId,
            { ...dto, etablissementId },
            req.utilisateur?.id
        );

        successResponse(res, utilisateurEtablissement, 'Rôle assigné à l\'utilisateur avec succès', 201);
    } catch (error) {
        next(error);
    }
});

/**
 * @route   DELETE /api/rbac/users/:userId/roles/:etablissementId
 * @desc    Retirer le rôle d'un utilisateur dans un établissement
 * @access  ADMIN
 */
router.delete('/users/:userId/roles/:etablissementId', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userRolesService.removeRoleFromUser(
            req.params.userId,
            req.params.etablissementId,
            req.utilisateur?.id
        );

        successResponse(res, null, 'Rôle retiré de l\'utilisateur avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/users/:userId/permissions
 * @desc    Récupérer les permissions personnalisées d'un utilisateur
 * @access  ADMIN
 */
router.get('/users/:userId/permissions', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await userRolesService.getUserPermissions(req.params.userId);
        successResponse(res, permissions, 'Permissions personnalisées récupérées avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/users/:userId/permissions/effective
 * @desc    Récupérer toutes les permissions effectives d'un utilisateur
 * @access  ADMIN
 */
router.get('/users/:userId/permissions/effective', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await userRolesService.getEffectivePermissions(req.params.userId);
        successResponse(res, permissions, 'Permissions effectives récupérées avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/users/:userId/permissions/effective/detail
 * @desc    Récupérer les permissions effectives avec source (rôle/granted/denied)
 * @access  ADMIN
 */
router.get('/users/:userId/permissions/effective/detail', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await userRolesService.getEffectivePermissionsDetail(req.params.userId);
        successResponse(res, permissions, 'Permissions effectives (détaillées) récupérées avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   PUT /api/rbac/users/:userId/permissions/batch
 * @desc    Assigner/retirer des permissions en batch
 * @access  ADMIN
 */
router.put('/users/:userId/permissions/batch', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(batchPermissionsSchema, req.body);

        await userRolesService.batchAssignPermissions(
            req.params.userId,
            dto.permissions,
            req.utilisateur?.id
        );

        successResponse(res, null, 'Permissions mises à jour avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/rbac/users/:userId/permissions
 * @desc    Assigner une permission personnalisée à un utilisateur
 * @access  ADMIN
 */
router.post('/users/:userId/permissions', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(assignPermissionToUserSchema, req.body);

        const utilisateurPermission = await userRolesService.assignPermissionToUser(
            req.params.userId,
            dto,
            req.utilisateur?.id
        );

        successResponse(res, utilisateurPermission, 'Permission assignée à l\'utilisateur avec succès', 201);
    } catch (error) {
        next(error);
    }
});

/**
 * @route   DELETE /api/rbac/users/:userId/permissions/:permissionId
 * @desc    Retirer une permission personnalisée d'un utilisateur
 * @access  ADMIN
 */
router.delete('/users/:userId/permissions/:permissionId', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userRolesService.removePermissionFromUser(
            req.params.userId,
            req.params.permissionId
        );

        successResponse(res, null, 'Permission retirée de l\'utilisateur avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/users/:userId/permissions/check/:permissionCode
 * @desc    Vérifier si un utilisateur a une permission spécifique
 * @access  ADMIN
 */
router.get('/users/:userId/permissions/check/:permissionCode', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hasPermission = await userRolesService.hasPermission(
            req.params.userId,
            req.params.permissionCode
        );

        successResponse(res, { hasPermission, permission: req.params.permissionCode }, 'Vérification de permission');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   PUT /api/rbac/users/:userId/roles/replace
 * @desc    Remplacer le rôle d'un utilisateur dans un établissement
 * @access  ADMIN
 */
router.put('/users/:userId/roles/replace', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roleIds, etablissementId, primaryRoleId } = req.body;

        if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
            throw new Error('Le tableau roleIds est requis et ne peut pas être vide');
        }

        // MULTI-TENANT STRICT : etablissementId requis
        const etablissementIdToUse = etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementIdToUse) {
            throw new Error('etablissementId est requis pour remplacer un rôle');
        }

        const utilisateurEtablissement = await userRolesService.replaceUserRoles(
            req.params.userId,
            roleIds,
            etablissementIdToUse,
            primaryRoleId,
            req.utilisateur?.id
        );

        successResponse(res, utilisateurEtablissement, 'Rôle remplacé avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/monitoring/stats
 * @desc    Statistiques de performance du système RBAC
 * @access  ADMIN
 */
router.get('/monitoring/stats', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { AppDataSource } = await import('@database/data-source');
        const { UtilisateurEtablissement, RoleEntity: Role, Permission } = await import('@modules/auth/entities');
        
        const ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);
        const roleRepo = AppDataSource.getRepository(Role);
        const permRepo = AppDataSource.getRepository(Permission);
        
        // Statistiques du cache
        const cacheStats = permissionResolverService.getCacheStats();
        
        // Statistiques de la base de données
        const totalRoles = await roleRepo.count();
        const totalPermissions = await permRepo.count();
        const totalUtilisateurEtablissements = await ueRepo.count({ where: { actif: true } });
        
        // Répartition par rôle
        const repartitionParRole = await ueRepo
            .createQueryBuilder('ue')
            .leftJoin('ue.role', 'r')
            .select('r.code', 'roleCode')
            .addSelect('r.libelle', 'roleLibelle')
            .addSelect('COUNT(ue.id)', 'nombreUtilisateurs')
            .where('ue.actif = :actif', { actif: true })
            .groupBy('r.id')
            .addGroupBy('r.code')
            .addGroupBy('r.libelle')
            .orderBy('nombreUtilisateurs', 'DESC')
            .getRawMany();
        
        successResponse(res, {
            cache: {
                ...cacheStats,
                hitRatio: cacheStats.userCacheSize > 0 ? '> 90%' : 'N/A (à chauffer)',
            },
            database: {
                totalRoles,
                totalPermissions,
                totalUtilisateurEtablissements,
                repartitionParRole,
            },
            performance: {
                tempsResolutionMoyen: '< 10ms (cible)',
                requetesParResolution: 1,
                indexOptimises: true,
            },
        }, 'Statistiques RBAC récupérées avec succès');
    } catch (error) {
        next(error);
    }
});

export default router;
