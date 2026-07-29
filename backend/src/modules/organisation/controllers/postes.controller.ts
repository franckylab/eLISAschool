import { Router, Request, Response, NextFunction } from 'express';
import { postesService } from '../services/postes.service';
import { createPosteSchema, updatePosteSchema, queryPostesSchema } from '../dto/poste.dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils/validate-dto.util';

const router = Router();

/** Guard : vérifie que etablissementId est présent dans le token */
function getEtablissementId(req: Request): string {
    const id = req.utilisateur?.etablissementId;
    if (!id) throw new AppError('etablissementId manquant dans le token', 400, 'MISSING_ETABLISSEMENT_ID');
    return id;
}

router.get('/', authMiddleware, requirePermission('organisation:postes:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryPostesSchema, req.query);
        const result = await postesService.findAll(query, getEtablissementId(req));
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/all', authMiddleware, requirePermission('organisation:postes:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postes = await postesService.findAllSimple(getEtablissementId(req));
        res.json({ success: true, data: postes });
    } catch (error) { next(error); }
});

router.get('/vacants', authMiddleware, requirePermission('organisation:postes:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postes = await postesService.findVacants(getEtablissementId(req));
        res.json({ success: true, data: postes });
    } catch (error) { next(error); }
});

router.get('/fonction/:fonctionId', authMiddleware, requirePermission('organisation:postes:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postes = await postesService.findByFonction(req.params.fonctionId, getEtablissementId(req));
        res.json({ success: true, data: postes });
    } catch (error) { next(error); }
});

router.get('/statistiques', authMiddleware, requirePermission('organisation:postes:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await postesService.getStatistiques(getEtablissementId(req));
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requirePermission('organisation:postes:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const poste = await postesService.findById(req.params.id, getEtablissementId(req));
        res.json({ success: true, data: poste });
    } catch (error) { next(error); }
});

router.get('/:id/occupants', authMiddleware, requirePermission('organisation:postes:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const occupants = await postesService.findOccupants(req.params.id, getEtablissementId(req));
        res.json({ success: true, data: occupants });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('organisation:postes:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createPosteSchema, req.body);
        const created = await postesService.create(dto, getEtablissementId(req), req.utilisateur?.id);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('organisation:postes:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updatePosteSchema, req.body);
        const updated = await postesService.update(req.params.id, dto, getEtablissementId(req), req.utilisateur?.id);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('organisation:postes:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await postesService.delete(req.params.id, getEtablissementId(req), req.utilisateur?.id);
        res.json({ success: true, message: 'Poste supprimé' });
    } catch (error) { next(error); }
});

export const postesController = router;
export default router;
