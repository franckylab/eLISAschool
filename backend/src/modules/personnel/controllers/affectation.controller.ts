/**
 * ==================================
 * eLISAschool - Controller Affectation Poste
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { affectationService } from '../services/affectation.service';
import { createAffectationSchema, updateAffectationSchema, queryAffectationSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();

/**
 * POST /api/personnel/affectations
 * Créer une nouvelle affectation
 */
router.post(
    '/',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createAffectationSchema, req.body);
            const affectation = await affectationService.create(dto, req.etablissementId!, req.utilisateur?.id, req);
            res.status(201).json({ success: true, data: affectation });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/affectations
 * Lister les affectations avec pagination
 */
router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryAffectationSchema, req.query);
            const result = await affectationService.findAll(query, req.etablissementId!);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/membres/:id/affectations
 * Récupérer l'historique des affectations d'un membre
 */
router.get(
    '/membres/:id/historique',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const historique = await affectationService.getHistoriqueByMembre(req.params.id, req.etablissementId!);
            res.json({ success: true, data: historique });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/membres/:id/affectations/actif
 * Récupérer l'affectation active d'un membre
 */
router.get(
    '/membres/:id/actif',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const affectation = await affectationService.getAffectationActive(req.params.id, req.etablissementId!);
            res.json({ success: true, data: affectation });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/postes/:id/historique-occupants
 * Récupérer l'historique des occupants d'un poste
 */
router.get(
    '/postes/:id/historique-occupants',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const historique = await affectationService.getHistoriqueOccupantsPoste(req.params.id, req.etablissementId!);
            res.json({ success: true, data: historique });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/affectations/:id
 * Récupérer une affectation par ID
 */
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const affectation = await affectationService.findOne(req.params.id, req.etablissementId!);
            res.json({ success: true, data: affectation });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/personnel/affectations/:id
 * Mettre à jour une affectation
 */
router.patch(
    '/:id',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateAffectationSchema, req.body);
            const affectation = await affectationService.update(
                req.params.id,
                dto,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: affectation });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/personnel/affectations/:id/terminer
 * Terminer une affectation
 */
router.post(
    '/:id/terminer',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const affectation = await affectationService.terminer(
                req.params.id,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: affectation });
        } catch (error) {
            next(error);
        }
    }
);

export const affectationController = router;
export default router;
