/**
 * ==================================
 * eLISAschool - Controller Heure de Cours
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { HeureCoursService } from '../services';
import { createHeureCoursSchema, updateHeureCoursSchema, queryHeureCoursSchema, genererHeuresCoursFromEdtSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new HeureCoursService();

/**
 * POST /api/personnel/heures-cours/generer-from-edt
 * Générer des HeureCours depuis les créneaux EDT
 * Déclarée AVANT POST / pour éviter les conflits Express Router
 */
router.post(
    '/generer-from-edt',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(genererHeuresCoursFromEdtSchema, req.body);
            const result = await service.genererHeuresCoursFromEdt(dto, req.etablissementId!, req.utilisateur?.id, req);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/personnel/heures-cours
 * Créer un nouveau créneau de cours
 */
router.post(
    '/',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createHeureCoursSchema, req.body);
            const heureCours = await service.create(dto, req.etablissementId!, req.utilisateur?.id, req);
            res.status(201).json({ success: true, data: heureCours });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/heures-cours
 * Lister tous les créneaux avec pagination
 */
router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryHeureCoursSchema, req.query);
            const result = await service.findAll(query, req.etablissementId!);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/heures-cours/enseignants/:id/edt
 * Obtenir l'emploi du temps hebdomadaire d'un enseignant
 * DOIT être déclarée AVANT /:id pour éviter que 'enseignants' soit capté comme :id
 */
router.get(
    '/enseignants/:id/edt',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const semaine = req.query.semaine as string || new Date().toISOString().split('T')[0];
            const periodeId = req.query.periodeId as string | undefined;
            const edt = await service.getEdtEnseignant(
                req.params.id,
                semaine,
                req.etablissementId!,
                periodeId
            );
            res.json({ success: true, data: edt });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/enseignants/:id/volume-horaire
 * Calculer le volume horaire hebdomadaire d'un enseignant
 */
router.get(
    '/enseignants/:id/volume-horaire',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { dateDebut, dateFin } = req.query;
            
            if (!dateDebut || !dateFin) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'MISSING_PARAMS', message: 'Les paramètres dateDebut et dateFin sont requis' },
                });
            }

            const periodeId = req.query.periodeId as string | undefined;
            const volume = await service.calculerVolumeHoraireHebdomadaire(
                req.params.id,
                new Date(dateDebut as string),
                new Date(dateFin as string),
                req.etablissementId!,
                periodeId
            );
            res.json({ success: true, data: volume });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/enseignants/:id/resume-mensuel/:annee/:mois
 * Obtenir le résumé mensuel des heures d'un enseignant
 */
router.get(
    '/enseignants/:id/resume-mensuel/:annee/:mois',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const annee = parseInt(req.params.annee);
            const mois = parseInt(req.params.mois);

            if (isNaN(annee) || isNaN(mois) || mois < 1 || mois > 12) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_PARAMS', message: 'Année et mois invalides' },
                });
            }

            const resume = await service.getResumeMensuel(
                req.params.id,
                mois,
                annee,
                req.etablissementId!
            );
            res.json({ success: true, data: resume });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/personnel/heures-cours/:id
 * Récupérer un créneau par son ID
 * Doit être APRÈS les routes /enseignants/ pour éviter les conflits
 */
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const heureCours = await service.findOne(req.params.id, req.etablissementId!);
            res.json({ success: true, data: heureCours });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/personnel/heures-cours/:id
 * Mettre à jour un créneau
 */
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateHeureCoursSchema, req.body);
            const heureCours = await service.update(
                req.params.id,
                dto,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: heureCours });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/personnel/heures-cours/:id
 * Supprimer un créneau
 */
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('personnel:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await service.delete(req.params.id, req.utilisateur?.id!, req.etablissementId!, req);
            res.json({ success: true, message: 'Créneau cours supprimé' });
        } catch (error) {
            next(error);
        }
    }
);

export const heureCoursController = router;
export default router;
