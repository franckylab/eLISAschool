/**
 * ==================================
 * eLISAschool - Controller ProgrammeChapitre
 * ==================================
 * Module: Programmes Pédagogiques
 */

import { Router, Request, Response, NextFunction } from 'express';
import { programmeChapitreService } from '../services/programme-chapitre.service';
import { createProgrammeChapitreSchema, updateProgrammeChapitreSchema, queryProgrammeChapitreSchema } from '../dto/programme-chapitre.dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Helper de validation
function validateDto(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', result.error.errors);
    }
    return result.data;
}

// ==================== ROUTES CRUD ====================

// POST /api/programmes/chapitres - Créer un chapitre
router.post(
    '/',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createProgrammeChapitreSchema, req.body);
            const created = await programmeChapitreService.create(
                dto,
                (req as any).etablissementId,
                (req as any).utilisateur?.id,
                req
            );
            res.status(201).json({ success: true, data: created });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/programmes/chapitres - Lister tous les chapitres
router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryProgrammeChapitreSchema, req.query);
            const result = await programmeChapitreService.findAll(query, (req as any).etablissementId);
            res.json({ success: true, data: result.items, pagination: result.meta });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/programmes/chapitres/:id - Obtenir un chapitre
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const chapitre = await programmeChapitreService.findOne(req.params.id, (req as any).etablissementId);
            res.json({ success: true, data: chapitre });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/programmes/chapitres/:id - Mettre à jour un chapitre
router.patch(
    '/:id',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateProgrammeChapitreSchema, req.body);
            const updated = await programmeChapitreService.update(
                req.params.id,
                dto,
                (req as any).utilisateur?.id!,
                (req as any).etablissementId,
                req
            );
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/programmes/chapitres/:id - Supprimer un chapitre
router.delete(
    '/:id',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await programmeChapitreService.delete(
                req.params.id,
                (req as any).utilisateur?.id!,
                (req as any).etablissementId,
                req
            );
            res.json({ success: true, message: 'Chapitre supprimé' });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== ROUTES SPÉCIALISÉES ====================

// GET /api/programmes/chapitres/matiere-niveau/:matiereNiveauId
router.get(
    '/matiere-niveau/:matiereNiveauId',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { periodeId } = req.query;
            const chapitres = await programmeChapitreService.getChapitresParMatiereNiveau(
                req.params.matiereNiveauId,
                (req as any).etablissementId,
                periodeId as string
            );
            res.json({ success: true, data: chapitres });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/programmes/chapitres/periode/:periodeId
router.get(
    '/periode/:periodeId',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const chapitres = await programmeChapitreService.getChapitresParPeriode(
                (req as any).etablissementId,
                req.params.periodeId
            );
            res.json({ success: true, data: chapitres });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/programmes/chapitres/volume-horaire/:matiereNiveauId
router.get(
    '/volume-horaire/:matiereNiveauId',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const volume = await programmeChapitreService.getVolumeHoraireTotal(req.params.matiereNiveauId);
            res.json({ success: true, data: volume });
        } catch (error) {
            next(error);
        }
    }
);

export const programmeChapitreController = router;
