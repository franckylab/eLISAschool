import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import { organigrammePdfService } from '../services/organigramme.pdf.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

router.get('/statistiques', authMiddleware, requirePermission('organisation:organigramme:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement requis', 400, 'ETABLISSEMENT_REQUIRED');
        const stats = await organisationService.getStatistiquesOrganisation(etablissementId);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

router.get('/organigramme', authMiddleware, requirePermission('organisation:organigramme:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement requis', 400, 'ETABLISSEMENT_REQUIRED');
        const organigramme = await organisationService.getOrganigramme(etablissementId);
        res.json({ success: true, data: organigramme });
    } catch (error) { next(error); }
});

router.get('/valider-arborescence', authMiddleware, requirePermission('organisation:organigramme:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement requis', 400, 'ETABLISSEMENT_REQUIRED');
        const validation = await organisationService.validerArborescence(etablissementId);
        res.json({ success: true, data: validation });
    } catch (error) { next(error); }
});

router.get('/export-pdf', authMiddleware, requirePermission('organisation:organigramme:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement requis', 400, 'ETABLISSEMENT_REQUIRED');
        const html = await organigrammePdfService.genererOrganigrammeHTML(etablissementId);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) { next(error); }
});

export const organigrammeController = router;
export default router;
