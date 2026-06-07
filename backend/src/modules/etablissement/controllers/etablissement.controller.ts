/**
 * ==================================
 * eLISAschool - Controller Etablissement (multi-établissements)
 * ==================================
 * Version: 2.0.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { EtablissementService } from '../services';
import {
    createEtablissementSchema,
    updateEtablissementSchema,
    updateEtablissementConfigSchema,
} from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const etablissementService = new EtablissementService();

// ==================================
// CRUD Établissements
// ==================================

/**
 * GET /api/etablissements
 * Liste tous les établissements (SUPER_ADMIN uniquement)
 */
router.get(
    '/',
    authMiddleware,
    requireRoles(Role.SUPER_ADMIN),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissements = await etablissementService.findAll();
            res.json({ success: true, data: etablissements });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id
 * Retourne un établissement spécifique
 */
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.findOne(req.params.id);
            res.json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements
 * Crée un nouvel établissement (SUPER_ADMIN uniquement)
 */
router.post(
    '/',
    authMiddleware,
    requireRoles(Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createEtablissementSchema, req.body);
            const etablissement = await etablissementService.create(dto);
            res.status(201).json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id
 * Met à jour un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id',
    authMiddleware,
    requireRoles(Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateEtablissementSchema, req.body);
            const etablissement = await etablissementService.update(req.params.id, dto);
            res.json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/desactiver
 * Désactive un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id/desactiver',
    authMiddleware,
    requireRoles(Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.desactiver(req.params.id);
            res.json({ success: true, data: etablissement, message: 'Établissement désactivé' });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/activer
 * Réactive un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id/activer',
    authMiddleware,
    requireRoles(Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.activer(req.params.id);
            res.json({ success: true, data: etablissement, message: 'Établissement réactivé' });
        } catch (error) { next(error); }
    }
);

// ==================================
// Configuration par établissement
// ==================================

/**
 * GET /api/etablissements/:id/config
 * Retourne la configuration d'un établissement
 */
router.get(
    '/:id/config',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const config = await etablissementService.getConfig(req.params.id);
            res.json({ success: true, data: config });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/config
 * Met à jour la configuration d'un établissement (ADMIN, SUPER_ADMIN)
 */
router.patch(
    '/:id/config',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateEtablissementConfigSchema, req.body);
            const config = await etablissementService.updateConfig(req.params.id, dto);
            res.json({ success: true, data: config });
        } catch (error) { next(error); }
    }
);

export const etablissementController = router;
export default router;
