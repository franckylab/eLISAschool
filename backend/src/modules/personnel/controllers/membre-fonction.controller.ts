import { Router, Request, Response, NextFunction } from 'express';
import { MembreFonctionService } from '../services/membre-fonction.service';
import { createMembreFonctionSchema, updateMembreFonctionSchema } from '../dto/membre-fonction.dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const service = new MembreFonctionService();

router.get('/membre/:membrePersonnelId', authMiddleware, requirePermission('personnel:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await service.findByMembre(req.params.membrePersonnelId, req.etablissementId!);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createMembreFonctionSchema, req.body);
        const data = await service.create(dto, req.etablissementId!, req.utilisateur?.id);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateMembreFonctionSchema, req.body);
        const data = await service.update(req.params.id, dto, req.etablissementId!, req.utilisateur?.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id, req.etablissementId!, req.utilisateur?.id);
        res.json({ success: true, message: 'Fonction retirée du membre' });
    } catch (error) { next(error); }
});

export const membreFonctionController = router;
export default router;