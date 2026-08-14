/**
 * ==================================
 * eLISAschool - Controller API CMS Contenu Dynamique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Routes CRUD pour le contenu CMS dynamique :
 * Actualités, Témoignages, Événements, Partenaires, Newsletter.
 * RBAC enforce avec requirePermission par route.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { cmsContentService } from '../services/cms-content.service';
import {
    creerActualiteSchema, modifierActualiteSchema, listeActualitesSchema,
    creerTemoignageSchema, modifierTemoignageSchema,
    creerEvenementSchema, modifierEvenementSchema, listeEvenementsSchema,
    creerPartenaireSchema, modifierPartenaireSchema,
    abonnementNewsletterSchema,
} from '../dto/cms-content.dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Helpers
function validateDto(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', undefined, result.error.errors);
    }
    return result.data;
}

function getEtablissementId(req: Request): string {
    const etabId = (req as any).etablissementId || (req as any).utilisateur?.etablissementId;
    if (!etabId) throw new AppError('Établissement non identifié', 400, 'NO_ETABLISSEMENT');
    return etabId;
}

function getUtilisateurId(req: Request): string | undefined {
    return (req as any).utilisateur?.id;
}

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// ==================================
// ACTUALITÉS
// ==================================

router.get('/actualites', requirePermission('cms:actualites:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const query = validateDto(listeActualitesSchema, req.query);
        const result = await cmsContentService.listerActualites(etabId, query);
        res.json({
            success: true,
            data: result.data,
            pagination: { page: result.page, limit: query.limit, total: result.total, totalPages: result.totalPages },
        });
    } catch (error) { next(error); }
});

router.get('/actualites/stats', requirePermission('cms:actualites:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const stats = await cmsContentService.getStatsGlobales(etabId);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

router.get('/actualites/:id', requirePermission('cms:actualites:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsContentService.getActualite(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/actualites', requirePermission('cms:actualites:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(creerActualiteSchema, req.body);
        const data = await cmsContentService.creerActualite(dto, etabId, getUtilisateurId(req));
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/actualites/:id', requirePermission('cms:actualites:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(modifierActualiteSchema, req.body);
        const data = await cmsContentService.modifierActualite(req.params.id, etabId, dto);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/actualites/:id', requirePermission('cms:actualites:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsContentService.supprimerActualite(req.params.id, etabId);
        res.json({ success: true, message: 'Actualité supprimée' });
    } catch (error) { next(error); }
});

// ==================================
// TÉMOIGNAGES
// ==================================

router.get('/temoignages', requirePermission('cms:temoignages:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const categorie = req.query.categorie as string | undefined;
        const estVisible = req.query.estVisible !== undefined ? req.query.estVisible === 'true' : undefined;
        const data = await cmsContentService.listerTemoignages(etabId, { categorie, estVisible });
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.get('/temoignages/:id', requirePermission('cms:temoignages:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsContentService.getTemoignage(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/temoignages', requirePermission('cms:temoignages:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(creerTemoignageSchema, req.body);
        const data = await cmsContentService.creerTemoignage(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/temoignages/:id', requirePermission('cms:temoignages:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(modifierTemoignageSchema, req.body);
        const data = await cmsContentService.modifierTemoignage(req.params.id, etabId, dto);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/temoignages/:id', requirePermission('cms:temoignages:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsContentService.supprimerTemoignage(req.params.id, etabId);
        res.json({ success: true, message: 'Témoignage supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// ÉVÉNEMENTS
// ==================================

router.get('/evenements', requirePermission('cms:evenements:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const query = validateDto(listeEvenementsSchema, req.query);
        const result = await cmsContentService.listerEvenements(etabId, query);
        res.json({
            success: true,
            data: result.data,
            pagination: { page: result.page, limit: query.limit, total: result.total, totalPages: result.totalPages },
        });
    } catch (error) { next(error); }
});

router.get('/evenements/:id', requirePermission('cms:evenements:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsContentService.getEvenement(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/evenements', requirePermission('cms:evenements:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(creerEvenementSchema, req.body);
        const data = await cmsContentService.creerEvenement(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/evenements/:id', requirePermission('cms:evenements:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(modifierEvenementSchema, req.body);
        const data = await cmsContentService.modifierEvenement(req.params.id, etabId, dto);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/evenements/:id', requirePermission('cms:evenements:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsContentService.supprimerEvenement(req.params.id, etabId);
        res.json({ success: true, message: 'Événement supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// PARTENAIRES
// ==================================

router.get('/partenaires', requirePermission('cms:partenaires:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const categorie = req.query.categorie as string | undefined;
        const estVisible = req.query.estVisible !== undefined ? req.query.estVisible === 'true' : undefined;
        const data = await cmsContentService.listerPartenaires(etabId, { categorie, estVisible });
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.get('/partenaires/:id', requirePermission('cms:partenaires:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const data = await cmsContentService.getPartenaire(req.params.id, etabId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/partenaires', requirePermission('cms:partenaires:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(creerPartenaireSchema, req.body);
        const data = await cmsContentService.creerPartenaire(dto, etabId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/partenaires/:id', requirePermission('cms:partenaires:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const dto = validateDto(modifierPartenaireSchema, req.body);
        const data = await cmsContentService.modifierPartenaire(req.params.id, etabId, dto);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/partenaires/:id', requirePermission('cms:partenaires:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsContentService.supprimerPartenaire(req.params.id, etabId);
        res.json({ success: true, message: 'Partenaire supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// NEWSLETTER
// ==================================

router.get('/newsletter', requirePermission('cms:newsletter:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        const [abonnements, stats] = await Promise.all([
            cmsContentService.listerAbonnementsNewsletter(etabId),
            cmsContentService.getStatsNewsletter(etabId),
        ]);
        res.json({ success: true, data: { abonnements, stats } });
    } catch (error) { next(error); }
});

router.post('/newsletter/desabonner/:id', requirePermission('cms:newsletter:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etabId = getEtablissementId(req);
        await cmsContentService.desabonnerNewsletter(req.params.id, etabId);
        res.json({ success: true, message: 'Abonné désinscrit' });
    } catch (error) { next(error); }
});

export const cmsContentController = router;
export default router;
