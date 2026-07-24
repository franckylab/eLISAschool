import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import {
    createUniteOrganisationnelleSchema,
    updateUniteOrganisationnelleSchema,
    filtreUnitesSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', false, result.error.errors);
    }
    return result.data;
}

router.get('/unites', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filtres = validate(filtreUnitesSchema, req.query);
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        if (req.query.page || req.query.limit) {
            const result = await organisationService.findUnitesPaginated(filtres, page, limit, req.utilisateur?.etablissementId);
            res.json({ success: true, data: result });
        } else {
            const unites = await organisationService.findUnites(filtres, req.utilisateur?.etablissementId);
            res.json({ success: true, data: unites });
        }
    } catch (error) { next(error); }
});

router.post('/unites', authMiddleware, requirePermission('organisation:unites:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createUniteOrganisationnelleSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await organisationService.createUnite(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

// Route statique AVANT les routes dynamiques /:id
router.post('/unites/avec-postes', authMiddleware, requirePermission('organisation:unites:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { postes, ...uniteDto } = req.body;
        const dto = validate(createUniteOrganisationnelleSchema, uniteDto);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await organisationService.creerUniteAvecPostes(dto, postes || []);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/unites/:id', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unite = await organisationService.findUniteById(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data: unite });
    } catch (error) { next(error); }
});

router.get('/unites/:id/impact', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const impact = await organisationService.getImpactUnite(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data: impact });
    } catch (error) { next(error); }
});

router.get('/unites/:id/sous-unites', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sousUnites = await organisationService.findSousUnites(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data: sousUnites });
    } catch (error) { next(error); }
});

router.patch('/unites/:id', authMiddleware, requirePermission('organisation:unites:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateUniteOrganisationnelleSchema, req.body);
        const updated = await organisationService.updateUnite(req.params.id, dto, req.utilisateur?.etablissementId);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.patch('/unites/:id/reordonner', authMiddleware, requirePermission('organisation:unites:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { apresId } = req.body;
        if (apresId !== null && typeof apresId !== 'string') {
            throw new AppError('apresId doit être un string ou null', 400, 'VALIDATION_ERROR');
        }
        await organisationService.reordonnerUnite(req.params.id, apresId ?? null, req.utilisateur?.etablissementId);
        res.json({ success: true, message: 'Unité réordonnée' });
    } catch (error) { next(error); }
});

router.delete('/unites/:id', authMiddleware, requirePermission('organisation:unites:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deleteUnite(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, message: 'Unité supprimée' });
    } catch (error) { next(error); }
});

router.get('/arborescence', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement requis', 400, 'ETABLISSEMENT_REQUIRED');
        const arborescence = await organisationService.buildArborescence(etablissementId);
        res.json({ success: true, data: arborescence });
    } catch (error) { next(error); }
});

router.get('/chemin/:uniteId', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chemin = await organisationService.getCheminHierarchique(req.params.uniteId, req.utilisateur?.etablissementId);
        res.json({ success: true, data: chemin });
    } catch (error) { next(error); }
});

export const unitesController = router;
export default router;
