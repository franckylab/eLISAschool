/**
 * ==================================
 * eLISAschool - Contrôleur Suivi-Personnel
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { suiviPersonnelService } from '../services';
import { createIncidentPersonnelSchema, createEvaluationPersonnelSchema } from '../dto';
import { requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';

const router = Router();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.post('/incidents', async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/personnel/:membrePersonnelId/incidents', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const periodeId = req.query.periodeId as string; // ← NOUVEAU
        
        const result = await suiviPersonnelService.getIncidentsByPersonnel(
            req.params.membrePersonnelId,
            req.utilisateur!.etablissementId!,
            anneeScolaireId,
            { page, limit, periodeId } // ← NOUVEAU
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
            metadata: {
                anneeScolaireId,
                periodeId: periodeId || null, // ← NOUVEAU
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/evaluations', requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/personnel/:membrePersonnelId/evaluations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const periodeId = req.query.periodeId as string; // ← NOUVEAU
        
        const result = await suiviPersonnelService.getEvaluationsByPersonnel(
            req.params.membrePersonnelId,
            req.utilisateur!.etablissementId!,
            anneeScolaireId,
            { page, limit, periodeId } // ← NOUVEAU
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
            metadata: {
                anneeScolaireId,
                periodeId: periodeId || null, // ← NOUVEAU
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get('/personnel/:membrePersonnelId/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('anneeScolaireId requis', 400, 'VALIDATION_ERROR');
        }
        const dashboard = await suiviPersonnelService.getDashboardPersonnel(
            req.params.membrePersonnelId,
            req.utilisateur!.etablissementId!,
            anneeScolaireId
        );
        res.json({ success: true, data: dashboard });
    } catch (error) {
        next(error);
    }
});

export const suiviPersonnelController = router;
export default router;
