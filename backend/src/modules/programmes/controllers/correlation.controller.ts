/**
 * ==================================
 * eLISAschool - Controller Corrélation Programme
 * ==================================
 * Module: Programmes Pédagogiques
 * Endpoints pour corrélation progression/évaluation/gamification
 */

import { Router, Request, Response, NextFunction } from 'express';
import { correlationProgrammeService } from '../services/correlation-programme.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';

const router = Router();

// GET /api/programmes/correlation/enseignant/:enseignantId/matiere/:matiereId/classe/:classeId
router.get(
    '/enseignant/:enseignantId/matiere/:matiereId/classe/:classeId',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { periodeId } = req.query;
            const correlation = await correlationProgrammeService.correlerProgressionProgramme(
                req.params.enseignantId,
                req.params.matiereId,
                req.params.classeId,
                (req as any).etablissementId,
                periodeId as string
            );
            res.json({ success: true, data: correlation });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/programmes/correlation/evaluer/:enseignantId
router.post(
    '/evaluer/:enseignantId',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { periodeId } = req.query;
            const evaluation = await correlationProgrammeService.evaluerParCorrelation(
                req.params.enseignantId,
                (req as any).etablissementId,
                periodeId as string
            );
            res.json({ success: true, data: evaluation });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/programmes/correlation/dashboard
router.get(
    '/dashboard',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { periodeId } = req.query;
            const dashboard = await correlationProgrammeService.getDashboardCorrelation(
                (req as any).etablissementId,
                periodeId as string
            );
            res.json({ success: true, data: dashboard });
        } catch (error) {
            next(error);
        }
    }
);

export const correlationController = router;
