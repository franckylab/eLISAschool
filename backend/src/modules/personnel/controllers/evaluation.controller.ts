/**
 * eLISAschool - Module Personnel/RH
 * Controller pour la gestion des évaluations des enseignants
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';
import { evaluationService } from '../services/evaluation.service';
import {
    createEvaluationSchema,
    updateEvaluationSchema,
    queryEvaluationSchema,
} from '../dto/evaluation.dto';

const router = Router();

// Créer une évaluation
router.post(
    '/',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createEvaluationSchema, req.body);
            const created = await evaluationService.create(
                dto,
                (req as any).etablissementId,
                (req as any).utilisateur?.id,
                req
            );
            res.status(201).json({ success: true, data: created });
        } catch (error) {
            next(error);
        }
    }
);

// Lister les évaluations
router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryEvaluationSchema, req.query);
            const result = await evaluationService.findAll(
                query,
                (req as any).etablissementId
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir une évaluation
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entity = await evaluationService.findOne(
                req.params.id,
                (req as any).etablissementId
            );
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir la moyenne des évaluations d'un enseignant
router.get(
    '/enseignants/:id/moyenne-evaluations',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { dateDebut, dateFin } = req.query;
            if (!dateDebut || !dateFin) {
                throw new Error('Les paramètres dateDebut et dateFin sont requis');
            }
            const moyenne = await evaluationService.getMoyenneEnseignant(
                req.params.id,
                dateDebut as string,
                dateFin as string,
                req.etablissementId
            );
            res.json({ success: true, data: moyenne });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir le résumé par catégorie
router.get(
    '/enseignants/:id/resume-categorie/:annee',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const annee = parseInt(req.params.annee);
            const resume = await evaluationService.getResumeParCategorie(
                req.params.id,
                annee
            );
            res.json({ success: true, data: resume });
        } catch (error) {
            next(error);
        }
    }
);

// Mettre à jour une évaluation
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateEvaluationSchema, req.body);
            const updated = await evaluationService.update(
                req.params.id,
                dto,
                (req as any).utilisateur?.id,
                (req as any).etablissementId,
                req
            );
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
);

// Supprimer une évaluation
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await evaluationService.delete(
                req.params.id,
                (req as any).utilisateur?.id,
                (req as any).etablissementId,
                req
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

export const evaluationController = router;
