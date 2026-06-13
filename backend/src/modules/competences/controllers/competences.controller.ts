/**
 * ==================================
 * eLISAschool - Controller Competences
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { CompetencesService } from '../services';
import { createCompetenceSchema, updateCompetenceSchema, queryCompetencesSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';

const router = Router();
const competencesService = new CompetencesService();

/**
 * GET /api/competences
 * Liste paginée avec recherche et filtres
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryCompetencesSchema, req.query);
        const result = await competencesService.findAll(query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * GET /api/competences/all
 * Liste complète (sans pagination) — pour les selects/dropdowns
 */
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const competences = await competencesService.findAllSimple();
        res.json({ success: true, data: competences });
    } catch (error) { next(error); }
});

/**
 * GET /api/competences/niveau/:niveauId
 * Liste des compétences d'un niveau
 */
router.get('/niveau/:niveauId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const competences = await competencesService.findByNiveau(req.params.niveauId);
        res.json({ success: true, data: competences });
    } catch (error) { next(error); }
});

/**
 * GET /api/competences/matiere/:matiereId
 * Liste des compétences d'une matière
 */
router.get('/matiere/:matiereId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const competences = await competencesService.findByMatiere(req.params.matiereId);
        res.json({ success: true, data: competences });
    } catch (error) { next(error); }
});

/**
 * GET /api/competences/:id
 * Détail d'une compétence
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const competence = await competencesService.findOne(req.params.id);
        res.json({ success: true, data: competence });
    } catch (error) { next(error); }
});

/**
 * POST /api/competences
 * Créer une compétence
 */
router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createCompetenceSchema, req.body);
        const competence = await competencesService.create(dto);
        res.status(201).json({ success: true, data: competence });
    } catch (error) { next(error); }
});

/**
 * PATCH /api/competences/:id
 * Modifier une compétence
 */
router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateCompetenceSchema, req.body);
        const competence = await competencesService.update(req.params.id, dto);
        res.json({ success: true, data: competence });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/competences/:id
 * Supprimer une compétence
 */
router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await competencesService.delete(req.params.id);
        res.json({ success: true, message: 'Compétence supprimée' });
    } catch (error) { next(error); }
});

export const competencesController = router;
export default router;
