/**
 * ==================================
 * eLISAschool - Controller Filières
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Changements v2.0:
 * - Support multi-tenant avec req.utilisateur.etablissementId
 * - Toutes les requêtes sont isolées par établissement
 */

import { Router, Request, Response, NextFunction } from 'express';
import { FilieresService } from '../services';
import { createFiliereSchema, updateFiliereSchema, queryFilieresSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';

const router = Router();
const filieresService = new FilieresService();

// GET /api/filieres - Liste paginée
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryFilieresSchema, req.query);
        const etablissementId = req.utilisateur!.etablissementId!;
        const result = await filieresService.findAll(query, etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// GET /api/filieres/all - Liste complète pour dropdowns
router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cycleId = req.query.cycleId as string | undefined;
        const etablissementId = req.utilisateur!.etablissementId!;
        const filieres = await filieresService.findAllSimple(cycleId, etablissementId);
        res.json({ success: true, data: filieres });
    } catch (error) { next(error); }
});

// GET /api/filieres/:id - Détail d'une filière
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const filiere = await filieresService.findOne(req.params.id, etablissementId);
        res.json({ success: true, data: filiere });
    } catch (error) { next(error); }
});

// POST /api/filieres - Créer une filière
router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createFiliereSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const filiere = await filieresService.create(dto, etablissementId);
        res.status(201).json({ success: true, data: filiere });
    } catch (error) { next(error); }
});

// PATCH /api/filieres/:id - Modifier une filière
router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateFiliereSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const filiere = await filieresService.update(req.params.id, dto, etablissementId);
        res.json({ success: true, data: filiere });
    } catch (error) { next(error); }
});

// DELETE /api/filieres/:id - Supprimer une filière
router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        await filieresService.delete(req.params.id, etablissementId);
        res.json({ success: true, message: 'Filière supprimée' });
    } catch (error) { next(error); }
});

export const filieresController = router;
export default router;
