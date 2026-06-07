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
import { validateDto } from '@common/utils';

const router = Router();
const service = new BulletinsService();

router.post('/generate', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(generateBulletinSchema, req.body);
        const bulletins = await service.generate(dto, req.etablissementId);
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
        const dto = validateDto(updateBulletinSchema, req.body);
        const bulletin = await service.update(req.params.id, dto);
        res.json({ success: true, data: bulletin });
    } catch (error) { next(error); }
});

export const bulletinsController = router;
export default router;
