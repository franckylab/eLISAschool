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
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new ElevesService();

function validate<T>(schema: any, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.get('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sousSysteme = req.query.sousSysteme as string;
        const eleves = await service.findAll(sousSysteme);
        res.json({ success: true, data: eleves });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.PERSONNEL), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createEleveSchema, req.body);
        const eleve = await service.create(dto);
        res.status(201).json({ success: true, data: eleve });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.PERSONNEL), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateEleveSchema, req.body);
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
