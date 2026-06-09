/**
 * ==================================
 * eLISAschool - Controller Scoring Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Endpoints REST pour:
 * - Gestion des scores du personnel
 * - Classement multi-dimensionnel
 * - Gestion des règles de scoring
 * - Historique des modifications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { scoringPersonnelService } from '../services/scoring-personnel.service';
import {
    createRegleScoringSchema,
    updateRegleScoringSchema,
    attribuerPointsSchema,
    recalculerScoreSchema,
    classementPersonnelSchema,
} from '../dto/scoring-personnel.dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = scoringPersonnelService;

// Helper de validation Zod
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', false, result.error.errors);
    }
    return result.data;
}

// =====================================================
// CLASSEMENT ET SCORES
// =====================================================

/**
 * GET /api/scoring-personnel/classement
 * Obtenir le classement du personnel avec filtres multi-dimensionnels
 */
router.get('/classement', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(classementPersonnelSchema, req.query);
        const etablissementId = req.utilisateur?.etablissementId || (dto as any).etablissementId;

        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT');
        }

        const result = await service.getClassement(dto as any, etablissementId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/scoring-personnel/score/:membrePersonnelId
 * Obtenir le score d'un membre du personnel
 */
router.get('/score/:membrePersonnelId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { membrePersonnelId } = req.params;
        const { anneeScolaireId } = req.query;
        const etablissementId = req.utilisateur?.etablissementId;

        if (!etablissementId || !anneeScolaireId) {
            throw new AppError('anneeScolaireId requis', 400, 'MISSING_ANNEE');
        }

        const score = await service.recalculerScore({
            membrePersonnelId,
            anneeScolaireId: anneeScolaireId as string,
            force: false,
        }, etablissementId);

        res.json({ success: true, data: score });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/scoring-personnel/recalculer
 * Recalculer le score d'un membre du personnel
 */
router.post('/recalculer', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(recalculerScoreSchema, req.body);
        const etablissementId = req.utilisateur?.etablissementId;

        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT');
        }

        const score = await service.recalculerScore(dto, etablissementId, req.utilisateur?.id);
        res.json({ success: true, data: score });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// ATTRIBUTION DE POINTS
// =====================================================

/**
 * POST /api/scoring-personnel/points
 * Attribuer des points manuellement à un membre du personnel
 */
router.post('/points', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(attribuerPointsSchema, req.body);
        const { anneeScolaireId } = req.body;
        const etablissementId = req.utilisateur?.etablissementId;

        if (!etablissementId || !anneeScolaireId) {
            throw new AppError('anneeScolaireId requis', 400, 'MISSING_ANNEE');
        }

        const historique = await service.attribuerPoints(dto, etablissementId, anneeScolaireId, req.utilisateur?.id);
        res.status(201).json({ success: true, data: historique });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// GESTION DES RÈGLES DE SCORING
// =====================================================

/**
 * GET /api/scoring-personnel/regles
 * Obtenir toutes les règles de scoring actives
 */
router.get('/regles', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;

        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT');
        }

        const regles = await service.getReglesActives(etablissementId);
        res.json({ success: true, data: regles });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/scoring-personnel/regles
 * Créer une nouvelle règle de scoring
 */
router.post('/regles', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createRegleScoringSchema, req.body);
        const etablissementId = req.utilisateur?.etablissementId;

        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT');
        }

        const regle = await service.createRegle(dto, etablissementId);
        res.status(201).json({ success: true, data: regle });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/scoring-personnel/regles/:id
 * Mettre à jour une règle de scoring
 */
router.patch('/regles/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const dto = validate(updateRegleScoringSchema, req.body);
        const etablissementId = req.utilisateur?.etablissementId;

        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT');
        }

        const regle = await service.updateRegle(id, dto, etablissementId);
        res.json({ success: true, data: regle });
    } catch (error) {
        next(error);
    }
});

// =====================================================
// RECUL MANUEL (pour admin)
// =====================================================

/**
 * POST /api/scoring-personnel/recalculer-tous
 * Recalculer les scores de tous les membres du personnel
 */
router.post('/recalculer-tous', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { runScoringRecalculManual } = await import('../cron-jobs');
        const etablissementId = req.utilisateur?.etablissementId;

        await runScoringRecalculManual(etablissementId);
        res.json({ success: true, message: 'Recalcul de tous les scores lancé' });
    } catch (error) {
        next(error);
    }
});

export const scoringPersonnelController = router;
export default router;
