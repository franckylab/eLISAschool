/**
 * ==================================
 * eLISAschool - Contrôleur Suivi-Élèves
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import {
    suiviEleveService,
} from '../services';
import {
    createIncidentEleveSchema,
    createObservationEleveSchema,
    createSanctionEleveSchema,
    createFelicitationEleveSchema,
} from '../dto';
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

// ==================== INCIDENTS ====================
router.post('/incidents', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createIncidentEleveSchema, req.body);
        const incident = await suiviEleveService.createIncident(
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

router.get('/eleve/:eleveId/incidents', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ← NOUVEAU: Validation année scolaire obligatoire
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const periodeId = req.query.periodeId as string; // ← NOUVEAU: filtre par trimestre
        
        const result = await suiviEleveService.getIncidentsByEleve(
            req.params.eleveId,
            req.utilisateur!.etablissementId!,
            anneeScolaireId,
            { page, limit, periodeId } // ← NOUVEAU: options avec periodeId
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

// ==================== OBSERVATIONS ====================
router.post('/observations', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createObservationEleveSchema, req.body);
        const observation = await suiviEleveService.createObservation(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            req // ← NOUVEAU: pour audit trail
        );
        res.status(201).json({ success: true, data: observation });
    } catch (error) {
        next(error);
    }
});

router.get('/eleve/:eleveId/observations', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ← NOUVEAU: Validation année scolaire obligatoire
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const periodeId = req.query.periodeId as string; // ← NOUVEAU
        
        const result = await suiviEleveService.getObservationsByEleve(
            req.params.eleveId,
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

// ==================== SANCTIONS ====================
router.post('/sanctions', staffOnly, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createSanctionEleveSchema, req.body);
        const sanction = await suiviEleveService.createSanction(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            req
        );
        res.status(201).json({ success: true, data: sanction });
    } catch (error) {
        next(error);
    }
});

// ==================== FELICITATIONS ====================
router.post('/felicitations', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createFelicitationEleveSchema, req.body);
        const felicitation = await suiviEleveService.createFelicitation(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            req
        );
        res.status(201).json({ success: true, data: felicitation });
    } catch (error) {
        next(error);
    }
});

router.get('/eleve/:eleveId/felicitations', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const periodeId = req.query.periodeId as string; // ← NOUVEAU
        
        const result = await suiviEleveService.getFelicitationsByEleve(
            req.params.eleveId,
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

// ==================== SANCTIONS LISTE ====================
router.get('/eleve/:eleveId/sanctions', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const periodeId = req.query.periodeId as string; // ← NOUVEAU
        
        const result = await suiviEleveService.getSanctionsByEleve(
            req.params.eleveId,
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

// ==================== DASHBOARD ====================
router.get('/eleve/:eleveId/dashboard', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dashboard = await suiviEleveService.getDashboardEleve(
            req.params.eleveId,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: dashboard });
    } catch (error) {
        next(error);
    }
});

export const suiviElevesController = router;
export default router;
