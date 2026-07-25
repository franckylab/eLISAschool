// ... existing code (imports + guard function) ...

router.get('/echelons-structurels', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const niveau = req.query.niveau ? parseInt(req.query.niveau as string) : undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await echelonStructurelService.findAllPaginated(
                page, limit, getEtablissementId(req), search, niveau
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await echelonStructurelService.findAll(getEtablissementId(req));
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/echelons-structurels', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createEchelonStructurelSchema, req.body);
        dto.etablissementId = getEtablissementId(req);
        const created = await echelonStructurelService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/echelons-structurels/:id', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await echelonStructurelService.findById(req.params.id, getEtablissementId(req));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/echelons-structurels/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateEchelonStructurelSchema, req.body);
        delete dto.etablissementId;
        const updated = await echelonStructurelService.update(req.params.id, dto, getEtablissementId(req));
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/echelons-structurels/:id', authMiddleware, requirePermission('organisation:nomenclatures:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await echelonStructurelService.delete(req.params.id, getEtablissementId(req));
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
                page, limit, getEtablissementId(req), search, niveau
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await niveauResponsabiliteService.findAll(getEtablissementId(req));
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/niveaux-responsabilite', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createNiveauResponsabiliteSchema, req.body);
        dto.etablissementId = getEtablissementId(req);
        const created = await niveauResponsabiliteService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/niveaux-responsabilite/:id', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await niveauResponsabiliteService.findById(req.params.id, getEtablissementId(req));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/niveaux-responsabilite/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateNiveauResponsabiliteSchema, req.body);
        delete dto.etablissementId;
        const updated = await niveauResponsabiliteService.update(req.params.id, dto, getEtablissementId(req));
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/niveaux-responsabilite/:id', authMiddleware, requirePermission('organisation:nomenclatures:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await niveauResponsabiliteService.delete(req.params.id, getEtablissementId(req));
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
                page, limit, getEtablissementId(req), search, actif
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await templateOrganisationService.findAll(getEtablissementId(req));
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/templates', authMiddleware, requirePermission('organisation:templates:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createTemplateOrganisationSchema, req.body);
        dto.etablissementId = getEtablissementId(req);
        const created = await templateOrganisationService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/templates/:id', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await templateOrganisationService.findById(req.params.id, getEtablissementId(req));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/templates/:id', authMiddleware, requirePermission('organisation:templates:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateTemplateOrganisationSchema, req.body);
        delete dto.etablissementId;
        const updated = await templateOrganisationService.update(req.params.id, dto, getEtablissementId(req));
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/templates/:id', authMiddleware, requirePermission('organisation:templates:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await templateOrganisationService.delete(req.params.id, getEtablissementId(req));
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
                page, limit, getEtablissementId(req), search
            );
            res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
        } else {
            const data = await modeRemunerationService.findAll(getEtablissementId(req));
            res.json({ success: true, data });
        }
    } catch (error) { next(error); }
});

router.post('/modes-remuneration', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createModeRemunerationSchema, req.body);
        dto.etablissementId = getEtablissementId(req);
        const created = await modeRemunerationService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/modes-remuneration/:id', authMiddleware, requirePermission('organisation:nomenclatures:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await modeRemunerationService.findById(req.params.id, getEtablissementId(req));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/modes-remuneration/:id', authMiddleware, requirePermission('organisation:nomenclatures:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateModeRemunerationSchema, req.body);
        delete dto.etablissementId;
        const updated = await modeRemunerationService.update(req.params.id, dto, getEtablissementId(req));
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/modes-remuneration/:id', authMiddleware, requirePermission('organisation:nomenclatures:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await modeRemunerationService.delete(req.params.id, getEtablissementId(req));
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
        const dto = validateDto(genererOrganisationSchema, req.body);
        const result = await generationService.generer(dto, getEtablissementId(req));
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

export const nomenclatureController = router;
export default router;
