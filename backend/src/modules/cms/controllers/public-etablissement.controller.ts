/**
 * ==================================
 * eLISAschool - Controller API publique établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Routes publiques accessibles SANS authentification.
 * Projection restrictive + Cache Redis + Rate limit.
 * Monté AVANT tenantMiddleware dans app.ts.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { publicEtablissementService } from '../services/public-etablissement.service';
import { cmsContentService } from '../services/cms-content.service';
import { contactPublicSchema, abonnementNewsletterSchema } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter spécifique aux routes publiques : 60 req/min/IP
const publicLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Trop de requêtes' } },
});

// Helper de validation Zod
function validateDto(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// ==================================
// GET /api/public/diagnostic — Diagnostic (débogage 404)
// ==================================
router.get('/diagnostic', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await publicEtablissementService.getDiagnostic();
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code — Données établissement
// ==================================
router.get('/e/:code', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await publicEtablissementService.getDonneesPubliques(req.params.code);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/accueil — Page d'accueil complète
// ==================================
router.get('/e/:code/accueil', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await publicEtablissementService.getPageAccueil(req.params.code);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/pages — Liste pages publiées
// ==================================
router.get('/e/:code/pages', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await publicEtablissementService.getPagesPubliques(req.params.code);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/pages/:slug — Détail page + sections
// ==================================
router.get('/e/:code/pages/:slug', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const previewToken = req.query.preview as string | undefined;

        // Si token de preview fourni → afficher même les brouillons
        if (previewToken) {
            const data = await publicEtablissementService.getPagePreview(
                req.params.code,
                req.params.slug,
                previewToken,
            );
            res.set('Cache-Control', 'no-store');
            res.json({ success: true, data, preview: true });
            return;
        }

        const data = await publicEtablissementService.getPagePublique(req.params.code, req.params.slug);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/theme — Thème actif
// ==================================
router.get('/e/:code/theme', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await publicEtablissementService.getThemePublic(req.params.code);
        res.set('Cache-Control', 'public, max-age=600');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/menus — Menus navigation
// ==================================
router.get('/e/:code/menus', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await publicEtablissementService.getMenusPublic(req.params.code);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/widgets — Widgets actifs
// ==================================
router.get('/e/:code/widgets', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await publicEtablissementService.getWidgetsPublic(req.params.code);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// POST /api/public/e/:code/contact — Formulaire contact
// ==================================
router.post('/e/:code/contact', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(contactPublicSchema, req.body);

        // Honeypot anti-spam — si rempli, c'est un bot
        if (dto._honeypot) {
            logger.warn('[CMS] Honeypot contact déclenché (bot suspecté)', { code: req.params.code });
            // Retourner 201 pour ne pas révéler le piège
            return res.status(201).json({ success: true, message: 'Message envoyé.' });
        }

        logger.info('[CMS] Formulaire contact reçu', {
            code: req.params.code,
            email: dto.email,
            sujet: dto.sujet,
        });

        res.status(201).json({
            success: true,
            message: 'Message envoyé avec succès. L\'établissement vous répondra sous peu.',
        });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/actualites — Actualités publiées
// ==================================
router.get('/e/:code/actualites', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etab = await publicEtablissementService.getEtablissementByCode(req.params.code);
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const categorie = req.query.categorie as string | undefined;
        const result = await cmsContentService.listerActualitesPubliques(etab.id, { page, limit, categorie });
        res.set('Cache-Control', 'public, max-age=300');
        res.json({
            success: true,
            data: result.data,
            pagination: { page: result.page, limit, total: result.total, totalPages: result.totalPages },
        });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/actualites/:slug — Détail actualité
// ==================================
router.get('/e/:code/actualites/:slug', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etab = await publicEtablissementService.getEtablissementByCode(req.params.code);
        const data = await cmsContentService.getActualiteParSlug(req.params.slug, etab.id);
        // Incrémenter les vues en arrière-plan (non bloquant)
        cmsContentService.incrementerVues(data.id, etab.id).catch(() => {});
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/temoignages — Témoignages visibles
// ==================================
router.get('/e/:code/temoignages', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etab = await publicEtablissementService.getEtablissementByCode(req.params.code);
        const categorie = req.query.categorie as string | undefined;
        const data = await cmsContentService.listerTemoignages(etab.id, { categorie, estVisible: true });
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/evenements — Événements futurs
// ==================================
router.get('/e/:code/evenements', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etab = await publicEtablissementService.getEtablissementByCode(req.params.code);
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const result = await cmsContentService.listerEvenements(etab.id, { page, limit, futur: true });
        res.set('Cache-Control', 'public, max-age=300');
        res.json({
            success: true,
            data: result.data,
            pagination: { page: result.page, limit, total: result.total, totalPages: result.totalPages },
        });
    } catch (error) { next(error); }
});

// ==================================
// GET /api/public/e/:code/partenaires — Partenaires visibles
// ==================================
router.get('/e/:code/partenaires', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etab = await publicEtablissementService.getEtablissementByCode(req.params.code);
        const categorie = req.query.categorie as string | undefined;
        const data = await cmsContentService.listerPartenaires(etab.id, { categorie, estVisible: true });
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

// ==================================
// POST /api/public/e/:code/newsletter — Abonnement newsletter
// ==================================
router.post('/e/:code/newsletter', publicLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etab = await publicEtablissementService.getEtablissementByCode(req.params.code);
        const dto = validateDto(abonnementNewsletterSchema, req.body);

        // Honeypot anti-spam
        if (dto._honeypot) {
            logger.warn('[CMS] Honeypot newsletter déclenché (bot suspecté)', { code: req.params.code });
            return res.status(201).json({ success: true, message: 'Inscription réussie.' });
        }

        const data = await cmsContentService.ajouterAbonnementNewsletter(dto, etab.id);
        res.status(201).json({
            success: true,
            message: 'Inscription à la newsletter réussie. Bienvenue !',
        });
    } catch (error) { next(error); }
});

export const publicEtablissementController = router;
export default router;
