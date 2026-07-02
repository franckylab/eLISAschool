/**
 * ==================================
 * eLISAschool - Controller Usages Niveau
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Routes API pour la gestion des usages des niveaux de périodicité.
 * CRUD avec protection des usages système.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UsagesNiveauService } from '../services/usages-niveau.service';
import { createUsageNiveauSchema, updateUsageNiveauSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Permission } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new UsagesNiveauService();

// Helper de validation Zod
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// ================================================================
// USAGES NIVEAU — CRUD
// ================================================================

/**
 * GET / — Lister les usages disponibles pour un établissement
 */
router.get(
    '/',
    authMiddleware,
    requirePermission(Permission.USAGES_NIVEAU_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const isSuperAdmin = req.utilisateur?.role === 'SUPER_ADMIN';
            const usages = isSuperAdmin
                ? await service.findAllGlobal()
                : await service.findAll(etablissementId);
            res.json({ success: true, data: usages });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /:id — Détail d'un usage
 */
router.get(
    '/:id',
    authMiddleware,
    requirePermission(Permission.USAGES_NIVEAU_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const usage = await service.findOne(req.params.id);
            res.json({ success: true, data: usage });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * POST / — Créer un usage personnalisé
 */
router.post(
    '/',
    authMiddleware,
    requirePermission(Permission.USAGES_NIVEAU_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(createUsageNiveauSchema, req.body);
            const usage = await service.create(dto, etablissementId);
            res.status(201).json({ success: true, data: usage });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * PATCH /:id — Modifier un usage personnalisé
 */
router.patch(
    '/:id',
    authMiddleware,
    requirePermission(Permission.USAGES_NIVEAU_EDIT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(updateUsageNiveauSchema, req.body);
            const isSuperAdmin = req.utilisateur?.role === 'SUPER_ADMIN';
            const usage = await service.update(req.params.id, dto, etablissementId, isSuperAdmin);
            res.json({ success: true, data: usage });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * DELETE /:id — Supprimer un usage personnalisé
 */
router.delete(
    '/:id',
    authMiddleware,
    requirePermission(Permission.USAGES_NIVEAU_DELETE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const isSuperAdmin = req.utilisateur?.role === 'SUPER_ADMIN';
            await service.delete(req.params.id, etablissementId, isSuperAdmin);
            res.json({ success: true, message: 'Usage supprimé' });
        } catch (error) {
            next(error);
        }
    },
);

export const usagesNiveauController = router;
export default router;
