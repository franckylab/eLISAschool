import { Router, Request, Response, NextFunction } from 'express';
import { typeRetenueService } from '../services/type-retenue.service';
import { createTypeRetenueSchema, updateTypeRetenueSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const retenues = await typeRetenueService.findAll(req.etablissementId!);
        res.json({ success: true, data: retenues });
    } catch (e) { next(e); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const retenue = await typeRetenueService.findOne(req.params.id, req.etablissementId!);
        res.json({ success: true, data: retenue });
    } catch (e) { next(e); }
});

router.post('/', authMiddleware, requirePermission('paie:config:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createTypeRetenueSchema, req.body);
        const retenue = await typeRetenueService.create(dto, req.etablissementId!, req.utilisateur?.id, req);
        res.status(201).json({ success: true, data: retenue });
    } catch (e) { next(e); }
});

router.patch('/:id', authMiddleware, requirePermission('paie:config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateTypeRetenueSchema, req.body);
        const retenue = await typeRetenueService.update(req.params.id, dto, req.etablissementId!, req.utilisateur?.id, req);
        res.json({ success: true, data: retenue });
    } catch (e) { next(e); }
});

router.delete('/:id', authMiddleware, requirePermission('paie:config:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await typeRetenueService.delete(req.params.id, req.etablissementId!, req.utilisateur?.id, req);
        res.json({ success: true });
    } catch (e) { next(e); }
});

export const typesRetenuesController = router;
export default router;
