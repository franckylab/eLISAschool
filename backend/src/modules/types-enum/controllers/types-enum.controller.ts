/**
 * ==================================
 * eLISAschool - Controller TypeEnum
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Endpoints CRUD pour la gestion des types enum
 * avec protection RBAC et multi-tenant
 */

import { Router, Request, Response, NextFunction } from 'express';
import { typeEnumService } from '../services';
import { createTypeEnumSchema, updateTypeEnumSchema, queryTypeEnumSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils/validate-dto.util';
import { CategorieEnum } from '../entities';

const router = Router();

// ==================================
// ENDPOINTS PUBLICS (Auth requis)
// ==================================

/**
 * GET /api/types-enum
 * Récupérer tous les types enum avec pagination et filtres
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(queryTypeEnumSchema, req.query);
        const result = await typeEnumService.findAll(dto, req.etablissementId);
        res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) { next(error); }
});

/**
 * GET /api/types-enum/categorie/:categorie
 * Récupérer tous les types d'une catégorie (pour dropdowns)
 */
router.get('/categorie/:categorie', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categorie = req.params.categorie as CategorieEnum;
        
        // Vérifier que la catégorie est valide
        if (!Object.values(CategorieEnum).includes(categorie)) {
            throw new AppError(`Catégorie invalide: ${categorie}`, 400, 'INVALID_CATEGORIE');
        }

        const types = await typeEnumService.findByCategorie(categorie, req.etablissementId);
        res.json({ success: true, data: types });
    } catch (error) { next(error); }
});

/**
 * GET /api/types-enum/:id
 * Récupérer un type enum par ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const typeEnum = await typeEnumService.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: typeEnum });
    } catch (error) { next(error); }
});

// ==================================
// ENDPOINTS ADMIN (ADMIN/SUPER_ADMIN uniquement)
// ==================================

/**
 * POST /api/types-enum
 * Créer un nouveau type enum personnalisé
 */
router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createTypeEnumSchema, req.body);
        const created = await typeEnumService.create(dto, req.etablissementId);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

/**
 * PATCH /api/types-enum/:id
 * Modifier un type enum
 * - Types système : seul le libellé est modifiable
 * - Types personnalisés : tous les champs sauf code/categorie
 */
router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateTypeEnumSchema, req.body);
        const updated = await typeEnumService.update(req.params.id, dto, req.etablissementId);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

/**
 * POST /api/types-enum/:id/toggle
 * Activer/désactiver un type enum personnalisé
 */
router.post('/:id/toggle', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const toggled = await typeEnumService.toggleActif(req.params.id, req.etablissementId);
        res.json({ success: true, data: toggled });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/types-enum/:id
 * Supprimer un type enum personnalisé
 * - Interdit pour les types système
 */
router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await typeEnumService.delete(req.params.id, req.etablissementId);
        res.json({ success: true, message: 'Type enum supprimé' });
    } catch (error) { next(error); }
});

// ==================================
// ENDPOINT SYSTÈME (SUPER_ADMIN uniquement)
// ==================================

/**
 * POST /api/types-enum/initialize
 * Initialiser les types enum système (seed)
 * - Réservé au SUPER_ADMIN
 */
router.post('/initialize', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await typeEnumService.initializeSystemTypes();
        res.json({ success: true, message: 'Types système initialisés' });
    } catch (error) { next(error); }
});

export const typesEnumController = router;
export default router;
