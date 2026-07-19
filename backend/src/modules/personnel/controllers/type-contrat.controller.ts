import { Router, Request, Response, NextFunction } from 'express';
import { typeContratService } from '../services/type-contrat.service';
import { createTypeContratSchema, updateTypeContratSchema, queryTypeContratSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();

router.post(
    '/',
    authMiddleware,
    requirePermission('contrats:config:create'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createTypeContratSchema, req.body);
            const typeContrat = await typeContratService.create(dto, req.etablissementId!, req.utilisateur?.id, req);
            res.status(201).json({ success: true, data: typeContrat });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/',
    authMiddleware,
    requirePermission('contrats:config:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryTypeContratSchema, req.query);
            const result = await typeContratService.findAll(query, req.etablissementId!);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/actifs',
    authMiddleware,
    requirePermission('contrats:config:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const types = await typeContratService.getTypesActifs(req.etablissementId!);
            res.json({ success: true, data: types });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/:id',
    authMiddleware,
    requirePermission('contrats:config:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const typeContrat = await typeContratService.findOne(req.params.id, req.etablissementId!);
            res.json({ success: true, data: typeContrat });
        } catch (error) {
            next(error);
        }
    }
);

router.patch(
    '/:id',
    authMiddleware,
    requirePermission('contrats:config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateTypeContratSchema, req.body);
            const typeContrat = await typeContratService.update(
                req.params.id,
                dto,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: typeContrat });
        } catch (error) {
            next(error);
        }
    }
);

router.delete(
    '/:id',
    authMiddleware,
    requirePermission('contrats:config:delete'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await typeContratService.delete(req.params.id, req.utilisateur?.id!, req.etablissementId!, req);
            res.json({ success: true, message: 'Type de contrat supprimé' });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    '/:id/toggle',
    authMiddleware,
    requirePermission('contrats:config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const typeContrat = await typeContratService.toggleActif(
                req.params.id,
                req.utilisateur?.id!,
                req.etablissementId!,
                req
            );
            res.json({ success: true, data: typeContrat });
        } catch (error) {
            next(error);
        }
    }
);

export const typeContratController = router;
export default router;
