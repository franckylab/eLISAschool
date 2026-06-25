/**
 * ==================================
 * eLISAschool - Controller Examens-Nationaux
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ExamensNationauxService } from '../services';
import { createExamenNationalSchema, updateExamenNationalSchema, queryExamensNationauxSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';

const router = Router();
const examensNationauxService = new ExamensNationauxService();

// GET /api/examens-nationaux - Liste paginée
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryExamensNationauxSchema, req.query);
        const result = await examensNationauxService.findAll(query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// GET /api/examens-nationaux/all - Liste complète pour dropdowns
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const niveauId = req.query.niveauId as string | undefined;
        const examens = await examensNationauxService.findAllSimple(niveauId);
        res.json({ success: true, data: examens });
    } catch (error) { next(error); }
});

// GET /api/examens-nationaux/:id - Détail d'un examen
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const examen = await examensNationauxService.findOne(req.params.id);
        res.json({ success: true, data: examen });
    } catch (error) { next(error); }
});

// POST /api/examens-nationaux - Créer un examen
router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createExamenNationalSchema, req.body);
        const examen = await examensNationauxService.create(dto);
        res.status(201).json({ success: true, data: examen });
    } catch (error) { next(error); }
});

// PATCH /api/examens-nationaux/:id - Modifier un examen
router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateExamenNationalSchema, req.body);
        const examen = await examensNationauxService.update(req.params.id, dto);
        res.json({ success: true, data: examen });
    } catch (error) { next(error); }
});

// DELETE /api/examens-nationaux/:id - Supprimer un examen
router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await examensNationauxService.delete(req.params.id);
        res.json({ success: true, message: 'Examen national supprimé' });
    } catch (error) { next(error); }
});

export const examensNationauxController = router;
export default router;
