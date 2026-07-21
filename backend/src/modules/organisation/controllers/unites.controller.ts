import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import { clonageService } from '../services/historique-clonage.service';
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

router.get('/unites', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filtres = validate(filtreUnitesSchema, req.query);
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        if (req.query.page || req.query.limit) {
            const { data, total } = await organisationService.findUnitesPaginated(filtres, page, limit, req.utilisateur?.etablissementId);
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const unites = await organisationService.findUnites(filtres, req.utilisateur?.etablissementId);
            res.json({ success: true, data: unites });
        }
    } catch (error) { next(error); }
});

router.post('/unites', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createUniteOrganisationnelleSchema, req.body);
        const created = await organisationService.createUnite(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/unites/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unite = await organisationService.findUniteById(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data: unite });
    } catch (error) { next(error); }
});

router.patch('/unites/:id', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateUniteOrganisationnelleSchema, req.body);
        const updated = await organisationService.updateUnite(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/unites/:id', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deleteUnite(req.params.id);
        res.json({ success: true, message: 'Unité supprimée' });
    } catch (error) { next(error); }
});

router.get('/arborescence', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement requis', 400, 'ETABLISSEMENT_REQUIRED');
        const arborescence = await organisationService.buildArborescence(etablissementId);
        res.json({ success: true, data: arborescence });
    } catch (error) { next(error); }
});

router.get('/chemin/:uniteId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chemin = await organisationService.getCheminHierarchique(req.params.uniteId);
        res.json({ success: true, data: chemin });
    } catch (error) { next(error); }
});

router.post('/clone-unite/:uniteId', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nouveauCode, nouveauNom } = req.body;
        if (!nouveauCode) throw new AppError('Le paramètre nouveauCode est requis', 400, 'MISSING_CODE');
        const result = await clonageService.clonerUnite(req.params.uniteId, nouveauCode, nouveauNom);
        res.status(201).json({ success: true, data: { unite: result.unite, postesClones: result.postesClones.length } });
    } catch (error) { next(error); }
});

router.post('/clone-structure/:uniteId', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { prefixeCode } = req.body;
        if (!prefixeCode) throw new AppError('Le paramètre prefixeCode est requis', 400, 'MISSING_PREFIX');
        const result = await clonageService.clonerStructureComplete(req.params.uniteId, prefixeCode);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

export const unitesController = router;
export default router;
