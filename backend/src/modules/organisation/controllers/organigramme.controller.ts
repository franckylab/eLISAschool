import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import { organigrammePdfService } from '../services/organigramme.pdf.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

/** Guard : vérifie que etablissementId est présent dans le token */
function getEtablissementId(req: Request): string {
    const id = req.utilisateur?.etablissementId;
    if (!id) throw new AppError('etablissementId manquant dans le token', 400, 'MISSING_ETABLISSEMENT_ID');
    return id;
}

router.get('/statistiques', authMiddleware, requirePermission('organisation:organigramme:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await organisationService.getStatistiquesOrganisation(getEtablissementId(req));
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

router.get('/organigramme', authMiddleware, requirePermission('organisation:organigramme:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organigramme = await organisationService.getOrganigramme(getEtablissementId(req));
        res.json({ success: true, data: organigramme });
    } catch (error) { next(error); }
});

router.get('/valider-arborescence', authMiddleware, requirePermission('organisation:organigramme:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = await organisationService.validerArborescence(getEtablissementId(req));
        res.json({ success: true, data: validation });
    } catch (error) { next(error); }
});

router.get('/export-pdf', authMiddleware, requirePermission('organisation:organigramme:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const html = await organigrammePdfService.genererOrganigrammeHTML(getEtablissementId(req));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) { next(error); }
});

export const organigrammeController = router;
export default router;
