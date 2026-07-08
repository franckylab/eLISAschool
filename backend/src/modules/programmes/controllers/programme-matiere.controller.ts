import { Router, Request, Response, NextFunction } from 'express';
import { programmeMatiereService } from '../services/programme-matiere.service';
import {
    addMatiereProgrammeSchema, updateMatiereProgrammeSchema,
    bulkAddMatieresProgrammeSchema, bulkReorderMatieresSchema,
} from '../dto/programme-matiere.dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();

// POST /api/programmes/matieres/bulk-add
router.post(
    '/bulk-add',
    authMiddleware,
    requirePermission('programmes:config:write'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(bulkAddMatieresProgrammeSchema, req.body);
            const { programmeId, matiereNiveauIds } = dto as any;
            const result = await programmeMatiereService.bulkAdd(
                programmeId || req.body.programmeId,
                { matiereNiveauIds },
                req.etablissementId!
            );
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/programmes/matieres
router.post(
    '/',
    authMiddleware,
    requirePermission('programmes:config:write'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(addMatiereProgrammeSchema, req.body);
            const { programmeId } = req.body as any;
            if (!programmeId) {
                return res.status(400).json({ success: false, message: 'programmeId requis' });
            }
            const result = await programmeMatiereService.add(programmeId, dto, req.etablissementId!);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/programmes/matieres/by-matiere-niveau/:matiereNiveauId
router.get(
    '/by-matiere-niveau/:matiereNiveauId',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const items = await programmeMatiereService.findByMatiereNiveau(req.params.matiereNiveauId);
            res.json({ success: true, data: items });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/programmes/matieres/by-matiere/:matiereId
router.get(
    '/by-matiere/:matiereId',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const items = await programmeMatiereService.findByMatiere(req.params.matiereId, req.etablissementId!);
            res.json({ success: true, data: items });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/programmes/matieres/all
router.get(
    '/all',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query as any;
            const result = await programmeMatiereService.findAll(query, req.etablissementId!);
            res.json({ success: true, data: result.items, pagination: result.meta });
        } catch (error) {
            next(error);
        }
    }
);

// PATCH /api/programmes/matieres/:id
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('programmes:config:write'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateMatiereProgrammeSchema, req.body);
            const updated = await programmeMatiereService.update(req.params.id, dto, req.etablissementId!);
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/programmes/matieres/:id
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('programmes:config:write'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await programmeMatiereService.remove(req.params.id, req.etablissementId!);
            res.json({ success: true, message: 'Matière retirée du programme' });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/programmes/matieres/bulk-reorder
router.post(
    '/bulk-reorder',
    authMiddleware,
    requirePermission('programmes:config:write'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(bulkReorderMatieresSchema, req.body);
            const result = await programmeMatiereService.bulkReorder(
                req.body.programmeId,
                dto,
                req.etablissementId!
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

export const programmeMatiereController = router;
