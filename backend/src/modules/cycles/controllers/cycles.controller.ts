/**
 * ==================================
 * eLISAschool - Controller Cycles
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { CyclesService } from '../services';
import { createCycleSchema, updateCycleSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const cyclesService = new CyclesService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cycles = await cyclesService.findAll();
        res.json({ success: true, data: cycles });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createCycleSchema, req.body);
        const cycle = await cyclesService.create(dto);
        res.status(201).json({ success: true, data: cycle });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateCycleSchema, req.body);
        const cycle = await cyclesService.update(req.params.id, dto);
        res.json({ success: true, data: cycle });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await cyclesService.delete(req.params.id);
        res.json({ success: true, message: 'Cycle supprimé' });
    } catch (error) { next(error); }
});

export const cyclesController = router;
export default router;
