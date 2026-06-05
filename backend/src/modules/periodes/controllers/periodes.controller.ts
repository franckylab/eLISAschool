/**
 * ==================================
 * eLISAschool - Controller Périodes
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PeriodesService } from '../services';
import { createPeriodeSchema, updatePeriodeSchema, createTypePeriodeSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new PeriodesService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Types - Généralement initialisés une fois
router.get('/types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const types = await service.getTypes();
        res.json({ success: true, data: types });
    } catch (error) { next(error); }
});

router.post('/types', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createTypePeriodeSchema, req.body);
        const type = await service.createType(dto);
        res.status(201).json({ success: true, data: type });
    } catch (error) { next(error); }
});

// Périodes
// GET ?anneeId=...
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeId = req.query.anneeId as string;
        if (!anneeId) throw new AppError('anneeId requis', 400, 'MISSING_PARAM');
        const periodes = await service.findAll(anneeId);
        res.json({ success: true, data: periodes });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createPeriodeSchema, req.body);
        const periode = await service.create(dto);
        res.status(201).json({ success: true, data: periode });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updatePeriodeSchema, req.body);
        const periode = await service.update(req.params.id, dto);
        res.json({ success: true, data: periode });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id);
        res.json({ success: true, message: 'Période supprimée' });
    } catch (error) { next(error); }
});

export const periodesController = router;
export default router;
