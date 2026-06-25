/**
 * eLISAschool - Module Personnel/RH
 * Controller pour la gestion des bulletins de paie
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';
import { bulletinPaieService } from '../services/bulletin-paie.service';
import {
    createBulletinSchema,
    updateBulletinPaieSchema,
    queryBulletinSchema,
} from '../dto/bulletin-paie.dto';

const router = Router();

// Créer un bulletin
router.post(
    '/',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createBulletinSchema, req.body);
            const created = await bulletinPaieService.create(
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

// Lister les bulletins
router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryBulletinSchema, req.query);
            const result = await bulletinPaieService.findAll(
                query,
                (req as any).etablissementId
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir un bulletin
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entity = await bulletinPaieService.findOne(
                req.params.id,
                (req as any).etablissementId
            );
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }
);

// Générer un bulletin
router.post(
    '/generer/:membreId',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mois, annee } = req.body;
            if (!mois || !annee) {
                throw new Error('Les paramètres mois et annee sont requis');
            }
            const bulletin = await bulletinPaieService.genererBulletin(
                req.params.membreId,
                mois,
                annee,
                (req as any).etablissementId,
                (req as any).utilisateur?.id,
                req
            );
            res.status(201).json({ success: true, data: bulletin });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir l'historique des bulletins d'un membre
router.get(
    '/membres/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryBulletinSchema, {
                ...req.query,
                membrePersonnelId: req.params.id,
            });
            const result = await bulletinPaieService.findAll(
                query,
                (req as any).etablissementId
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// Rapport comptable
router.get(
    '/rapport-comptable',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mois, annee } = req.query;
            if (!mois || !annee) {
                throw new Error('Les paramètres mois et annee sont requis');
            }
            const rapport = await bulletinPaieService.getTotalPaiesMensuelles(
                parseInt(mois as string),
                parseInt(annee as string),
                (req as any).etablissementId
            );
            res.json({ success: true, data: rapport });
        } catch (error) {
            next(error);
        }
    }
);

// Mettre à jour un bulletin
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateBulletinPaieSchema, req.body);
            const updated = await bulletinPaieService.update(
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

// Supprimer un bulletin
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await bulletinPaieService.delete(
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

export const bulletinPaieController = router;
