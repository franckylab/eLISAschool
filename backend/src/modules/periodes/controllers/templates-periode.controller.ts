/**
 * ==================================
 * eLISAschool - Controller Templates Période (v4.0)
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Routes API pour la gestion des templates de hiérarchie de périodes.
 * CRUD + génération récursive.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { TemplatesPeriodeService } from '../services';
import {
    createTemplatePeriodeSchema,
    updateTemplatePeriodeSchema,
    genererDepuisTemplateSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Permission } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

const router = Router();
const service = new TemplatesPeriodeService();

// Helper de validation Zod
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// ================================================================
// TEMPLATES — CRUD
// ================================================================

/**
 * GET /api/periodes-templates
 * Lister les templates disponibles pour l'établissement.
 */
router.get(
    '/',
    authMiddleware,
    requirePermission(Permission.PERIODES_TEMPLATES_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const isSuperAdmin = req.utilisateur?.role === 'SUPER_ADMIN';

            const templates = isSuperAdmin
                ? await service.findAllGlobal()
                : await service.findAll(etablissementId);

            res.json({ success: true, data: templates });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/periodes-templates/defaults
 * Lister les templates par défaut (modèles prédéfinis non persistés).
 * Utilisé comme point de départ pour la configuration initiale.
 */
router.get(
    '/defaults',
    authMiddleware,
    requirePermission(Permission.PERIODES_TEMPLATES_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const templates = service.getTemplatesParDefaut();
            res.json({ success: true, data: templates });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * GET /api/periodes-templates/:id
 * Détail d'un template.
 */
router.get(
    '/:id',
    authMiddleware,
    requirePermission(Permission.PERIODES_TEMPLATES_VIEW),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const template = await service.findOne(req.params.id);
            res.json({ success: true, data: template });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * POST /api/periodes-templates
 * Créer un template personnalisé.
 */
router.post(
    '/',
    authMiddleware,
    requirePermission(Permission.PERIODES_TEMPLATES_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(createTemplatePeriodeSchema, req.body);
            const template = await service.create(dto, etablissementId);
            res.status(201).json({ success: true, data: template });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * PATCH /api/periodes-templates/:id
 * Mettre à jour un template.
 */
router.patch(
    '/:id',
    authMiddleware,
    requirePermission(Permission.PERIODES_TEMPLATES_EDIT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(updateTemplatePeriodeSchema, req.body);
            const isSuperAdmin = req.utilisateur?.role === 'SUPER_ADMIN';
            const template = await service.update(req.params.id, dto, etablissementId, isSuperAdmin);
            res.json({ success: true, data: template });
        } catch (error) {
            next(error);
        }
    },
);

/**
 * DELETE /api/periodes-templates/:id
 * Supprimer (soft) un template.
 */
router.delete(
    '/:id',
    authMiddleware,
    requirePermission(Permission.PERIODES_TEMPLATES_DELETE),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const isSuperAdmin = req.utilisateur?.role === 'SUPER_ADMIN';
            await service.delete(req.params.id, etablissementId, isSuperAdmin);
            res.json({ success: true, message: 'Template supprimé' });
        } catch (error) {
            next(error);
        }
    },
);

// ================================================================
// GÉNÉRATION — Depuis un template
// ================================================================

/**
 * POST /api/periodes-templates/:id/generer
 * Générer une hiérarchie de périodes depuis un template.
 */
router.post(
    '/:id/generer',
    authMiddleware,
    requirePermission(Permission.PERIODES_TEMPLATES_GENERER),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.etablissementId;
            if (!etablissementId) {
                throw new AppError('Établissement non identifié', 400, 'ETABLISSEMENT_NON_IDENTIFIE');
            }
            const dto = validate(genererDepuisTemplateSchema, {
                ...req.body,
                templateId: req.params.id,
            });
            const periodes = await service.genererDepuisTemplate(dto, etablissementId);
            res.status(201).json({
                success: true,
                data: periodes,
                message: `${periodes.length} période(s) générée(s) avec succès`,
            });
        } catch (error) {
            next(error);
        }
    },
);

export const templatesPeriodeController = router;
export default router;
