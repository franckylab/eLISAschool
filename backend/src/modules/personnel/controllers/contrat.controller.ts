import { Router, Request, Response, NextFunction } from 'express';
import { ContratService } from '../services';
import { createContratSchema, updateContratSchema, queryContratSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const service = new ContratService();

router.post(
    '/',
    authMiddleware,
    requirePermission('contrats:create'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createContratSchema, req.body);
            const contrat = await service.create(dto, req.etablissementId!, req.utilisateur?.id, req);
            res.status(201).json({ success: true, data: contrat });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/',
    authMiddleware,
    requirePermission('contrats:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryContratSchema, req.query);
            const result = await service.findAll(query, req.etablissementId!);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/:id',
    authMiddleware,
    requirePermission('contrats:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const contrat = await service.findOne(req.params.id, req.etablissementId!);
            res.json({ success: true, data: contrat });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/membres/:id/historique',
    authMiddleware,
    requirePermission('contrats:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const historique = await service.getHistoriqueByMembre(req.params.id, req.etablissementId!);
            res.json({ success: true, data: historique });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/membres/:id/contrats/actif',
    authMiddleware,
    requirePermission('contrats:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const contrat = await service.getContratActif(req.params.id, req.etablissementId!);
            res.json({ success: true, data: contrat });
        } catch (error) {
            next(error);
        }
    }
);

router.patch(
    '/:id',
    authMiddleware,
    requirePermission('contrats:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateContratSchema, req.body);
            const contrat = await service.update(
                req.params.id,
                dto,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: contrat });
        } catch (error) {
            next(error);
        }
    }
);

router.delete(
    '/:id',
    authMiddleware,
    requirePermission('contrats:delete'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await service.delete(req.params.id, req.utilisateur?.id!, req.etablissementId!, req);
            res.json({ success: true, message: 'Contrat supprimé' });
        } catch (error) {
            next(error);
        }
    }
);

export const contratController = router;
export default router;
