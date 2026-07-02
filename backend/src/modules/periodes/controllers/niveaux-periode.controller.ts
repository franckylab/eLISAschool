/**
 * ==================================
 * eLISAschool - Controller Niveaux Période
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Routes API pour la gestion des niveaux de périodicité par établissement.
 * CRUD + réordonnancement + configuration initiale.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NiveauxPeriodeService } from '../services/niveaux-periode.service';
import {
    createNiveauPeriodeSchema,
    updateNiveauPeriodeSchema,
    reorderNiveauxSchema,
    configInitialeNiveauxSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Permission } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new NiveauxPeriodeService();

// Helper de validation Zod
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// ================================================================
// NIVEAUX PÉRIODE — CRUD
// ================================================================

/**
 * GET / — Lister les niveaux d'un établissement
 */
router.get(
    '/',
    authMiddleware,
    requirePermission(Permission.NIVEAUX_PERIODE_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const niveaux = await service.findAll(etablissementId);
            res.json({ success: true, data: niveaux });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /:id — Détail d'un niveau
 */
router.get(
    '/:id',
    authMiddleware,
    requirePermission(Permission.NIVEAUX_PERIODE_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const niveau = await service.findOne(req.params.id, etablissementId);
            res.json({ success: true, data: niveau });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * POST / — Créer un niveau
 */
router.post(
    '/',
    authMiddleware,
    requirePermission(Permission.NIVEAUX_PERIODE_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(createNiveauPeriodeSchema, req.body);
            const niveau = await service.create(dto, etablissementId);
            res.status(201).json({ success: true, data: niveau });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * PATCH /:id — Modifier un niveau
 */
router.patch(
    '/:id',
    authMiddleware,
    requirePermission(Permission.NIVEAUX_PERIODE_EDIT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(updateNiveauPeriodeSchema, req.body);
            const niveau = await service.update(req.params.id, dto, etablissementId);
            res.json({ success: true, data: niveau });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * DELETE /:id — Supprimer un niveau
 */
router.delete(
    '/:id',
    authMiddleware,
    requirePermission(Permission.NIVEAUX_PERIODE_DELETE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            await service.delete(req.params.id, etablissementId);
            res.json({ success: true, message: 'Niveau supprimé' });
        } catch (error) {
            next(error);
        }
    },
);

// ================================================================
// OPÉRATIONS SPÉCIALES
// ================================================================

/**
 * PATCH /reorder — Réordonner les niveaux (drag & drop)
 */
router.patch(
    '/reorder',
    authMiddleware,
    requirePermission(Permission.NIVEAUX_PERIODE_EDIT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(reorderNiveauxSchema, req.body);
            const niveaux = await service.reorder(dto, etablissementId);
            res.json({ success: true, data: niveaux });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * POST /config-initiale — Configuration initiale (wizard)
 */
router.post(
    '/config-initiale',
    authMiddleware,
    requirePermission(Permission.NIVEAUX_PERIODE_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(configInitialeNiveauxSchema, req.body);
            const niveaux = await service.configInitiale(dto, etablissementId);
            res.status(201).json({ success: true, data: niveaux });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /:id/niveaux-inferieurs — Lister les niveaux inférieurs à un niveau donné
 */
router.get(
    '/:id/niveaux-inferieurs',
    authMiddleware,
    requirePermission(Permission.NIVEAUX_PERIODE_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const niveau = await service.findOne(req.params.id, etablissementId);
            const niveauxInf = await service.getNiveauxInferieurs(niveau.niveau, etablissementId);
            res.json({ success: true, data: niveauxInf });
        } catch (error) {
            next(error);
        }
    },
);

export const niveauxPeriodeController = router;
export default router;
