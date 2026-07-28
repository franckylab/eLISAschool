/**
 * eLISAschool - Module Personnel/RH
 * Controller pour la gestion des absences du personnel
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import {
    absencePersonnelService,
} from '../services/absence-personnel.service';
import {
    createAbsenceSchema,
    updateAbsenceSchema,
    queryAbsenceSchema,
} from '../dto/absence-personnel.dto';

const router = Router();

// Créer une absence
router.post(
    '/',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createAbsenceSchema, req.body);
            const created = await absencePersonnelService.create(
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

// Lister les absences
router.get(
    '/',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryAbsenceSchema, req.query);
            const result = await absencePersonnelService.findAll(
                query,
                req.etablissementId!
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir les absences non justifiées (DOIT être avant /:id)
router.get(
    '/non-justifiees',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const jours = parseInt(req.query.jours as string) || 3;
            const absences = await absencePersonnelService.getAbsencesNonJustifiees(
                jours,
                req.etablissementId!
            );
            res.json({ success: true, data: absences });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir l'assiduité d'un membre
router.get(
    '/membres/:id/assiduite',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { dateDebut, dateFin } = req.query;
            if (!dateDebut || !dateFin) {
                throw new Error('Les paramètres dateDebut et dateFin sont requis');
            }
            const stats = await absencePersonnelService.getStatistiquesAssiduite(
                req.params.id,
                dateDebut as string,
                dateFin as string,
                req.etablissementId!
            );
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir une absence
router.get(
    '/:id',
    authMiddleware,
    requirePermission('personnel:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entity = await absencePersonnelService.findOne(
                req.params.id,
                req.etablissementId!
            );
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }
);

// Justifier une absence
router.patch(
    '/:id/justifier',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { justification } = req.body;
            if (!justification) {
                throw new Error('La justification est requise');
            }
            const entity = await absencePersonnelService.justifier(
                req.params.id,
                justification,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }
);

// Mettre à jour une absence
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateAbsenceSchema, req.body);
            const updated = await absencePersonnelService.update(
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

// Supprimer une absence
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await absencePersonnelService.delete(
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

export const absencePersonnelController = router;
