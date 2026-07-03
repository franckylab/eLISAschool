/**
 * ==================================
 * eLISAschool - Controller Périodes (v3.0 — Hiérarchique)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Endpoints :
 * - CRUD périodes
 * - Compositions (hiérarchie parent-enfant)
 * - Templates (génération automatique)
 * - Clôture / Réouverture (avec cascade configurable)
 *
 * Permissions granulaires : periodes:*
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PeriodesService } from '../services';
import {
    createPeriodeSchema,
    updatePeriodeSchema,
    createCompositionSchema,
    updateCompositionSchema,
    replaceCompositionsSchema,
    genererTemplateSchema,
    cloturerPeriodeSchema,
    reouvrirPeriodeSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Permission } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new PeriodesService();

// ================================================================
// PÉRIODES — CRUD
// ================================================================

/**
 * GET / — Liste des périodes
 * Query: anneeId (requis), format=arbre (optionnel — retourne structure hiérarchique)
 */
router.get('/', authMiddleware, requirePermission(Permission.PERIODES_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeId = req.query.anneeId as string;
        if (!anneeId) throw new AppError('anneeId requis', 400, 'MISSING_PARAM');

        const format = req.query.format as string;

        if (format === 'arbre') {
            const arbre = await service.findAllArbre(anneeId, req.etablissementId);
            res.json({ success: true, data: arbre });
        } else {
            const periodes = await service.findAll(anneeId, req.etablissementId);
            res.json({ success: true, data: periodes });
        }
    } catch (error) { next(error); }
});

/**
 * GET /active — Période en cours (basée sur l'année active et la date courante)
 */
router.get('/active', authMiddleware, requirePermission(Permission.PERIODES_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const periode = await service.findActive(req.etablissementId!);
        res.json({ success: true, data: periode });
    } catch (error) { next(error); }
});

/**
 * GET /:id — Détail d'une période (avec compositions enfants)
 */
router.get('/:id', authMiddleware, requirePermission(Permission.PERIODES_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const periode = await service.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: periode });
    } catch (error) { next(error); }
});

/**
 * POST / — Créer une période (avec compositions optionnelles)
 */
router.post('/', authMiddleware, requirePermission(Permission.PERIODES_CREATE), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createPeriodeSchema, req.body);
        const periode = await service.create(dto, req.etablissementId!);
        res.status(201).json({ success: true, data: periode });
    } catch (error) { next(error); }
});

/**
 * PATCH /:id — Modifier une période
 */
router.patch('/:id', authMiddleware, requirePermission(Permission.PERIODES_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updatePeriodeSchema, req.body);
        const periode = await service.update(req.params.id, dto, req.etablissementId);
        res.json({ success: true, data: periode });
    } catch (error) { next(error); }
});

/**
 * DELETE /:id — Supprimer une période
 */
router.delete('/:id', authMiddleware, requirePermission(Permission.PERIODES_DELETE), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id, req.etablissementId);
        res.json({ success: true, message: 'Période supprimée' });
    } catch (error) { next(error); }
});

// ================================================================
// COMPOSITIONS — Gestion de la hiérarchie
// ================================================================

/**
 * GET /:id/enfants-disponibles — Pool de périodes disponibles pour être enfants
 * (filtré par type compatible, dates incluses, même année)
 */
router.get('/:id/enfants-disponibles', authMiddleware, requirePermission(Permission.PERIODES_COMPOSITIONS_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const disponibles = await service.getEnfantsDisponibles(req.params.id, req.etablissementId!);
        res.json({ success: true, data: disponibles });
    } catch (error) { next(error); }
});

/**
 * GET /:id/compositions — Lister les enfants d'une période
 */
router.get('/:id/compositions', authMiddleware, requirePermission(Permission.PERIODES_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const compositions = await service.getCompositions(req.params.id);
        res.json({ success: true, data: compositions });
    } catch (error) { next(error); }
});

/**
 * PUT /:id/compositions — Remplacement batch des compositions (sauvegarde atomique)
 */
router.put('/:id/compositions', authMiddleware, requirePermission(Permission.PERIODES_COMPOSITIONS_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(replaceCompositionsSchema, req.body);
        const compositions = await service.replaceCompositions(req.params.id, dto, req.etablissementId!);
        res.json({ success: true, data: compositions });
    } catch (error) { next(error); }
});

/**
 * POST /:id/compositions — Ajouter un enfant à une période
 */
router.post('/:id/compositions', authMiddleware, requirePermission(Permission.PERIODES_COMPOSITIONS_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createCompositionSchema, {
            ...req.body,
            periodeParentId: req.params.id,
        });
        const composition = await service.ajouterComposition(dto, req.etablissementId!);
        res.status(201).json({ success: true, data: composition });
    } catch (error) { next(error); }
});

/**
 * PATCH /compositions/:id — Modifier une composition (ordre, poids)
 */
router.patch('/compositions/:id', authMiddleware, requirePermission(Permission.PERIODES_COMPOSITIONS_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateCompositionSchema, req.body);
        const composition = await service.updateComposition(req.params.id, dto);
        res.json({ success: true, data: composition });
    } catch (error) { next(error); }
});

/**
 * DELETE /compositions/:id — Supprimer une composition
 */
router.delete('/compositions/:id', authMiddleware, requirePermission(Permission.PERIODES_COMPOSITIONS_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.retirerComposition(req.params.id);
        res.json({ success: true, message: 'Composition supprimée' });
    } catch (error) { next(error); }
});

// ================================================================
// TEMPLATES — Génération automatique
// ================================================================

/**
 * POST /templates/generer — Générer une hiérarchie depuis un template
 */
router.post('/templates/generer', authMiddleware, requirePermission(Permission.PERIODES_TEMPLATES_GENERER), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(genererTemplateSchema, req.body);
        const periodes = await service.genererDepuisTemplate(dto, req.etablissementId!);
        res.status(201).json({ success: true, data: periodes });
    } catch (error) { next(error); }
});

// ================================================================
// ACTIONS MÉTIER — CLÔTURE / RÉOUVERTURE
// ================================================================

/**
 * POST /:id/cloturer — Clôturer une période (avec cascade configurable)
 */
router.post('/:id/cloturer', authMiddleware, requirePermission(Permission.PERIODES_CLOTURER), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(cloturerPeriodeSchema, req.body);
        const periode = await service.cloturer(
            req.params.id,
            dto,
            req.utilisateur?.id,
            req.etablissementId!,
        );
        res.json({ success: true, data: periode });
    } catch (error) { next(error); }
});

/**
 * POST /:id/reouvrir — Réouvrir une période clôturée
 */
router.post('/:id/reouvrir', authMiddleware, requirePermission(Permission.PERIODES_REOUVRIR), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(reouvrirPeriodeSchema, req.body);
        const periode = await service.reouvrir(
            req.params.id,
            dto,
            req.utilisateur?.id,
            req.etablissementId!,
        );
        res.json({ success: true, data: periode });
    } catch (error) { next(error); }
});

/**
 * GET /:id/progression-enfants — Progression (temporelle + notes) des enfants d'une période
 */
router.get('/:id/progression-enfants', authMiddleware, requirePermission(Permission.PERIODES_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await service.getProgressionEnfants(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

/**
 * GET /:id/impacts — Vérifier les impacts avant clôture
 */
router.get('/:id/impacts', authMiddleware, requirePermission(Permission.PERIODES_CLOTURER), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const impacts = await service.verifierImpacts(req.params.id, req.etablissementId);
        res.json({ success: true, data: impacts });
    } catch (error) { next(error); }
});

export const periodesController = router;
export default router;
