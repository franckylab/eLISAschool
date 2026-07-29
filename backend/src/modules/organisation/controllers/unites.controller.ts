import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import {
    createUniteOrganisationnelleSchema,
    updateUniteOrganisationnelleSchema,
    filtreUnitesSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils/validate-dto.util';

const router = Router();

/** Guard : vérifie que etablissementId est présent dans le token */
function getEtablissementId(req: Request): string {
    const id = req.utilisateur?.etablissementId;
    if (!id) throw new AppError('etablissementId manquant dans le token', 400, 'MISSING_ETABLISSEMENT_ID');
    return id;
}

router.get('/unites', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filtres = validateDto(filtreUnitesSchema, req.query);
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        if (req.query.page || req.query.limit) {
            const result = await organisationService.findUnitesPaginated(filtres, page, limit, getEtablissementId(req));
            res.json({ success: true, data: result });
        } else {
            const unites = await organisationService.findUnites(filtres, getEtablissementId(req));
            res.json({ success: true, data: unites });
        }
    } catch (error) { next(error); }
});

router.post('/unites', authMiddleware, requirePermission('organisation:unites:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createUniteOrganisationnelleSchema, req.body);
        dto.etablissementId = getEtablissementId(req);
        const created = await organisationService.createUnite(dto, req.utilisateur?.id);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

// Route statique AVANT les routes dynamiques /:id
router.post('/unites/avec-postes', authMiddleware, requirePermission('organisation:unites:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { postes, ...uniteDto } = req.body;
        const dto = validateDto(createUniteOrganisationnelleSchema, uniteDto);
        dto.etablissementId = getEtablissementId(req);
        const created = await organisationService.creerUniteAvecPostes(dto, postes || [], req.utilisateur?.id);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/unites/:id', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unite = await organisationService.findUniteById(req.params.id, getEtablissementId(req));
        res.json({ success: true, data: unite });
    } catch (error) { next(error); }
});

router.get('/unites/:id/impact', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const impact = await organisationService.getImpactUnite(req.params.id, getEtablissementId(req));
        res.json({ success: true, data: impact });
    } catch (error) { next(error); }
});

router.get('/unites/:id/sous-unites', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sousUnites = await organisationService.findSousUnites(req.params.id, getEtablissementId(req));
        res.json({ success: true, data: sousUnites });
    } catch (error) { next(error); }
});

router.patch('/unites/:id', authMiddleware, requirePermission('organisation:unites:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateUniteOrganisationnelleSchema, req.body);
        const updated = await organisationService.updateUnite(req.params.id, dto, getEtablissementId(req), req.utilisateur?.id);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.patch('/unites/:id/reordonner', authMiddleware, requirePermission('organisation:unites:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { apresId } = req.body;
        if (apresId !== null && typeof apresId !== 'string') {
            throw new AppError('apresId doit être un string ou null', 400, 'VALIDATION_ERROR');
        }
        await organisationService.reordonnerUnite(req.params.id, apresId ?? null, getEtablissementId(req), req.utilisateur?.id);
        res.json({ success: true, message: 'Unité réordonnée' });
    } catch (error) { next(error); }
});

router.delete('/unites/:id', authMiddleware, requirePermission('organisation:unites:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deleteUnite(req.params.id, getEtablissementId(req), req.utilisateur?.id);
        res.json({ success: true, message: 'Unité supprimée' });
    } catch (error) { next(error); }
});

router.get('/arborescence', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const arborescence = await organisationService.buildArborescence(getEtablissementId(req));
        res.json({ success: true, data: arborescence });
    } catch (error) { next(error); }
});

router.get('/chemin/:uniteId', authMiddleware, requirePermission('organisation:unites:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chemin = await organisationService.getCheminHierarchique(req.params.uniteId, getEtablissementId(req));
        res.json({ success: true, data: chemin });
    } catch (error) { next(error); }
});

export const unitesController = router;
export default router;
