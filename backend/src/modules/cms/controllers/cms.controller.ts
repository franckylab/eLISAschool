/**
 * ==================================
 * eLISAschool - Controller API CMS (authentifié)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Routes CMS authentifiées avec multi-tenant.
 * Monté APRÈS tenantMiddleware dans app.ts.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cmsService } from '../services/cms.service';
import {
    createPageSchema, updatePageSchema,
    createSectionSchema, updateSectionSchema,
    createMediaSchema,
    createThemeSchema, updateThemeSchema,
    createMenuSchema, updateMenuSchema,
    createWidgetSchema, updateWidgetSchema,
    reordonnerSectionsSchema,
} from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Helper de validation Zod
function validateDto(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Middleware pour extraire l'etablissementId du token
function getEtablissementId(req: Request): string {
    const etabId = (req as any).etablissementId || (req as any).utilisateur?.etablissementId;
    if (!etabId) {
        throw new AppError('Établissement non identifié', 400, 'NO_ETABLISSEMENT');
    }
    return etabId;
}

function getUtilisateurId(req: Request): string | undefined {
    return (req as any).utilisateur?.id;
}

// Toutes les routes CMS nécessitent une authentification
router.use(authMiddleware);

// ==================================
// PAGES
// ==================================

router.get('/pages', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findPages(etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.get('/pages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findPageById(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/pages', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createPageSchema, req.body);
        const data = await cmsService.createPage(dto, etabId, getUtilisateurId(req));
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/pages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(updatePageSchema, req.body);
        const data = await cmsService.updatePage(req.params.id, dto, etabId, getUtilisateurId(req));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/pages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsService.deletePage(req.params.id, etabId);
        res.json({ success: true, message: 'Page supprimée' });
    } catch (error) { next(error); }
});

router.post('/pages/:id/publier', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.publierPage(req.params.id, etabId, getUtilisateurId(req));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// SECTIONS
// ==================================

router.get('/pages/:id/sections', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findSectionsByPage(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/pages/:id/sections', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createSectionSchema, req.body);
        const data = await cmsService.createSection(dto, req.params.id, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/sections/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(updateSectionSchema, req.body);
        const data = await cmsService.updateSection(req.params.id, dto, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/sections/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsService.deleteSection(req.params.id, etabId);
        res.json({ success: true, message: 'Section supprimée' });
    } catch (error) { next(error); }
});

router.post('/sections/reordonner', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(reordonnerSectionsSchema, req.body);
        await cmsService.reordonnerSections(dto, etabId);
        res.json({ success: true, message: 'Sections réordonnées' });
    } catch (error) { next(error); }
});

// ==================================
// MEDIAS
// ==================================

router.get('/medias', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const type = req.query.type as string | undefined;
        const dossier = req.query.dossier as string | undefined;
        const data = await cmsService.findMedias(etabId, type, dossier);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/medias', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createMediaSchema, req.body);
        const data = await cmsService.createMedia(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/medias/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsService.deleteMedia(req.params.id, etabId);
        res.json({ success: true, message: 'Média supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// THEMES
// ==================================

router.get('/themes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findThemes(etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/themes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createThemeSchema, req.body);
        const data = await cmsService.createTheme(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/themes/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(updateThemeSchema, req.body);
        const data = await cmsService.updateTheme(req.params.id, dto, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/themes/:id/activer', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.activerTheme(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// MENUS
// ==================================

router.get('/menus', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findMenus(etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/menus', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createMenuSchema, req.body);
        const data = await cmsService.createMenu(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/menus/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(updateMenuSchema, req.body);
        const data = await cmsService.updateMenu(req.params.id, dto, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// WIDGETS
// ==================================

router.get('/widgets', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findWidgets(etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/widgets', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createWidgetSchema, req.body);
        const data = await cmsService.createWidget(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/widgets/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(updateWidgetSchema, req.body);
        const data = await cmsService.updateWidget(req.params.id, dto, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// VERSIONS — Historique
// ==================================

router.get('/versions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const { entiteType, entiteId } = req.query;
        if (!entiteType || !entiteId) {
            throw new AppError('entiteType et entiteId requis', 400, 'MISSING_PARAMS');
        }
        const data = await cmsService.findVersions(etabId, entiteType as string, entiteId as string);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/versions/:id/restaurer', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsService.restaurerVersion(req.params.id, etabId);
        res.json({ success: true, message: 'Version restaurée' });
    } catch (error) { next(error); }
});

export const cmsController = router;
export default router;
