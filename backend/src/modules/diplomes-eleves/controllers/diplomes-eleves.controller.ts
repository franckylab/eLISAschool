/**
 * ==================================
 * eLISAschool - Controller Diplomes-Eleves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DiplomesElevesService } from '../services';
import { createDiplomeEleveSchema, updateDiplomeEleveSchema, queryDiplomesElevesSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';

const router = Router();
const diplomesElevesService = new DiplomesElevesService();

// GET /api/diplomes-eleves - Liste paginée
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryDiplomesElevesSchema, req.query);
        const result = await diplomesElevesService.findAll(query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// GET /api/diplomes-eleves/all - Liste complète pour dropdowns
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eleveId = req.query.eleveId as string | undefined;
        const diplomes = await diplomesElevesService.findAllSimple(eleveId);
        res.json({ success: true, data: diplomes });
    } catch (error) { next(error); }
});

// GET /api/diplomes-eleves/eleve/:eleveId - Historique diplômes d'un élève
router.get('/eleve/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const diplomes = await diplomesElevesService.findByEleve(req.params.eleveId);
        res.json({ success: true, data: diplomes });
    } catch (error) { next(error); }
});

// GET /api/diplomes-eleves/:id - Détail d'un diplôme
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const diplome = await diplomesElevesService.findOne(req.params.id);
        res.json({ success: true, data: diplome });
    } catch (error) { next(error); }
});

// POST /api/diplomes-eleves - Enregistrer un diplôme
router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createDiplomeEleveSchema, req.body);
        const diplome = await diplomesElevesService.create(dto);
        res.status(201).json({ success: true, data: diplome });
    } catch (error) { next(error); }
});

// PATCH /api/diplomes-eleves/:id - Modifier un diplôme
router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateDiplomeEleveSchema, req.body);
        const diplome = await diplomesElevesService.update(req.params.id, dto);
        res.json({ success: true, data: diplome });
    } catch (error) { next(error); }
});

// DELETE /api/diplomes-eleves/:id - Supprimer un diplôme
router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await diplomesElevesService.delete(req.params.id);
        res.json({ success: true, message: 'Diplôme supprimé' });
    } catch (error) { next(error); }
});

export const diplomesElevesController = router;
export default router;
