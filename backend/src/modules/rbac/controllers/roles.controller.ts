/**
 * ==================================
 * eLISAschool - Contrôleur des rôles
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * API pour la gestion des rôles RBAC
 */

import { Router, Request, Response, NextFunction } from 'express';
import { rolesService } from '../services/roles.service';
import { requireRoles } from '@modules/auth/middlewares/role.middleware';
import { authMiddleware } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { createRoleSchema, assignPermissionsToRoleSchema } from '../dto/create-role.dto';
import { successResponse } from '@common/utils/api-response.util';
import RoleEntity from '@modules/auth/entities/role.entity';

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

/**
 * @route   GET /api/rbac/roles
 * @desc    Récupérer tous les rôles
 * @access  ADMIN
 */
router.get('/roles', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { estSysteme, etablissementId } = req.query;

        const filters: any = {};
        if (estSysteme) filters.estSysteme = estSysteme === 'true';
        if (etablissementId) filters.etablissementId = etablissementId as string;

        const roles = await rolesService.findAllRoles(filters);

        successResponse(res, roles, 'Rôles récupérés avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/roles/:id
 * @desc    Récupérer un rôle par ID
 * @access  ADMIN
 */
router.get('/roles/:id', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = await rolesService.findRoleById(req.params.id);
        successResponse(res, role, 'Rôle récupéré avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/rbac/roles
 * @desc    Créer un nouveau rôle
 * @access  ADMIN
 */
router.post('/roles', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createRoleSchema, req.body);

        const role = await rolesService.createRole(dto, req.utilisateur?.id);

        successResponse(res, role, 'Rôle créé avec succès', 201);
    } catch (error) {
        next(error);
    }
});

/**
 * @route   PATCH /api/rbac/roles/:id
 * @desc    Mettre à jour un rôle
 * @access  ADMIN
 */
router.patch('/roles/:id', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createRoleSchema.partial(), req.body);

        const role = await rolesService.updateRole(req.params.id, dto, req.utilisateur?.id);

        successResponse(res, role, 'Rôle mis à jour avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   DELETE /api/rbac/roles/:id
 * @desc    Supprimer un rôle
 * @access  ADMIN
 */
router.delete('/roles/:id', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await rolesService.deleteRole(req.params.id, req.utilisateur?.id);

        successResponse(res, null, 'Rôle supprimé avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/rbac/roles/:id/permissions
 * @desc    Assigner des permissions à un rôle
 * @access  ADMIN
 */
router.post('/roles/:id/permissions', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(assignPermissionsToRoleSchema, req.body);

        const role = await rolesService.assignPermissionsToRole(req.params.id, dto, req.utilisateur?.id);

        successResponse(res, role, 'Permissions assignées au rôle avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/roles/:id/permissions
 * @desc    Récupérer les permissions d'un rôle
 * @access  ADMIN
 */
router.get('/roles/:id/permissions', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await rolesService.getRolePermissions(req.params.id);

        successResponse(res, permissions, 'Permissions du rôle récupérées avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/roles/:id/users
 * @desc    Lister les utilisateurs ayant un rôle
 * @access  ADMIN
 */
router.get('/roles/:id/users', requireRoles('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await rolesService.getUsersWithRole(req.params.id);

        successResponse(res, users, 'Utilisateurs avec ce rôle récupérés avec succès');
    } catch (error) {
        next(error);
    }
});

export default router;
