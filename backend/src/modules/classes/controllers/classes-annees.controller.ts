/**
 * ==================================
 * eLISAschool - Controller Classes Années
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { classesAnneesService } from '../services';
import { createClasseAnneeSchema, updateClasseAnneeSchema } from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Routes CRUD Classes Années
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await classesAnneesService.findAll(req.query, req.utilisateur?.etablissementId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createClasseAnneeSchema, req.body);
        const created = await classesAnneesService.create(
            dto,
            req.utilisateur?.id,
            req.utilisateur?.etablissementId
        );
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await classesAnneesService.findOne(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateClasseAnneeSchema, req.body);
        const updated = await classesAnneesService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await classesAnneesService.delete(req.params.id);
        res.json({ success: true, message: 'Classe-année supprimée' });
    } catch (error) { next(error); }
});

export const classesAnneesController = router;
export default router;
