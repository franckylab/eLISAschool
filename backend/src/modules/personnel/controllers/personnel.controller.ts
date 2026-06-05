/**
 * ==================================
 * eLISAschool - Controller Personnel
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PersonnelService } from '../services';
import { createPersonnelSchema, updatePersonnelSchema, createTypePersonnelSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new PersonnelService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Types Personnel
router.get('/types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const types = await service.getTypes();
        res.json({ success: true, data: types });
    } catch (error) { next(error); }
});

router.post('/types', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createTypePersonnelSchema, req.body);
        const type = await service.createType(dto);
        res.status(201).json({ success: true, data: type });
    } catch (error) { next(error); }
});

// Membres
router.get('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const typeId = req.query.typeId as string;
        const membres = await service.findAll(typeId, req.etablissementId);
        res.json({ success: true, data: membres });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createPersonnelSchema, req.body);
        const membre = await service.createMembre(dto, req.etablissementId);
        res.status(201).json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updatePersonnelSchema, req.body);
        const membre = await service.update(req.params.id, dto);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id);
        res.json({ success: true, message: 'Membre supprimé' });
    } catch (error) { next(error); }
});

export const personnelController = router;
export default router;
