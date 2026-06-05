/**
 * ==================================
 * eLISAschool - Controller Classes
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ClassesService } from '../services';
import { createClasseSchema, updateClasseSchema, affecterEleveSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new ClassesService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const niveauId = req.query.niveauId as string;
        const anneeId = req.query.anneeId as string;
        const classes = await service.findAll(niveauId, anneeId);
        res.json({ success: true, data: classes });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createClasseSchema, req.body);
        const classe = await service.create(dto);
        res.status(201).json({ success: true, data: classe });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateClasseSchema, req.body);
        const classe = await service.update(req.params.id, dto);
        res.json({ success: true, data: classe });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id);
        res.json({ success: true, message: 'Classe supprimée' });
    } catch (error) { next(error); }
});

router.post('/affectations', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.PERSONNEL, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(affecterEleveSchema, req.body);
        const affectation = await service.affecterEleve(dto);
        res.status(201).json({ success: true, data: affectation });
    } catch (error) { next(error); }
});

export const classesController = router;
export default router;
