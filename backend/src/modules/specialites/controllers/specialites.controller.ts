/**
 * ==================================
 * eLISAschool - Controller Specialites
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SpecialitesService } from '../services';
import { createSpecialiteSchema, updateSpecialiteSchema, querySpecialitesSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';

const router = Router();
const specialitesService = new SpecialitesService();

/**
 * GET /api/specialites
 * Liste paginée avec recherche et filtres
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(querySpecialitesSchema, req.query);
        const result = await specialitesService.findAll(query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * GET /api/specialites/all
 * Liste complète (sans pagination) — pour les selects/dropdowns
 */
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const specialites = await specialitesService.findAllSimple();
        res.json({ success: true, data: specialites });
    } catch (error) { next(error); }
});

/**
 * GET /api/specialites/filiere/:filiereId
 * Liste des spécialités d'une filière
 */
router.get('/filiere/:filiereId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const specialites = await specialitesService.findByFiliere(req.params.filiereId);
        res.json({ success: true, data: specialites });
    } catch (error) { next(error); }
});

/**
 * GET /api/specialites/:id
 * Détail d'une spécialité
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const specialite = await specialitesService.findOne(req.params.id);
        res.json({ success: true, data: specialite });
    } catch (error) { next(error); }
});

/**
 * POST /api/specialites
 * Créer une spécialité
 */
router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createSpecialiteSchema, req.body);
        const specialite = await specialitesService.create(dto);
        res.status(201).json({ success: true, data: specialite });
    } catch (error) { next(error); }
});

/**
 * PATCH /api/specialites/:id
 * Modifier une spécialité
 */
router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateSpecialiteSchema, req.body);
        const specialite = await specialitesService.update(req.params.id, dto);
        res.json({ success: true, data: specialite });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/specialites/:id
 * Supprimer une spécialité
 */
router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await specialitesService.delete(req.params.id);
        res.json({ success: true, message: 'Spécialité supprimée' });
    } catch (error) { next(error); }
});

export const specialitesController = router;
export default router;
