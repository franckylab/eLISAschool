/**
 * ==================================
 * eLISAschool - Controller Niveaux
 * ==================================
 * Version: 2.0.0
 * 
 * Changements v2.0:
 * - Toutes les routes passent etablissementId au service (multi-tenant)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NiveauxService } from '../services';
import { createNiveauSchema, updateNiveauSchema, queryNiveauxSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';

const router = Router();
const niveauxService = new NiveauxService();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryNiveauxSchema, req.query);
        const result = await niveauxService.findAll(query, req.etablissementId!);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// GET /api/niveaux/all - Liste complète pour dropdowns (scopée par établissement)
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cycleId = req.query.cycleId as string | undefined;
        const niveaux = await niveauxService.findAllSimple(req.etablissementId!, cycleId);
        res.json({ success: true, data: niveaux });
    } catch (error) { next(error); }
});

// GET /api/niveaux/:id - Détail d'un niveau
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const niveau = await niveauxService.findOne(req.params.id, req.etablissementId!);
        res.json({ success: true, data: niveau });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createNiveauSchema, req.body);
        const niveau = await niveauxService.create(dto, req.etablissementId!, req.utilisateur?.id);
        res.status(201).json({ success: true, data: niveau });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateNiveauSchema, req.body);
        const niveau = await niveauxService.update(req.params.id, dto, req.etablissementId!, req.utilisateur?.id);
        res.json({ success: true, data: niveau });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await niveauxService.delete(req.params.id, req.etablissementId!, req.utilisateur?.id);
        res.json({ success: true, message: 'Niveau supprimé' });
    } catch (error) { next(error); }
});

export const niveauxController = router;
export default router;
