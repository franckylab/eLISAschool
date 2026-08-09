/**
 * ==================================
 * eLISAschool - Contrôleur Utilisateurs Plateforme
 * ==================================
 * API REST pour la gestion des comptes admin plateforme.
 *
 * Endpoints:
 * GET    /api/platform/utilisateurs              — Liste paginée
 * POST   /api/platform/utilisateurs              — Créer compte
 * GET    /api/platform/utilisateurs/kpis         — KPIs
 * GET    /api/platform/utilisateurs/:id          — Détail
 * PATCH  /api/platform/utilisateurs/:id          — Modifier
 * DELETE /api/platform/utilisateurs/:id          — Désactiver
 * POST   /api/platform/utilisateurs/:id/reactiver — Réactiver
 * POST   /api/platform/utilisateurs/:id/revoquer-sessions — Révoquer sessions
 * GET    /api/platform/utilisateurs/:id/audit    — Audit trail
 * POST   /api/platform/utilisateurs/:id/deleguer — Délégation
 *
 * V2.2 — Panel Admin Enterprise
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateDto } from '@common/utils/validate-dto.util';
import {
    listeUtilisateursSchema,
    creerUtilisateurSchema,
    modifierUtilisateurSchema,
    deleguerSchema,
} from '../dto/platform-users.dto';
import { platformUsersService } from '../services/platform-users.service';

const router = Router();

/**
 * GET /api/platform/utilisateurs/kpis
 * KPIs utilisateurs plateforme (total, par rôle, % MFA).
 */
router.get('/kpis', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformUsersService.getKpis();
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/utilisateurs
 * Liste paginée des utilisateurs plateforme avec filtres.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = validateDto(listeUtilisateursSchema, req.query);
        const data = await platformUsersService.getListeUtilisateurs(filters);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/utilisateurs
 * Créer un nouveau compte utilisateur plateforme.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(creerUtilisateurSchema, req.body);
        const operateurId = req.utilisateur?.id;
        if (!operateurId) {
            return res.status(401).json({ success: false, error: { message: 'Non authentifié', code: 'UNAUTHORIZED' } });
        }
        const data = await platformUsersService.creerUtilisateur(dto, operateurId);
        res.status(201).json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/utilisateurs/:id
 * Détail d'un utilisateur plateforme.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformUsersService.getDetailUtilisateur(req.params.id);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/platform/utilisateurs/:id
 * Modifier un utilisateur plateforme (rôle, statut, scope).
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(modifierUtilisateurSchema, req.body);
        const operateurId = req.utilisateur?.id;
        if (!operateurId) {
            return res.status(401).json({ success: false, error: { message: 'Non authentifié', code: 'UNAUTHORIZED' } });
        }
        const data = await platformUsersService.modifierUtilisateur(req.params.id, dto, operateurId);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/utilisateurs/:id
 * Désactiver un utilisateur plateforme (soft delete).
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const operateurId = req.utilisateur?.id;
        if (!operateurId) {
            return res.status(401).json({ success: false, error: { message: 'Non authentifié', code: 'UNAUTHORIZED' } });
        }
        const data = await platformUsersService.desactiverUtilisateur(req.params.id, operateurId);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/utilisateurs/:id/reactiver
 * Réactiver un utilisateur plateforme désactivé.
 */
router.post('/:id/reactiver', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const operateurId = req.utilisateur?.id;
        if (!operateurId) {
            return res.status(401).json({ success: false, error: { message: 'Non authentifié', code: 'UNAUTHORIZED' } });
        }
        const data = await platformUsersService.reactiverUtilisateur(req.params.id, operateurId);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/utilisateurs/:id/revoquer-sessions
 * Révoquer toutes les sessions actives d'un utilisateur.
 */
router.post('/:id/revoquer-sessions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const operateurId = req.utilisateur?.id;
        if (!operateurId) {
            return res.status(401).json({ success: false, error: { message: 'Non authentifié', code: 'UNAUTHORIZED' } });
        }
        const data = await platformUsersService.revoquerSessions(req.params.id, operateurId);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/utilisateurs/:id/audit
 * Audit trail d'un utilisateur plateforme.
 */
router.get('/:id/audit', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformUsersService.getAuditUtilisateur(req.params.id);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/utilisateurs/:id/deleguer
 * Créer une délégation temporaire pour un utilisateur.
 */
router.post('/:id/deleguer', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(deleguerSchema, req.body);
        const operateurId = req.utilisateur?.id;
        if (!operateurId) {
            return res.status(401).json({ success: false, error: { message: 'Non authentifié', code: 'UNAUTHORIZED' } });
        }
        const data = await platformUsersService.deleguer(req.params.id, dto, operateurId);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

export { router as platformUsersController };
