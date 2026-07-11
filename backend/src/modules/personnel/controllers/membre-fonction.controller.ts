import { Router, Request, Response, NextFunction } from 'express';
import { MembreFonctionService } from '../services/membre-fonction.service';
import { createMembreFonctionSchema, updateMembreFonctionSchema } from '../dto/membre-fonction.dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const service = new MembreFonctionService();

router.get('/membre/:membrePersonnelId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const data = await service.findByMembre(req.params.membrePersonnelId, etablissementId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('personnel:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createMembreFonctionSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const data = await service.create(dto, etablissementId);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('personnel:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateMembreFonctionSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const data = await service.update(req.params.id, dto, etablissementId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('personnel:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        await service.delete(req.params.id, etablissementId);
        res.json({ success: true, message: 'Fonction retirée du membre' });
    } catch (error) { next(error); }
});

export const membreFonctionController = router;
export default router;
