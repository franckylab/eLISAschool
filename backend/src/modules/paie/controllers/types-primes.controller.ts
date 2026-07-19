import { Router, Request, Response, NextFunction } from 'express';
import { typePrimeService } from '../services/type-prime.service';
import { createTypePrimeSchema, updateTypePrimeSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const primes = await typePrimeService.findAll(req.etablissementId!);
        res.json({ success: true, data: primes });
    } catch (e) { next(e); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prime = await typePrimeService.findOne(req.params.id, req.etablissementId!);
        res.json({ success: true, data: prime });
    } catch (e) { next(e); }
});

router.post('/', authMiddleware, requirePermission('paie:config:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createTypePrimeSchema, req.body);
        const prime = await typePrimeService.create(dto, req.etablissementId!, req.utilisateur?.id, req);
        res.status(201).json({ success: true, data: prime });
    } catch (e) { next(e); }
});

router.patch('/:id', authMiddleware, requirePermission('paie:config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateTypePrimeSchema, req.body);
        const prime = await typePrimeService.update(req.params.id, dto, req.etablissementId!, req.utilisateur?.id, req);
        res.json({ success: true, data: prime });
    } catch (e) { next(e); }
});

router.delete('/:id', authMiddleware, requirePermission('paie:config:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await typePrimeService.delete(req.params.id, req.etablissementId!, req.utilisateur?.id, req);
        res.json({ success: true });
    } catch (e) { next(e); }
});

export const typesPrimesController = router;
export default router;
