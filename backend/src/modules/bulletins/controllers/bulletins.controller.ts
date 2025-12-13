/**
 * ==================================
 * eLISAschool - Controller Bulletins
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { BulletinsService } from '../services';
import { generateBulletinSchema, updateBulletinSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new BulletinsService();

function validate<T>(schema: any, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.post('/generate', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(generateBulletinSchema, req.body);
        const bulletins = await service.generate(dto);
        res.json({ success: true, count: bulletins.length, data: bulletins });
    } catch (error) { next(error); }
});

router.get('/eleve/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bulletins = await service.findByEleve(req.params.eleveId);
        res.json({ success: true, data: bulletins });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateBulletinSchema, req.body);
        const bulletin = await service.update(req.params.id, dto);
        res.json({ success: true, data: bulletin });
    } catch (error) { next(error); }
});

export const bulletinsController = router;
export default router;
