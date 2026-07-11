/**
 * ==================================
 * eLISAschool - Controller Personnel
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PersonnelService } from '../services';
import { createPersonnelSchema, updatePersonnelSchema, createTypePersonnelSchema, queryPersonnelSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new PersonnelService();

// Types Personnel
router.get('/types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const types = await service.getTypes();
        res.json({ success: true, data: types });
    } catch (error) { next(error); }
});

router.post('/types', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createTypePersonnelSchema, req.body);
        const type = await service.createType(dto);
        res.status(201).json({ success: true, data: type });
    } catch (error) { next(error); }
});

// Membres
router.get('/', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryPersonnelSchema, req.query);
        // Support frontend `actif` boolean → statut 'ACTIF'
        if (query.actif === true) {
            (query as any).statut = 'ACTIF';
        }
        const membres = await service.findAll(query, req.etablissementId);
        res.json({ success: true, data: membres });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membre = await service.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createPersonnelSchema, req.body);
        const membre = await service.createMembre(dto, req.etablissementId, req.utilisateur?.id);
        res.status(201).json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updatePersonnelSchema, req.body);
        const membre = await service.update(req.params.id, dto, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id, req.etablissementId);
        res.json({ success: true, message: 'Membre supprimé' });
    } catch (error) { next(error); }
});

export const personnelController = router;
export default router;
