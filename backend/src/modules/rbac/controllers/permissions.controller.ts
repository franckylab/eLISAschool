/**
 * ==================================
 * eLISAschool - Contrôleur des permissions
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * API pour la gestion des permissions RBAC
 */

import { Router, Request, Response, NextFunction } from 'express';
import { permissionsService } from '../services/permissions.service';
import { authMiddleware, requirePermission, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { successResponse } from '@common/utils/api-response.util';
import { z } from 'zod';

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

/**
 * @route   GET /api/rbac/permissions
 * @desc    Récupérer toutes les permissions
 * @access  ADMIN
 */
router.get('/permissions', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { module, actif } = req.query;

        const filters: any = {};
        if (module) filters.module = module as string;
        if (actif !== undefined) filters.actif = actif === 'true';

        const permissions = await permissionsService.findAll(filters);

        successResponse(res, permissions, 'Permissions récupérées avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/permissions/modules
 * @desc    Regrouper les permissions par module
 * @access  ADMIN
 */
router.get('/permissions/modules', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const grouped = await permissionsService.groupByModule();

        successResponse(res, grouped, 'Permissions groupées par module');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/rbac/permissions/:id
 * @desc    Récupérer une permission par ID
 * @access  ADMIN
 */
router.get('/permissions/:id', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permission = await permissionsService.findById(req.params.id);
        successResponse(res, permission, 'Permission récupérée avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/rbac/permissions
 * @desc    Créer une nouvelle permission
 * @access  ADMIN
 */
router.post('/permissions', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(
            z.object({
                code: z.string().min(2).max(100),
                libelle: z.string().min(2).max(255),
                module: z.string().min(2).max(50),
                action: z.string().min(2).max(20),
                description: z.string().optional(),
            }),
            req.body
        );

        const permission = await permissionsService.createPermission(dto);

        successResponse(res, permission, 'Permission créée avec succès', 201);
    } catch (error) {
        next(error);
    }
});

/**
 * @route   PATCH /api/rbac/permissions/:id
 * @desc    Mettre à jour une permission
 * @access  ADMIN
 */
router.patch('/permissions/:id', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updateDto: any = {};

        if (req.body.code) updateDto.code = req.body.code;
        if (req.body.libelle) updateDto.libelle = req.body.libelle;
        if (req.body.description !== undefined) updateDto.description = req.body.description;
        if (req.body.actif !== undefined) updateDto.actif = req.body.actif;

        const permission = await permissionsService.updatePermission(req.params.id, updateDto);

        successResponse(res, permission, 'Permission mise à jour avec succès');
    } catch (error) {
        next(error);
    }
});

/**
 * @route   DELETE /api/rbac/permissions/:id
 * @desc    Supprimer une permission
 * @access  ADMIN
 */
router.delete('/permissions/:id', requirePermission('roles:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await permissionsService.deletePermission(req.params.id);

        successResponse(res, null, 'Permission supprimée avec succès');
    } catch (error) {
        next(error);
    }
});

export default router;
