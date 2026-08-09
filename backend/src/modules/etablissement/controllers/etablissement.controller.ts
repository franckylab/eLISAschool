/**
 * ==================================
 * eLISAschool - Controller Etablissement (multi-établissements)
 * ==================================
 * Version: 2.0.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { EtablissementService } from '../services';
import {
    createEtablissementSchema,
    updateEtablissementSchema,
    updateEtablissementConfigSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils';

const router = Router();
const etablissementService = new EtablissementService();

// ==================================
// CRUD Établissements
// ==================================

/**
 * GET /api/etablissements
 * Liste tous les établissements (SUPER_ADMIN uniquement)
 */
router.get(
    '/',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissements = await etablissementService.findAll();
            res.json({ success: true, data: etablissements });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id
 * Retourne un établissement spécifique
 */
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.findOne(req.params.id, true);
            res.json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements
 * Crée un nouvel établissement (SUPER_ADMIN uniquement)
 */
router.post(
    '/',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createEtablissementSchema, req.body);
            const etablissement = await etablissementService.create(dto, req.utilisateur?.id);
            res.status(201).json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id
 * Met à jour un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateEtablissementSchema, req.body);
            const etablissement = await etablissementService.update(req.params.id, dto);
            res.json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/desactiver
 * Désactive un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id/desactiver',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.desactiver(req.params.id, req.utilisateur?.id);
            res.json({ success: true, data: etablissement, message: 'Établissement désactivé' });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/activer
 * Réactive un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id/activer',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.activer(req.params.id, req.utilisateur?.id);
            res.json({ success: true, data: etablissement, message: 'Établissement réactivé' });
        } catch (error) { next(error); }
    }
);

// ==================================
// Configuration par établissement
// ==================================

/**
 * GET /api/etablissements/:id/config
 * Retourne la configuration d'un établissement
 */
router.get(
    '/:id/config',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const config = await etablissementService.getConfig(req.params.id);
            res.json({ success: true, data: config });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/config
 * Met à jour la configuration d'un établissement (ADMIN, SUPER_ADMIN)
 */
router.patch(
    '/:id/config',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateEtablissementConfigSchema, req.body);
            const config = await etablissementService.updateConfig(req.params.id, dto);
            res.json({ success: true, data: config });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/stats
 * Statistiques globales des établissements (SUPER_ADMIN uniquement)
 */
router.get(
    '/stats',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await etablissementService.getStats();
            res.json({ success: true, data: stats });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id/stats
 * Statistiques d'un établissement spécifique
 * [0.2] Vérification d'appartenance — Rapport audit SaaS 2026
 */
router.get(
    '/:id/stats',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            // [0.2] Non-SUPER_ADMIN ne peut voir que les stats de son propre établissement
            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError(
                    'Accès refusé — vous ne pouvez consulter que les statistiques de votre établissement',
                    403,
                    'FORBIDDEN'
                ));
            }

            const stats = await etablissementService.getEtablissementStats(targetId);
            res.json({ success: true, data: stats });
        } catch (error) { next(error); }
    }
);

// ==================================
// Gestion du logo (v3.0)
// ==================================

/**
 * GET /api/etablissements/:id/logo
 * Récupère le logo d'un établissement (SUPER_ADMIN, ADMIN, CHEF_ETABLISSEMENT)
 */
router.get(
    '/:id/logo',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const logo = await etablissementService.getLogo(req.params.id);
            
            if (!logo) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'LOGO_ABSENT', message: 'Aucun logo trouvé pour cet établissement' },
                });
            }
            
            res.json({ success: true, data: logo });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements/:id/logo
 * Upload le logo d'un établissement (SUPER_ADMIN, ADMIN, CHEF_ETABLISSEMENT)
 */
router.post(
    '/:id/logo',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { logoBase64 } = req.body;
            if (!logoBase64) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'LOGO_REQUIS', message: 'Le logo (base64) est requis' },
                });
            }
            const etablissement = await etablissementService.uploadLogo(req.params.id, logoBase64);
            res.json({ success: true, data: etablissement, message: 'Logo uploadé avec succès' });
        } catch (error) { next(error); }
    }
);

/**
 * DELETE /api/etablissements/:id/logo
 * Supprime le logo d'un établissement (SUPER_ADMIN, ADMIN, CHEF_ETABLISSEMENT)
 */
router.delete(
    '/:id/logo',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await etablissementService.supprimerLogo(req.params.id);
            res.json({ success: true, message: 'Logo supprimé avec succès' });
        } catch (error) { next(error); }
    }
);

export const etablissementController = router;
export default router;
