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
import { cmsTemplateService } from '../services/cms-template.service';
import { dataBindingService } from '../services/data-binding.service';
import {
    createPageSchema, updatePageSchema,
    createSectionSchema, updateSectionSchema,
    createMediaSchema,
    createThemeSchema, updateThemeSchema,
    createMenuSchema, updateMenuSchema,
    createWidgetSchema, updateWidgetSchema,
    reordonnerSectionsSchema,
    instancierTemplateSchema,
    reinitialiserCmsSchema,
    exportPageSchema,
    importPageSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
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
// PAGES — RBAC enforce (18 permissions)
// ==================================

router.get('/pages', requirePermission('cms:pages:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findPages(etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.get('/pages/:id', requirePermission('cms:pages:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findPageById(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/pages', requirePermission('cms:pages:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createPageSchema, req.body);
        const data = await cmsService.createPage(dto, etabId, getUtilisateurId(req));
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/pages/:id', requirePermission('cms:pages:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(updatePageSchema, req.body);
        const data = await cmsService.updatePage(req.params.id, dto, etabId, getUtilisateurId(req));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/pages/:id', requirePermission('cms:pages:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsService.deletePage(req.params.id, etabId);
        res.json({ success: true, message: 'Page supprimée' });
    } catch (error) { next(error); }
});

router.post('/pages/:id/publier', requirePermission('cms:pages:publish'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.publierPage(req.params.id, etabId, getUtilisateurId(req));
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// Preview — génère un token pour visualiser une page brouillon
router.get('/pages/:id/preview', requirePermission('cms:pages:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.genererPreviewToken(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// Preview binding — retourne le contexte résolu pour preview éditeur
router.get('/pages/:id/preview-binding', requirePermission('cms:pages:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const [contexte, variables] = await Promise.all([
            dataBindingService.getContexte(etabId),
            dataBindingService.getVariablesDisponibles(etabId),
        ]);
        res.json({ success: true, data: { contexte, variables } });
    } catch (error) { next(error); }
});

// ==================================
// SECTIONS
// ==================================

router.get('/pages/:id/sections', requirePermission('cms:sections:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findSectionsByPage(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/pages/:id/sections', requirePermission('cms:sections:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createSectionSchema, req.body);
        const data = await cmsService.createSection(dto, req.params.id, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/sections/:id', requirePermission('cms:sections:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(updateSectionSchema, req.body);
        const data = await cmsService.updateSection(req.params.id, dto, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/sections/:id', requirePermission('cms:sections:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsService.deleteSection(req.params.id, etabId);
        res.json({ success: true, message: 'Section supprimée' });
    } catch (error) { next(error); }
});

router.post('/sections/reordonner', requirePermission('cms:sections:edit'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/medias', requirePermission('cms:medias:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const type = req.query.type as string | undefined;
        const dossier = req.query.dossier as string | undefined;
        const data = await cmsService.findMedias(etabId, type, dossier);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/medias', requirePermission('cms:medias:upload'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createMediaSchema, req.body);
        const data = await cmsService.createMedia(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/medias/:id', requirePermission('cms:medias:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsService.deleteMedia(req.params.id, etabId);
        res.json({ success: true, message: 'Média supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// THEMES
// ==================================

router.get('/themes', requirePermission('cms:themes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findThemes(etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/themes', requirePermission('cms:themes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createThemeSchema, req.body);
        const data = await cmsService.createTheme(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/themes/:id', requirePermission('cms:themes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(updateThemeSchema, req.body);
        const data = await cmsService.updateTheme(req.params.id, dto, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/themes/:id/activer', requirePermission('cms:themes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.activerTheme(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// MENUS
// ==================================

router.get('/menus', requirePermission('cms:menus:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findMenus(etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/menus', requirePermission('cms:menus:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createMenuSchema, req.body);
        const data = await cmsService.createMenu(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/menus/:id', requirePermission('cms:menus:edit'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/widgets', requirePermission('cms:widgets:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsService.findWidgets(etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/widgets', requirePermission('cms:widgets:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(createWidgetSchema, req.body);
        const data = await cmsService.createWidget(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/widgets/:id', requirePermission('cms:widgets:edit'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/versions', requirePermission('cms:versions:view'), async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/versions/:id/restaurer', requirePermission('cms:versions:rollback'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsService.restaurerVersion(req.params.id, etabId);
        res.json({ success: true, message: 'Version restaurée' });
    } catch (error) { next(error); }
});

// ==================================
// TEMPLATES
// ==================================

router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categorie = req.query.categorie as string | undefined;
        const data = await cmsTemplateService.findTemplates(categorie);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.get('/templates/:code', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await cmsTemplateService.findTemplateByCode(req.params.code);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/templates/:code/instancier', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(instancierTemplateSchema, req.body);
        const data = await cmsTemplateService.instancierTemplate(
            req.params.code,
            etabId,
            getUtilisateurId(req),
            dto,
        );
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// RÉINITIALISATION CMS
// ==================================

router.post('/reinitialiser', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(reinitialiserCmsSchema, req.body);
        const result = await cmsTemplateService.reinitialiserCms(etabId, dto);
        res.json({ success: true, message: 'CMS réinitialisé avec succès', data: result });
    } catch (error) { next(error); }
});

// ==================================
// SEED DÉMO — Peupler avec contenu riche
// ==================================

router.post('/seed-demo', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // SUPER_ADMIN peut spécifier l'établissement dans le body
        const etabId = (req as any).etablissementId
            || (req as any).utilisateur?.etablissementId
            || req.body?.etablissementId;
        if (!etabId) {
            throw new AppError('Établissement non identifié. Spécifiez etablissementId dans le body.', 400, 'NO_ETABLISSEMENT');
        }
        const result = await cmsTemplateService.seedDemoEtablissement(etabId);
        res.json({
            success: true,
            message: 'Contenu de démonstration créé avec succès',
            data: result,
        });
    } catch (error) { next(error); }
});

// ==================================
// EXPORT / IMPORT — Sauvegarde JSON
// ==================================

router.get('/pages/:id/export', requirePermission('cms:pages:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const format = (req.query.format as string) === 'puck' ? 'puck' : 'json';
        const data = await cmsService.exporterPage(req.params.id, etabId, { format });

        // Retourner en téléchargement fichier
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="cms-page-export-${Date.now()}.json"`);
        res.json(data);
    } catch (error) { next(error); }
});

router.post('/pages/import', requirePermission('cms:pages:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(importPageSchema, req.body);
        const data = await cmsService.importerPage(dto, etabId, getUtilisateurId(req));
        res.status(201).json({ success: true, data, message: 'Page importée avec succès' });
    } catch (error) { next(error); }
});

export const cmsController = router;
export default router;
