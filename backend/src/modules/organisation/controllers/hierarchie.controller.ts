import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import {
    createHierarchiePersonnelSchema,
    updateHierarchiePersonnelSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils/validate-dto.util';

const router = Router();

/**
 * Guard : vérifie que etablissementId est présent dans le token
 */
function getEtablissementId(req: Request): string {
    const id = req.utilisateur?.etablissementId;
    if (!id) throw new AppError('etablissementId manquant dans le token', 400, 'MISSING_ETABLISSEMENT_ID');
    return id;
}

router.get('/hierarchie', authMiddleware, requirePermission('organisation:hierarchie:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const personnelId = req.query.personnelId as string | undefined;
        const hierarchies = await organisationService.findHierarchies(getEtablissementId(req), personnelId);
        res.json({ success: true, data: hierarchies });
    } catch (error) { next(error); }
});

router.post('/hierarchie', authMiddleware, requirePermission('organisation:hierarchie:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createHierarchiePersonnelSchema, req.body);
        dto.etablissementId = getEtablissementId(req);
        const created = await organisationService.createHierarchie(dto, req.utilisateur?.id);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.patch('/hierarchie/:id', authMiddleware, requirePermission('organisation:hierarchie:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateHierarchiePersonnelSchema, req.body);
        const updated = await organisationService.updateHierarchie(req.params.id, dto, getEtablissementId(req), req.utilisateur?.id);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/hierarchie/:id', authMiddleware, requirePermission('organisation:hierarchie:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deleteHierarchie(req.params.id, getEtablissementId(req), req.utilisateur?.id);
        res.json({ success: true, message: 'Relation hiérarchique supprimée' });
    } catch (error) { next(error); }
});

router.get('/hierarchie/superieurs/:personnelId', authMiddleware, requirePermission('organisation:hierarchie:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const superieurs = await organisationService.findSuperieurs(req.params.personnelId, getEtablissementId(req));
        res.json({ success: true, data: superieurs });
    } catch (error) { next(error); }
});

router.get('/hierarchie/subordonnes/:superieurId', authMiddleware, requirePermission('organisation:hierarchie:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subordonnes = await organisationService.findSubordonnes(req.params.superieurId, getEtablissementId(req));
        res.json({ success: true, data: subordonnes });
    } catch (error) { next(error); }
});

export const hierarchieController = router;
export default router;
