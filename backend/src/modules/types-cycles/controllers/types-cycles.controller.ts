/**
 * ==================================
 * eLISAschool - Controller Types-Cycles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { TypesCyclesService } from '../services';
import { createTypeCycleSchema, updateTypeCycleSchema, queryTypesCyclesSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';

const router = Router();
const typesCyclesService = new TypesCyclesService();

// GET /api/types-cycles - Liste paginée
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryTypesCyclesSchema, req.query);
        const result = await typesCyclesService.findAll(query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// GET /api/types-cycles/all - Liste complète pour dropdowns
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const typesCycles = await typesCyclesService.findAllSimple();
        res.json({ success: true, data: typesCycles });
    } catch (error) { next(error); }
});

// GET /api/types-cycles/:id - Détail d'un type de cycle
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const typeCycle = await typesCyclesService.findOne(req.params.id);
        res.json({ success: true, data: typeCycle });
    } catch (error) { next(error); }
});

// POST /api/types-cycles - Créer un type de cycle
router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createTypeCycleSchema, req.body);
        const typeCycle = await typesCyclesService.create(dto);
        res.status(201).json({ success: true, data: typeCycle });
    } catch (error) { next(error); }
});

// PATCH /api/types-cycles/:id - Modifier un type de cycle
router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateTypeCycleSchema, req.body);
        const typeCycle = await typesCyclesService.update(req.params.id, dto);
        res.json({ success: true, data: typeCycle });
    } catch (error) { next(error); }
});

// DELETE /api/types-cycles/:id - Supprimer un type de cycle
router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await typesCyclesService.delete(req.params.id);
        res.json({ success: true, message: 'Type de cycle supprimé' });
    } catch (error) { next(error); }
});

export const typesCyclesController = router;
export default router;
