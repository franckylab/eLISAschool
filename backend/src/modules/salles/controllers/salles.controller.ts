/**
 * ==================================
 * eLISAschool - Controller Salles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Routes REST pour la gestion des salles :
 * - CRUD complet
 * - Pagination et filtrage
 * - Statistiques
 * - Vérification disponibilité
 */

import { Router, Request, Response, NextFunction } from 'express';
import { salleService } from '../services';
import { createSalleSchema, updateSalleSchema, querySallesSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// ==================================
// Helper de validation
// ==================================

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError(
            `Erreur de validation: ${result.error.errors.map((e: any) => e.message).join(', ')}`,
            400,
            'VALIDATION_ERROR'
        );
    }
    return result.data;
}

// ==================================
// Routes CRUD
// ==================================

/**
 * GET /api/salles - Lister toutes les salles (paginé)
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(querySallesSchema, {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            typeSalle: req.query.typeSalle,
            disponible: req.query.disponible === 'true' ? true : req.query.disponible === 'false' ? false : undefined,
            statut: req.query.statut,
            capaciteMin: req.query.capaciteMin ? parseInt(req.query.capaciteMin as string) : undefined,
            capaciteMax: req.query.capaciteMax ? parseInt(req.query.capaciteMax as string) : undefined,
            search: req.query.search as string,
        });

        const { data, total } = await salleService.findAll(dto, req.utilisateur?.etablissementId!);

        res.json({
            success: true,
            data,
            pagination: {
                page: dto.page,
                limit: dto.limit,
                total,
                totalPages: Math.ceil(total / dto.limit),
                hasNext: dto.page * dto.limit < total,
                hasPrev: dto.page > 1,
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/salles/statistiques - Statistiques des salles
 */
router.get('/statistiques', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await salleService.getStatistiques(req.utilisateur?.etablissementId!);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/salles/disponibles - Salles disponibles pour emploi du temps
 */
router.get('/disponibles', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const capaciteMin = req.query.capaciteMin ? parseInt(req.query.capaciteMin as string) : undefined;
        const typeSalle = req.query.typeSalle as any;

        const salles = await salleService.findDisponibles(
            req.utilisateur?.etablissementId!,
            capaciteMin,
            typeSalle
        );

        res.json({ success: true, data: salles });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/salles/:id - Détail d'une salle
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const salle = await salleService.findOne(req.params.id, req.utilisateur?.etablissementId!);
        res.json({ success: true, data: salle });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/salles - Créer une salle
 */
router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createSalleSchema, req.body);
        const created = await salleService.create(dto, req.utilisateur?.etablissementId!);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/salles/:id - Modifier une salle
 */
router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateSalleSchema, req.body);
        const updated = await salleService.update(req.params.id, dto, req.utilisateur?.etablissementId!);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/salles/:id - Supprimer une salle
 */
router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await salleService.delete(req.params.id, req.utilisateur?.etablissementId!);
        res.json({ success: true, message: 'Salle supprimée avec succès' });
    } catch (error) {
        next(error);
    }
});

export const sallesController = router;
export default router;
