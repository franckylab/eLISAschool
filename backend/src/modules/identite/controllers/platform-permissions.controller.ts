/**
 * ==================================
 * eLISAschool - Contrôleur Permissions Plateforme
 * ==================================
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 *
 * API REST pour la consultation des permissions plateforme.
 *
 * Endpoints:
 * GET /api/platform/permissions          — Liste toutes les permissions
 * GET /api/platform/permissions/matrix   — Matrice complète (permissions × rôles)
 * GET /api/platform/permissions/modules  — Permissions groupées par module
 */

import { Router, Request, Response, NextFunction } from 'express';
import { membershipService } from '../services/membership.service';

const router = Router();

/**
 * GET /api/platform/permissions
 * Liste toutes les permissions plateforme.
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await membershipService.getAllPermissionsPlateforme();
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/permissions/matrix
 * Matrice complète : permissions × rôles plateforme.
 * Utilise definePlatformAbility pour résoudre les permissions de chaque rôle.
 */
router.get('/matrix', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await membershipService.getMatricePermissions();
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/permissions/modules
 * Permissions groupées par module.
 */
router.get('/modules', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await membershipService.getPermissionsByModule();
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

export { router as platformPermissionsController };
