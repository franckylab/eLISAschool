/**
 * ==================================
 * eLISAschool - Contrôleur Role Builder
 * ==================================
 * API REST pour la gestion des rôles plateforme personnalisés.
 *
 * Endpoints:
 * GET    /api/platform/roles              — Liste rôles (défaut + custom)
 * POST   /api/platform/roles              — Créer rôle personnalisé
 * GET    /api/platform/roles/matrice      — Matrice permissions complète
 * GET    /api/platform/roles/:id          — Détail rôle
 * GET    /api/platform/roles/:id/permissions — Permissions détail
 * PATCH  /api/platform/roles/:id          — Modifier permissions
 * DELETE /api/platform/roles/:id          — Supprimer (sauf rôles système)
 *
 * V2.3 — Panel Admin Enterprise
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateDto } from '@common/utils/validate-dto.util';
import { creerRoleSchema, modifierRoleSchema } from '../dto/platform-roles.dto';
import { platformRolesService } from '../services/platform-roles.service';

const router = Router();

/**
 * GET /api/platform/roles
 * Liste tous les rôles (système + personnalisés).
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformRolesService.getListeRoles();
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/roles/matrice
 * Matrice complète des permissions par module.
 */
router.get('/matrice', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformRolesService.getMatricePermissions();
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/roles
 * Créer un rôle personnalisé.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(creerRoleSchema, req.body);
        const data = await platformRolesService.creerRole(dto);
        res.status(201).json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/roles/:id
 * Détail d'un rôle.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformRolesService.getDetailRole(req.params.id);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/roles/:id/permissions
 * Permissions détaillées d'un rôle.
 */
router.get('/:id/permissions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformRolesService.getPermissions(req.params.id);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/platform/roles/:id
 * Modifier un rôle personnalisé (permissions, nom, scope).
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(modifierRoleSchema, req.body);
        const data = await platformRolesService.modifierRole(req.params.id, dto);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/roles/:id
 * Supprimer un rôle personnalisé (rôles système protégés).
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformRolesService.supprimerRole(req.params.id);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

export { router as platformRolesController };
