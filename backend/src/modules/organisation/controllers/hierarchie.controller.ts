import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import { historiqueService } from '../services/historique-clonage.service';
import {
    createHierarchiePersonnelSchema,
    updateHierarchiePersonnelSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', false, result.error.errors);
    }
    return result.data;
}

router.get('/hierarchie', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const personnelId = req.query.personnelId as string | undefined;
        const hierarchies = await organisationService.findHierarchies(req.utilisateur!.etablissementId!, personnelId);
        res.json({ success: true, data: hierarchies });
    } catch (error) { next(error); }
});

router.post('/hierarchie', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createHierarchiePersonnelSchema, req.body);
        dto.etablissementId = req.utilisateur!.etablissementId!;
        const created = await organisationService.createHierarchie(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.patch('/hierarchie/:id', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateHierarchiePersonnelSchema, req.body);
        const updated = await organisationService.updateHierarchie(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/hierarchie/:id', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deleteHierarchie(req.params.id);
        res.json({ success: true, message: 'Relation hiérarchique supprimée' });
    } catch (error) { next(error); }
});

router.get('/hierarchie/superieurs/:personnelId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const superieurs = await organisationService.findSuperieurs(req.params.personnelId, req.utilisateur!.etablissementId!);
        res.json({ success: true, data: superieurs });
    } catch (error) { next(error); }
});

router.get('/hierarchie/subordonnes/:superieurId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subordonnes = await organisationService.findSubordonnes(req.params.superieurId, req.utilisateur!.etablissementId!);
        res.json({ success: true, data: subordonnes });
    } catch (error) { next(error); }
});

router.get('/historique/:personnelId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const historique = historiqueService.getHistoriquePersonnel(req.params.personnelId, limit);
        res.json({ success: true, data: historique });
    } catch (error) { next(error); }
});

router.get('/mouvements-recents', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const mouvements = historiqueService.getMouvementsRecents(req.utilisateur?.etablissementId, limit);
        res.json({ success: true, data: mouvements });
    } catch (error) { next(error); }
});

export const hierarchieController = router;
export default router;
