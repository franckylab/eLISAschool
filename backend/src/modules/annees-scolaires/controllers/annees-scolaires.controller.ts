/**
 * ==================================
 * eLISAschool - Controller Années Scolaires
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AnneesScolairesService } from '../services';
import { createAnneeScolaireSchema, updateAnneeScolaireSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new AnneesScolairesService();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const annees = await service.findAll();
        res.json({ success: true, data: annees });
    } catch (error) { next(error); }
});

router.get('/active', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const annee = await service.findActive();
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createAnneeScolaireSchema, req.body);
        const annee = await service.create(dto, req.utilisateur?.id, req.etablissementId);
        res.status(201).json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateAnneeScolaireSchema, req.body);
        const annee = await service.update(req.params.id, dto, req.utilisateur?.id, req.etablissementId);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id);
        res.json({ success: true, message: 'Année scolaire supprimée' });
    } catch (error) { next(error); }
});

export const anneesScolairesController = router;
export default router;
