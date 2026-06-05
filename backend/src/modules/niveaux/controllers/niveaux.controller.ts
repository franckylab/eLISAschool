/**
 * ==================================
 * eLISAschool - Controller Niveaux
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NiveauxService } from '../services';
import { createNiveauSchema, updateNiveauSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const niveauxService = new NiveauxService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cycleId = req.query.cycleId as string;
        const niveaux = await niveauxService.findAll(cycleId);
        res.json({ success: true, data: niveaux });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createNiveauSchema, req.body);
        const niveau = await niveauxService.create(dto);
        res.status(201).json({ success: true, data: niveau });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateNiveauSchema, req.body);
        const niveau = await niveauxService.update(req.params.id, dto);
        res.json({ success: true, data: niveau });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await niveauxService.delete(req.params.id);
        res.json({ success: true, message: 'Niveau supprimé' });
    } catch (error) { next(error); }
});

export const niveauxController = router;
export default router;
