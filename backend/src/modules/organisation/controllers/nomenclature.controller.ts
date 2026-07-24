import { Router, Request, Response, NextFunction } from 'express';
import {
    echelonStructurelService,
    niveauResponsabiliteService,
    templateOrganisationService,
    modeRemunerationService,
    generationService,
} from '../services';
import {
    createEchelonStructurelSchema,
    updateEchelonStructurelSchema,
    queryEchelonsStructurelsSchema,
    createNiveauResponsabiliteSchema,
    updateNiveauResponsabiliteSchema,
    queryNiveauxResponsabiliteSchema,
    createTemplateOrganisationSchema,
    updateTemplateOrganisationSchema,
    queryTemplatesOrganisationSchema,
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
// ÉCHELONS STRUCTURELS
// (fusion de Niveaux d'Organisation + Usages d'Unité — refonte v4.0)
// ==================================

router.get('/echelons-structurels', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const niveau = req.query.niveau ? parseInt(req.query.niveau as string) : undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await echelonStructurelService.findAllPaginated(
                page, limit, req.utilisateur?.etablissementId, search, niveau
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await echelonStructurelService.findAll(req.utilisateur?.etablissementId);
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/echelons-structurels', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createEchelonStructurelSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await echelonStructurelService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/echelons-structurels/:id', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await echelonStructurelService.findById(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/echelons-structurels/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateEchelonStructurelSchema, req.body);
        delete dto.etablissementId;
        const updated = await echelonStructurelService.update(req.params.id, dto, req.utilisateur?.etablissementId);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/echelons-structurels/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await echelonStructurelService.delete(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, message: 'Échelon structurel supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// NIVEAUX DE RESPONSABILITÉ
// ==================================

router.get('/niveaux-responsabilite', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/niveaux-responsabilite/:id', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await niveauResponsabiliteService.findById(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/niveaux-responsabilite/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateNiveauResponsabiliteSchema, req.body);
        delete dto.etablissementId;
        const updated = await niveauResponsabiliteService.update(req.params.id, dto, req.utilisateur?.etablissementId);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/niveaux-responsabilite/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await niveauResponsabiliteService.delete(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, message: 'Niveau de responsabilité supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// TEMPLATES D'ORGANISATION
// ==================================

router.get('/templates', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/templates/:id', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await templateOrganisationService.findById(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/templates/:id', authMiddleware, requirePermission('organisation:templates:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateTemplateOrganisationSchema, req.body);
        delete dto.etablissementId;
        const updated = await templateOrganisationService.update(req.params.id, dto, req.utilisateur?.etablissementId);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/templates/:id', authMiddleware, requirePermission('organisation:templates:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await templateOrganisationService.delete(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, message: 'Template d\'organisation supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// MODES DE RÉMUNÉRATION
// ==================================

router.get('/modes-remuneration', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/modes-remuneration/:id', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await modeRemunerationService.findById(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/modes-remuneration/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateModeRemunerationSchema, req.body);
        delete dto.etablissementId;
        const updated = await modeRemunerationService.update(req.params.id, dto, req.utilisateur?.etablissementId);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/modes-remuneration/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await modeRemunerationService.delete(req.params.id, req.utilisateur?.etablissementId);
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
