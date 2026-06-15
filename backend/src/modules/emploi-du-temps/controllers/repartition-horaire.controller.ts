/**
 * ==================================
 * eLISAschool - Controller Répartition Horaire
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion de la répartition horaire par affectation matière
 */

import { Router, Request, Response, NextFunction } from 'express';
import { emploiDuTempsService } from '../services';
import { createRepartitionHoraireSchema, updateRepartitionHoraireSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Helper de validation Zod
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Routes CRUD pour répartition horaire

/**
 * GET /api/emploi-du-temps/repartitions
 * Lister toutes les répartitions horaires d'un établissement
 */
router.get('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { affectationId, jourSemaine } = req.query;
        
        const filters: any = {
            etablissementId: req.utilisateur?.etablissementId
        };
        
        if (affectationId) filters.affectationId = affectationId as string;
        if (jourSemaine) filters.jourSemaine = jourSemaine as string;
        
        const repartitions = await emploiDuTempsService.findRepartitions(filters);
        res.json({ success: true, data: repartitions });
    } catch (error) { next(error); }
});

/**
 * POST /api/emploi-du-temps/repartitions
 * Créer une nouvelle répartition horaire
 */
router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createRepartitionHoraireSchema, req.body);
        
        const created = await emploiDuTempsService.createRepartition(dto, req.utilisateur?.etablissementId);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

/**
 * GET /api/emploi-du-temps/repartitions/:id
 * Détail d'une répartition horaire
 */
router.get('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repartition = await emploiDuTempsService.getRepartition(req.params.id);
        res.json({ success: true, data: repartition });
    } catch (error) { next(error); }
});

/**
 * PATCH /api/emploi-du-temps/repartitions/:id
 * Modifier une répartition horaire
 */
router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateRepartitionHoraireSchema, req.body);
        
        const updated = await emploiDuTempsService.updateRepartition(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/emploi-du-temps/repartitions/:id
 * Supprimer une répartition horaire
 */
router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await emploiDuTempsService.deleteRepartition(req.params.id);
        res.json({ success: true, message: 'Répartition horaire supprimée' });
    } catch (error) { next(error); }
});

/**
 * POST /api/emploi-du-temps/repartitions/batch
 * Créer plusieurs répartitions en batch (pour génération automatique)
 */
router.post('/batch', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { repartitions } = validate(
            require('zod').z.object({
                repartitions: require('zod').z.array(createRepartitionHoraireSchema).min(1).max(100)
            }),
            req.body
        );
        
        const created = await emploiDuTempsService.createRepartitionsBatch(
            repartitions,
            req.utilisateur?.etablissementId
        );
        
        res.status(201).json({ 
            success: true, 
            data: created,
            message: `${created.length} répartitions créées`
        });
    } catch (error) { next(error); }
});

export const repartitionHoraireController = router;
export default router;
