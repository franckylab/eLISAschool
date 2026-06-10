/**
 * ==================================
 * eLISAschool - Controller Type Contrat Personnalisé
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { typeContratService } from '../services/type-contrat.service';
import { createTypeContratSchema, updateTypeContratSchema, queryTypeContratSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();

/**
 * POST /api/personnel/types-contrat
 * Créer un nouveau type de contrat personnalisé
 */
router.post(
    '/',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createTypeContratSchema, req.body);
            const typeContrat = await typeContratService.create(dto, req.etablissementId!, req.utilisateur?.id, req);
            res.status(201).json({ success: true, data: typeContrat });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/types-contrat
 * Lister les types de contrat avec pagination
 */
router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryTypeContratSchema, req.query);
            const result = await typeContratService.findAll(query, req.etablissementId!);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/types-contrat/actifs
 * Récupérer tous les types actifs (sans pagination)
 */
router.get(
    '/actifs',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const types = await typeContratService.getTypesActifs(req.etablissementId!);
            res.json({ success: true, data: types });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/types-contrat/:id
 * Récupérer un type de contrat par ID
 */
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const typeContrat = await typeContratService.findOne(req.params.id, req.etablissementId!);
            res.json({ success: true, data: typeContrat });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/personnel/types-contrat/:id
 * Mettre à jour un type de contrat
 */
router.patch(
    '/:id',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateTypeContratSchema, req.body);
            const typeContrat = await typeContratService.update(
                req.params.id,
                dto,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: typeContrat });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/personnel/types-contrat/:id
 * Supprimer un type de contrat
 */
router.delete(
    '/:id',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await typeContratService.delete(req.params.id, req.utilisateur?.id!, req.etablissementId!, req);
            res.json({ success: true, message: 'Type de contrat supprimé' });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/personnel/types-contrat/:id/toggle
 * Activer/désactiver un type de contrat
 */
router.post(
    '/:id/toggle',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const typeContrat = await typeContratService.toggleActif(
                req.params.id,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: typeContrat });
        } catch (error) {
            next(error);
        }
    }
);

export const typeContratController = router;
export default router;
