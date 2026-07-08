import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import { organigrammePdfService } from '../services/organigramme.pdf.service';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', false, result.error.errors);
    }
    return result.data;
}

async function verifierOrganisation(organisationId: string, etablissementId?: string): Promise<void> {
    await organisationService.findOrganisationById(organisationId, etablissementId);
}

router.get('/statistiques/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifierOrganisation(req.params.organisationId, req.utilisateur?.etablissementId);
        const stats = await organisationService.getStatistiquesOrganisation(req.params.organisationId);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

router.get('/organigramme/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifierOrganisation(req.params.organisationId, req.utilisateur?.etablissementId);
        const organigramme = await organisationService.getOrganigramme(req.params.organisationId);
        res.json({ success: true, data: organigramme });
    } catch (error) { next(error); }
});

router.get('/valider-arborescence/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifierOrganisation(req.params.organisationId, req.utilisateur?.etablissementId);
        const validation = await organisationService.validerArborescence(req.params.organisationId);
        res.json({ success: true, data: validation });
    } catch (error) { next(error); }
});

router.get('/export-pdf/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await verifierOrganisation(req.params.organisationId, req.utilisateur?.etablissementId);
        const html = await organigrammePdfService.genererOrganigrammeHTML(req.params.organisationId);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) { next(error); }
});

export const organigrammeController = router;
export default router;
