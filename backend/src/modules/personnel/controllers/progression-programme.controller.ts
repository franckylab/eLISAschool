/**
 * eLISAschool - Module Personnel/RH
 * Controller pour la gestion des progressions de programme
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { progressionProgrammeService } from '../services/progression-programme.service';
import {
    createProgressionSchema,
    updateProgressionSchema,
    queryProgressionSchema,
} from '../dto/progression-programme.dto';

const router = Router();

// Créer une progression
router.post(
    '/',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createProgressionSchema, req.body);
            const created = await progressionProgrammeService.create(
                dto,
                req.etablissementId!,
                req.utilisateur?.id,
                req
            );
            res.status(201).json({ success: true, data: created });
        } catch (error) {
            next(error);
        }
    }
);

// Lister les progressions
router.get(
    '/',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryProgressionSchema, req.query);
            const result = await progressionProgrammeService.findAll(
                query,
                req.etablissementId!
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir la progression classe/matière (DOIT être avant /:id)
router.get(
    '/progressions/classe/:classeId/matiere/:matiereId',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { periodeId } = req.query;
            const progression = await progressionProgrammeService.getProgressionClasseMatiere(
                req.params.classeId,
                req.params.matiereId,
                periodeId as string,
                req.etablissementId!
            );
            res.json({ success: true, data: progression });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir les alertes de retard (DOIT être avant /:id)
router.get(
    '/progressions/alertes-retard',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const alertes = await progressionProgrammeService.getAlertesRetard(
                req.etablissementId!
            );
            res.json({ success: true, data: alertes });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir une progression
router.get(
    '/:id',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entity = await progressionProgrammeService.findOne(
                req.params.id,
                req.etablissementId!
            );
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }
);

// Mettre à jour une progression
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateProgressionSchema, req.body);
            const updated = await progressionProgrammeService.update(
                req.params.id,
                dto,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
);

// Supprimer une progression
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await progressionProgrammeService.delete(
                req.params.id,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

export const progressionProgrammeController = router;
