/**
 * ==================================
 * eLISAschool - Controller Bulletins v2.0
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { BulletinsService } from '../services';
import { generateBulletinSchema, updateBulletinSchema, queryBulletinsSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const service = new BulletinsService();

router.post('/generate', authMiddleware, requirePermission('bulletins:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(generateBulletinSchema, req.body);
        const bulletins = await service.generate(dto, req.etablissementId);
        res.json({ success: true, count: bulletins.length, data: bulletins });
    } catch (error) { next(error); }
});

router.get('/', authMiddleware, requirePermission('bulletins:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryBulletinsSchema, req.query);
        const result = await service.findAllPaginated(query, req.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/eleve/:eleveId', authMiddleware, requirePermission('bulletins:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bulletins = await service.findByEleve(req.params.eleveId, req.etablissementId);
        res.json({ success: true, data: bulletins });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requirePermission('bulletins:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bulletin = await service.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: bulletin });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('bulletins:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateBulletinSchema, req.body);
        const bulletin = await service.update(req.params.id, dto);
        res.json({ success: true, data: bulletin });
    } catch (error) { next(error); }
});

export const bulletinsController = router;
export default router;
