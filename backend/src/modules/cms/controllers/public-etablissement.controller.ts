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
import { contactPublicSchema } from '../dto';
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

        // TODO : Envoyer notification email à l'établissement
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

export const publicEtablissementController = router;
export default router;
