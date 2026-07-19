import { Router, Request, Response, NextFunction } from 'express';
import { cotisationService } from '../services/cotisation.service';
import { createCotisationSchema, updateCotisationSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cotisations = await cotisationService.findAll(req.etablissementId!);
        res.json({ success: true, data: cotisations });
    } catch (e) { next(e); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cotisation = await cotisationService.findOne(req.params.id, req.etablissementId!);
        res.json({ success: true, data: cotisation });
    } catch (e) { next(e); }
});

router.post('/', authMiddleware, requirePermission('paie:config:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createCotisationSchema, req.body);
        const cotisation = await cotisationService.create(dto, req.etablissementId!, req.utilisateur?.id, req);
        res.status(201).json({ success: true, data: cotisation });
    } catch (e) { next(e); }
});

router.patch('/:id', authMiddleware, requirePermission('paie:config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateCotisationSchema, req.body);
        const cotisation = await cotisationService.update(req.params.id, dto, req.etablissementId!, req.utilisateur?.id, req);
        res.json({ success: true, data: cotisation });
    } catch (e) { next(e); }
});

router.delete('/:id', authMiddleware, requirePermission('paie:config:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await cotisationService.delete(req.params.id, req.etablissementId!, req.utilisateur?.id, req);
        res.json({ success: true });
    } catch (e) { next(e); }
});

export const cotisationsController = router;
export default router;
