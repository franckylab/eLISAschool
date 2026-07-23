import { Router, Request, Response, NextFunction } from 'express';
import {
    niveauOrganisationService,
    usageUniteService,
    categoriePosteService,
    niveauResponsabiliteService,
    templateOrganisationService,
    typeRelationHierarchiqueService,
    modeRemunerationService,
    generationService,
} from '../services';
import {
    createNiveauOrganisationSchema,
    updateNiveauOrganisationSchema,
    queryNiveauxOrganisationSchema,
    createUsageUniteSchema,
    updateUsageUniteSchema,
    queryUsagesUniteSchema,
    createCategoriePosteSchema,
    updateCategoriePosteSchema,
    queryCategoriesPosteSchema,
    createNiveauResponsabiliteSchema,
    updateNiveauResponsabiliteSchema,
    queryNiveauxResponsabiliteSchema,
    createTemplateOrganisationSchema,
    updateTemplateOrganisationSchema,
    queryTemplatesOrganisationSchema,
    createTypeRelationHierarchiqueSchema,
    updateTypeRelationHierarchiqueSchema,
    createModeRemunerationSchema,
    updateModeRemunerationSchema,
    genererOrganisationSchema,
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

// ==================================
// NIVEAUX D'ORGANISATION
// ==================================

router.get('/niveaux-organisation', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const niveau = req.query.niveau ? parseInt(req.query.niveau as string) : undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await niveauOrganisationService.findAllPaginated(
                page, limit, req.utilisateur?.etablissementId, search, niveau
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await niveauOrganisationService.findAll(req.utilisateur?.etablissementId);
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/niveaux-organisation', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createNiveauOrganisationSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await niveauOrganisationService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/niveaux-organisation/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await niveauOrganisationService.findById(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/niveaux-organisation/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateNiveauOrganisationSchema, req.body);
        delete dto.etablissementId;
        const updated = await niveauOrganisationService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/niveaux-organisation/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await niveauOrganisationService.delete(req.params.id);
        res.json({ success: true, message: 'Niveau d\'organisation supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// USAGES D'UNITÉ
// ==================================

router.get('/usages-unite', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await usageUniteService.findAllPaginated(
                page, limit, req.utilisateur?.etablissementId, search
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await usageUniteService.findAll(req.utilisateur?.etablissementId);
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/usages-unite', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createUsageUniteSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await usageUniteService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/usages-unite/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await usageUniteService.findById(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/usages-unite/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateUsageUniteSchema, req.body);
        delete dto.etablissementId;
        const updated = await usageUniteService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/usages-unite/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await usageUniteService.delete(req.params.id);
        res.json({ success: true, message: 'Usage d\'unité supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// CATÉGORIES DE POSTE
// ==================================

router.get('/categories-poste', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await categoriePosteService.findAllPaginated(
                page, limit, req.utilisateur?.etablissementId, search
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await categoriePosteService.findAll(req.utilisateur?.etablissementId);
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/categories-poste', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createCategoriePosteSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await categoriePosteService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/categories-poste/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await categoriePosteService.findById(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/categories-poste/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateCategoriePosteSchema, req.body);
        delete dto.etablissementId;
        const updated = await categoriePosteService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/categories-poste/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await categoriePosteService.delete(req.params.id);
        res.json({ success: true, message: 'Catégorie de poste supprimée' });
    } catch (error) { next(error); }
});

// ==================================
// NIVEAUX DE RESPONSABILITÉ
// ==================================

router.get('/niveaux-responsabilite', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const niveau = req.query.niveau ? parseInt(req.query.niveau as string) : undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await niveauResponsabiliteService.findAllPaginated(
                page, limit, req.utilisateur?.etablissementId, search, niveau
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await niveauResponsabiliteService.findAll(req.utilisateur?.etablissementId);
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/niveaux-responsabilite', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createNiveauResponsabiliteSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await niveauResponsabiliteService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/niveaux-responsabilite/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await niveauResponsabiliteService.findById(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/niveaux-responsabilite/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateNiveauResponsabiliteSchema, req.body);
        delete dto.etablissementId;
        const updated = await niveauResponsabiliteService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/niveaux-responsabilite/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await niveauResponsabiliteService.delete(req.params.id);
        res.json({ success: true, message: 'Niveau de responsabilité supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// TEMPLATES D'ORGANISATION
// ==================================

router.get('/templates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const actif = req.query.actif !== undefined ? req.query.actif === 'true' : undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await templateOrganisationService.findAllPaginated(
                page, limit, req.utilisateur?.etablissementId, search, actif
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await templateOrganisationService.findAll(req.utilisateur?.etablissementId);
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/templates', authMiddleware, requirePermission('organisation:templates:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createTemplateOrganisationSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await templateOrganisationService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/templates/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await templateOrganisationService.findById(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/templates/:id', authMiddleware, requirePermission('organisation:templates:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateTemplateOrganisationSchema, req.body);
        delete dto.etablissementId;
        const updated = await templateOrganisationService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/templates/:id', authMiddleware, requirePermission('organisation:templates:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await templateOrganisationService.delete(req.params.id);
        res.json({ success: true, message: 'Template d\'organisation supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// TYPES DE RELATION HIÉRARCHIQUE
// ==================================

router.get('/types-relation', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await typeRelationHierarchiqueService.findAllPaginated(
                page, limit, req.utilisateur?.etablissementId, search
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await typeRelationHierarchiqueService.findAll(req.utilisateur?.etablissementId);
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/types-relation', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createTypeRelationHierarchiqueSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await typeRelationHierarchiqueService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/types-relation/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await typeRelationHierarchiqueService.findById(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/types-relation/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateTypeRelationHierarchiqueSchema, req.body);
        delete dto.etablissementId;
        const updated = await typeRelationHierarchiqueService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/types-relation/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await typeRelationHierarchiqueService.delete(req.params.id);
        res.json({ success: true, message: 'Type de relation supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// MODES DE RÉMUNÉRATION
// ==================================

router.get('/modes-remuneration', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await modeRemunerationService.findAllPaginated(
                page, limit, req.utilisateur?.etablissementId, search
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await modeRemunerationService.findAll(req.utilisateur?.etablissementId);
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/modes-remuneration', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createModeRemunerationSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await modeRemunerationService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/modes-remuneration/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await modeRemunerationService.findById(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/modes-remuneration/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateModeRemunerationSchema, req.body);
        delete dto.etablissementId;
        const updated = await modeRemunerationService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/modes-remuneration/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await modeRemunerationService.delete(req.params.id);
        res.json({ success: true, message: 'Mode de rémunération supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// GÉNÉRATION D'ORGANISATION
// ==================================

/**
 * POST /api/organisation/generer
 * Générer une organisation complète depuis un template ou une structure inline
 */
router.post('/generer', authMiddleware, requirePermission('organisation:generation:execute'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(genererOrganisationSchema, req.body);
        const result = await generationService.generer(dto, req.utilisateur!.etablissementId!);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

export const nomenclatureController = router;
export default router;
