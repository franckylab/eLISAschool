/**
 * ==================================
 * eLISAschool - Contrôleur Suivi-Personnel
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { suiviPersonnelService } from '../services';
import { createIncidentPersonnelSchema, createEvaluationPersonnelSchema } from '../dto';
import { staffOnly, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';

const router = Router();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.post('/incidents', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createIncidentPersonnelSchema, req.body);
        const incident = await suiviPersonnelService.createIncident(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            req
        );
        res.status(201).json({ success: true, data: incident });
    } catch (error) {
        next(error);
    }
});

router.get('/personnel/:membrePersonnelId/incidents', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const result = await suiviPersonnelService.getIncidentsByPersonnel(
            req.params.membrePersonnelId,
            req.utilisateur!.etablissementId!,
            page,
            limit
        );
        res.json({
            success: true,
            data: result.data,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
                hasNext: page * limit < result.total,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/evaluations', staffOnly, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createEvaluationPersonnelSchema, req.body);
        const evaluation = await suiviPersonnelService.createEvaluation(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            req
        );
        res.status(201).json({ success: true, data: evaluation });
    } catch (error) {
        next(error);
    }
});

router.get('/personnel/:membrePersonnelId/evaluations', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const result = await suiviPersonnelService.getEvaluationsByPersonnel(
            req.params.membrePersonnelId,
            req.utilisateur!.etablissementId!,
            page,
            limit
        );
        res.json({
            success: true,
            data: result.data,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
                hasNext: page * limit < result.total,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get('/personnel/:membrePersonnelId/dashboard', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dashboard = await suiviPersonnelService.getDashboardPersonnel(
            req.params.membrePersonnelId,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: dashboard });
    } catch (error) {
        next(error);
    }
});

export const suiviPersonnelController = router;
export default router;
