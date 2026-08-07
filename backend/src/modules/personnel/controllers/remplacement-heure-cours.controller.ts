/**
 * ==================================
 * eLISAschool - Controller RemplacementHeureCours
 * ==================================
 * Routes API pour la gestion des remplacements d'enseignants.
 * Monté sur /api/personnel/heures-cours/remplacements
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { remplacementHeureCoursService } from '../services/remplacement-heure-cours.service';
import {
    creerRemplacementSchema,
    validerRemplacementSchema,
    executerRemplacementSchema,
    rejeterRemplacementSchema,
    queryRemplacementSchema,
} from '../dto/remplacement-heure-cours.dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto, validateQuery } from '@common/utils';

const router = Router();

/**
 * GET /api/personnel/heures-cours/remplacements/statistiques
 * Statistiques agrégées des remplacements
 */
router.get(
    '/statistiques',
    authMiddleware,
    requirePermission('heures-cours:remplacer:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await remplacementHeureCoursService.getStatistiques(req.etablissementId!);
            return res.json({ success: true, data: stats });
        } catch (error) { next(error); }
    },
);

/**
 * GET /api/personnel/heures-cours/remplacements
 * Lister les demandes de remplacement avec pagination et filtres
 */
router.get(
    '/',
    authMiddleware,
    requirePermission('heures-cours:remplacer:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateQuery(queryRemplacementSchema, req.query);
            const result = await remplacementHeureCoursService.findAll(query, req.etablissementId!);
            return res.json({ success: true, data: result });
        } catch (error) { next(error); }
    },
);

/**
 * POST /api/personnel/heures-cours/remplacements
 * Créer une demande de remplacement
 */
router.post(
    '/',
    authMiddleware,
    requirePermission('heures-cours:remplacer:demand'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(creerRemplacementSchema, req.body);
            const remplacement = await remplacementHeureCoursService.create(
                dto, req.etablissementId!, req.utilisateur?.id!, req,
            );
            return res.status(201).json({ success: true, data: remplacement });
        } catch (error) { next(error); }
    },
);

/**
 * PATCH /api/personnel/heures-cours/remplacements/:id/valider
 * Valider une demande de remplacement (étape 1 : approbation → VALIDEE)
 */
router.patch(
    '/:id/valider',
    authMiddleware,
    requirePermission('heures-cours:remplacer:validate'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(validerRemplacementSchema, req.body);
            const remplacement = await remplacementHeureCoursService.valider(
                req.params.id, dto, req.utilisateur?.id!, req.etablissementId!, req,
            );
            return res.json({ success: true, data: remplacement, message: 'Remplacement validé' });
        } catch (error) { next(error); }
    },
);

/**
 * PATCH /api/personnel/heures-cours/remplacements/:id/executer
 * Exécuter un remplacement validé (étape 2 : mise en œuvre → EXECUTEE)
 */
router.patch(
    '/:id/executer',
    authMiddleware,
    requirePermission('heures-cours:remplacer:validate'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(executerRemplacementSchema, req.body);
            const remplacement = await remplacementHeureCoursService.executer(
                req.params.id, dto, req.utilisateur?.id!, req.etablissementId!, req,
            );
            return res.json({ success: true, data: remplacement, message: 'Remplacement exécuté' });
        } catch (error) { next(error); }
    },
);

/**
 * PATCH /api/personnel/heures-cours/remplacements/:id/rejeter
 * Rejeter une demande de remplacement
 */
router.patch(
    '/:id/rejeter',
    authMiddleware,
    requirePermission('heures-cours:remplacer:validate'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(rejeterRemplacementSchema, req.body);
            const remplacement = await remplacementHeureCoursService.rejeter(
                req.params.id, dto, req.utilisateur?.id!, req.etablissementId!, req,
            );
            return res.json({ success: true, data: remplacement, message: 'Remplacement rejeté' });
        } catch (error) { next(error); }
    },
);

/**
 * PATCH /api/personnel/heures-cours/remplacements/:id/annuler
 * Annuler une demande (par le demandeur)
 */
router.patch(
    '/:id/annuler',
    authMiddleware,
    requirePermission('heures-cours:remplacer:demand'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const remplacement = await remplacementHeureCoursService.annuler(
                req.params.id, req.utilisateur?.id!, req.etablissementId!, req,
            );
            return res.json({ success: true, data: remplacement, message: 'Remplacement annulé' });
        } catch (error) { next(error); }
    },
);

export const remplacementHeureCoursController = router;
export default router;
