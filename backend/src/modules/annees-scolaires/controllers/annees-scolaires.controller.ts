/**
 * ==================================
 * eLISAschool - Controller Années Scolaires
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AnneesScolairesService } from '../services';
import { createAnneeScolaireSchema, updateAnneeScolaireSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { getEtablissementId } from '@modules/auth/middlewares/etablissement.middleware';
import { validateDto } from '@common/utils';

const router = Router();
const service = new AnneesScolairesService();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annees = await service.findAll(etablissementId);
        res.json({ success: true, data: annees });
    } catch (error) { next(error); }
});

router.get('/active', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.findActive(etablissementId);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.findOne(req.params.id, etablissementId);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const dto = validateDto(createAnneeScolaireSchema, req.body);
        const annee = await service.create(dto, etablissementId, req.utilisateur?.id, req);
        res.status(201).json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const dto = validateDto(updateAnneeScolaireSchema, req.body);
        const annee = await service.update(req.params.id, dto, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/:id/activer', authMiddleware, requirePermission('annees-scolaires:activer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.activer(req.params.id, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/:id/cloturer', authMiddleware, requirePermission('annees-scolaires:cloturer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.cloturer(req.params.id, etablissementId, req.utilisateur?.id);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/:id/reouvrir', authMiddleware, requirePermission('annees-scolaires:reouvrir'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.reouvrir(req.params.id, etablissementId);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        await service.delete(req.params.id, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, message: 'Année scolaire supprimée' });
    } catch (error) { next(error); }
});

export const anneesScolairesController = router;
export default router;
