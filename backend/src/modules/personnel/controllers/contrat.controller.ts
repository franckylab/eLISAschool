/**
 * ==================================
 * eLISAschool - Controller Contrat Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ContratService } from '../services';
import { createContratSchema, updateContratSchema, queryContratSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new ContratService();

/**
 * POST /api/personnel/contrats
 * Créer un nouveau contrat
 */
router.post(
    '/',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createContratSchema, req.body);
            const contrat = await service.create(dto, req.etablissementId!, req.utilisateur?.id, req);
            res.status(201).json({ success: true, data: contrat });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/contrats
 * Lister tous les contrats avec pagination
 */
router.get(
    '/',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryContratSchema, req.query);
            const result = await service.findAll(query, req.etablissementId!);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/contrats/:id
 * Récupérer un contrat par son ID
 */
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const contrat = await service.findOne(req.params.id, req.etablissementId!);
            res.json({ success: true, data: contrat });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/contrats/membres/:id/historique
 * Récupérer l'historique des contrats d'un membre
 */
router.get(
    '/membres/:id/historique',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const historique = await service.getHistoriqueByMembre(req.params.id, req.etablissementId!);
            res.json({ success: true, data: historique });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/contrats/membres/:id/contrats/actif
 * Récupérer le contrat actif d'un membre
 */
router.get(
    '/membres/:id/contrats/actif',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const contrat = await service.getContratActif(req.params.id, req.etablissementId!);
            res.json({ success: true, data: contrat });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/personnel/contrats/:id
 * Mettre à jour un contrat
 */
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateContratSchema, req.body);
            const contrat = await service.update(
                req.params.id,
                dto,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: contrat });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/personnel/contrats/:id
 * Supprimer un contrat
 */
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await service.delete(req.params.id, req.utilisateur?.id!, req.etablissementId!, req);
            res.json({ success: true, message: 'Contrat supprimé' });
        } catch (error) {
            next(error);
        }
    }
);

export const contratController = router;
export default router;
