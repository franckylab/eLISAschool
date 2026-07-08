import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import {
    createOrganisationSchema,
    updateOrganisationSchema,
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

router.get('/organisations/mine', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organisation = await organisationService.findOrganisationMine(req.utilisateur!.etablissementId!);
        res.json({ success: true, data: organisation });
    } catch (error) { next(error); }
});

router.get('/organisations', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const type = req.query.type as string | undefined;
        const statut = req.query.statut as string | undefined;

        if (req.query.page || req.query.limit) {
            const { data, total } = await organisationService.findAllOrganisationsPaginated(
                page, limit, req.utilisateur?.etablissementId, search, type, statut,
            );
            res.json({
                success: true, data,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
            });
        } else {
            const organisations = await organisationService.findAllOrganisations(req.utilisateur?.etablissementId);
            res.json({ success: true, data: organisations });
        }
    } catch (error) { next(error); }
});

router.post('/organisations', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createOrganisationSchema, req.body);
        dto.etablissementId = req.utilisateur?.etablissementId;
        const created = await organisationService.createOrganisation(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/organisations/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organisation = await organisationService.findOrganisationById(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data: organisation });
    } catch (error) { next(error); }
});

router.patch('/organisations/:id', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateOrganisationSchema, req.body);
        delete dto.etablissementId;
        const updated = await organisationService.updateOrganisation(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/organisations/:id', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organisation = await organisationService.findOrganisationById(req.params.id, req.utilisateur?.etablissementId);
        const unitesActives = await organisationService.countUnitesActives(req.params.id);
        if (unitesActives > 0) {
            throw new AppError(`Impossible de supprimer : ${unitesActives} unité(s) active(s). Archivez d'abord les unités.`, 400, 'ORGANISATION_HAS_ACTIVE_UNITES');
        }
        await organisationService.deleteOrganisation(req.params.id);
        res.json({ success: true, message: 'Organisation supprimée' });
    } catch (error) { next(error); }
});

export const orgController = router;
export default router;
