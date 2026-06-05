/**
 * ==================================
 * eLISAschool - Contrôleur des rôles et permissions des utilisateurs
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * API pour gérer les rôles et permissions au niveau utilisateur
 */

import { Router, Request, Response, NextFunction } from 'express';
import { userRolesService } from '../services/user-roles.service';
import { requireRoles } from '@modules/auth/middlewares/role.middleware';
import { authMiddleware } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { assignRoleToUserSchema, assignPermissionToUserSchema } from '../dto/create-role.dto';
import { successResponse } from '@common/utils/api-response.util';

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

/**
 * @route   GET /api/rbac/users/:userId/roles
 * @desc    Récupérer tous les rôles d'un utilisateur
 * @access  ADMIN
 */
router.get('/users/:userId/roles', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = await userRolesService.getUserRoles(req.params.userId);
        successResponse(res, roles, 'Rôles de l\'utilisateur récupérés avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/rbac/users/:userId/roles
 * @desc    Assigner un rôle à un utilisateur
 * @access  ADMIN
 */
router.post('/users/:userId/roles', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(assignRoleToUserSchema, req.body);

        const utilisateurRole = await userRolesService.assignRoleToUser(
            req.params.userId,
            dto,
            req.utilisateur?.id
        );

        successResponse(res, utilisateurRole, 'Rôle assigné à l\'utilisateur avec succès', 201);
    } catch (error) {
        next(error);
    }
});

/**
 * @route   DELETE /api/rbac/users/:userId/roles/:roleId
 * @desc    Retirer un rôle à un utilisateur
 * @access  ADMIN
 */
router.delete('/users/:userId/roles/:roleId', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userRolesService.removeRoleFromUser(
            req.params.userId,
            req.params.roleId,
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
router.get('/users/:userId/permissions', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
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
router.get('/users/:userId/permissions/effective', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await userRolesService.getEffectivePermissions(req.params.userId);
        successResponse(res, permissions, 'Permissions effectives récupérées avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/rbac/users/:userId/permissions
 * @desc    Assigner une permission personnalisée à un utilisateur
 * @access  ADMIN
 */
router.post('/users/:userId/permissions', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
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
router.delete('/users/:userId/permissions/:permissionId', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
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
router.get('/users/:userId/permissions/check/:permissionCode', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
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
 * @desc    Remplacer tous les rôles d'un utilisateur
 * @access  ADMIN
 */
router.put('/users/:userId/roles/replace', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { roleIds, primaryRoleId } = req.body;

        if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
            throw new Error('Le tableau roleIds est requis et ne peut pas être vide');
        }

        const utilisateurRoles = await userRolesService.replaceUserRoles(
            req.params.userId,
            roleIds,
            primaryRoleId,
            req.utilisateur?.id
        );

        successResponse(res, utilisateurRoles, 'Rôles remplacés avec succès');
    } catch (error) {
        next(error);
    }
});

export default router;
