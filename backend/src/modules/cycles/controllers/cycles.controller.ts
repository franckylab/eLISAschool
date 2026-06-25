/**
 * ==================================
 * eLISAschool - Controller Cycles
 * ==================================
 * Version: 2.0.0
 * 
 * Changements v2.0:
 * - Toutes les routes passent etablissementId au service (multi-tenant)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { CyclesService } from '../services';
import { createCycleSchema, updateCycleSchema, queryCyclesSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';

const router = Router();
const cyclesService = new CyclesService();

/**
 * GET /api/cycles
 * Liste paginée avec recherche et filtres (scopée par établissement)
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryCyclesSchema, req.query);
        const result = await cyclesService.findAll(query, req.etablissementId!);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * GET /api/cycles/all
 * Liste complète (sans pagination) — pour les selects/dropdowns
 */
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cycles = await cyclesService.findAllSimple(req.etablissementId!);
        res.json({ success: true, data: cycles });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createCycleSchema, req.body);
        const cycle = await cyclesService.create(dto, req.etablissementId!);
        res.status(201).json({ success: true, data: cycle });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateCycleSchema, req.body);
        const cycle = await cyclesService.update(req.params.id, dto, req.etablissementId!);
        res.json({ success: true, data: cycle });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await cyclesService.delete(req.params.id, req.etablissementId!);
        res.json({ success: true, message: 'Cycle supprimé' });
    } catch (error) { next(error); }
});

export const cyclesController = router;
export default router;
