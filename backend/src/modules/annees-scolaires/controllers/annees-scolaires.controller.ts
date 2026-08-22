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
import { Permission } from '@shared/enums/roles.enum';

const router = Router();
const service = new AnneesScolairesService();

router.get('/', authMiddleware, requirePermission(Permission.ANNEES_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const page = req.query.page ? parseInt(req.query.page as string) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        const sortBy = req.query.sortBy as string | undefined;
        const sortOrder = req.query.sortOrder as 'ASC' | 'DESC' | undefined;
        const filtres = {
            statut: req.query.statut as string | undefined,
            recherche: req.query.recherche as string | undefined,
        };

        // Si pagination demandée, utiliser findPaginated
        if (page || limit) {
            const result = await service.findPaginated(etablissementId, {
                page, limit, sortBy, sortOrder, ...filtres,
            });
            return res.json({ success: true, ...result });
        }

        // Sinon, retourner toutes les années (rétrocompatibilité)
        const annees = await service.findAll(etablissementId, filtres);
        res.json({ success: true, data: annees });
    } catch (error) { next(error); }
});

router.get('/active', authMiddleware, requirePermission(Permission.ANNEES_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.findActive(etablissementId);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requirePermission(Permission.ANNEES_VIEW), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.findOne(req.params.id, etablissementId);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission(Permission.ANNEES_CREATE), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const dto = validateDto(createAnneeScolaireSchema, req.body);
        const annee = await service.create(dto, etablissementId, req.utilisateur?.id, req);
        res.status(201).json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission(Permission.ANNEES_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const dto = validateDto(updateAnneeScolaireSchema, req.body);
        const annee = await service.update(req.params.id, dto, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/:id/activer', authMiddleware, requirePermission(Permission.ANNEES_ACTIVER), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.activer(req.params.id, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/:id/cloturer', authMiddleware, requirePermission(Permission.ANNEES_CLOTURER), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.cloturer(req.params.id, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.post('/:id/reouvrir', authMiddleware, requirePermission(Permission.ANNEES_REOUVRIR), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const annee = await service.reouvrir(req.params.id, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, data: annee });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission(Permission.ANNEES_DELETE), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        await service.delete(req.params.id, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, message: 'Année scolaire supprimée' });
    } catch (error) { next(error); }
});

export const anneesScolairesController = router;
export default router;
