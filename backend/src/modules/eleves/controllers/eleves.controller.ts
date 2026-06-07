/**
 * ==================================
 * eLISAschool - Controller Élèves
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ElevesService } from '../services';
import { createEleveSchema, updateEleveSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new ElevesService();

router.get('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            sortBy: 'createdAt',
            sortOrder: 'DESC' as const,
            search: req.query.search as string,
            sousSysteme: req.query.sousSysteme as any,
            statut: req.query.statut as any,
            classeId: req.query.classeId as string,
        };
        const eleves = await service.findAll(query, req.etablissementId);
        res.json({ success: true, data: eleves });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.PERSONNEL), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createEleveSchema, req.body);
        const eleve = await service.create(dto, req.etablissementId);
        res.status(201).json({ success: true, data: eleve });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.PERSONNEL), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateEleveSchema, req.body);
        const eleve = await service.update(req.params.id, dto);
        res.json({ success: true, data: eleve });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id);
        res.json({ success: true, message: 'Dossier élève supprimé' });
    } catch (error) { next(error); }
});

export const elevesController = router;
export default router;
