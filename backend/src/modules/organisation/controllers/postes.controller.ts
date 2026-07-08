import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import { postesVacantsService } from '../services/postes-vacants.service';
import {
    createPosteSchema,
    updatePosteSchema,
    filtrePostesSchema,
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

router.get('/postes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filtres = validate(filtrePostesSchema, req.query);
        const postes = await organisationService.findPostes(filtres, req.utilisateur?.etablissementId);
        res.json({ success: true, data: postes });
    } catch (error) { next(error); }
});

router.post('/postes', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createPosteSchema, req.body);
        const created = await organisationService.createPoste(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/postes/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const poste = await organisationService.findPosteById(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data: poste });
    } catch (error) { next(error); }
});

router.patch('/postes/:id', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updatePosteSchema, req.body);
        const updated = await organisationService.updatePoste(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/postes/:id', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deletePoste(req.params.id);
        res.json({ success: true, message: 'Poste supprimé' });
    } catch (error) { next(error); }
});

router.post('/postes/:id/assigner', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { occupantId, occupantNom } = req.body;
        if (!occupantId || !occupantNom) throw new AppError('occupantId et occupantNom sont requis', 400, 'VALIDATION_ERROR');
        const poste = await organisationService.assignerOccupant(req.params.id, occupantId, occupantNom);
        res.json({ success: true, data: poste });
    } catch (error) { next(error); }
});

router.post('/postes/:id/liberer', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const poste = await organisationService.libererPoste(req.params.id);
        res.json({ success: true, data: poste });
    } catch (error) { next(error); }
});

router.get('/postes-vacants', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await postesVacantsService.verifierPostesVacants(req.utilisateur?.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/statistiques-vacance', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await postesVacantsService.getStatistiquesVacance(req.utilisateur?.etablissementId);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

export const postesController = router;
export default router;
