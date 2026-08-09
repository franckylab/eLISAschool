/**
 * ==================================
 * eLISAschool - Contrôleur Identité (Dual-Plane)
 * ==================================
 * Modèle C — Auth0 Internalisé
 *
 * API REST pour la gestion des identités globales.
 *
 * Endpoints:
 * GET    /api/platform/identites          — Liste paginée
 * GET    /api/platform/identites/kpis     — KPIs identités
 * GET    /api/platform/identites/:id      — Détail + memberships
 * POST   /api/platform/identites          — Créer identité
 * PUT    /api/platform/identites/:id      — Mettre à jour
 * DELETE /api/platform/identites/:id      — Supprimer (si pas de membership actif)
 * POST   /api/platform/identites/:id/verify-email — Vérifier email
 * POST   /api/platform/identites/:id/memberships/assign — Assigner rôle
 * POST   /api/platform/identites/:id/memberships/:membershipId/revoke — Révoquer membership
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateDto } from '@common/utils/validate-dto.util';
import {
    listeIdentitesSchema,
    creerIdentiteSchema,
    modifierIdentiteSchema,
    assignerRoleSchema,
} from '../dto/identite.dto';
import { identiteService } from '../services/identite.service';
import { membershipService } from '../services/membership.service';

const router = Router();

/**
 * GET /api/platform/identites/kpis
 * KPIs identités (total, par statut, % MFA, % email vérifié).
 */
router.get('/kpis', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await identiteService.getKpis();
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/identites
 * Liste paginée des identités avec filtres.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = validateDto(listeIdentitesSchema, req.query);
        const data = await identiteService.getListeIdentites(filters);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/identites/:id
 * Détail d'une identité + memberships + utilisateur plateforme.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const identite = await identiteService.findById(req.params.id);
        if (!identite) {
            return res.status(404).json({
                success: false,
                error: { message: 'Identité non trouvée', code: 'IDENTITY_NOT_FOUND' },
            });
        }

        const memberships = await membershipService.findByIdentite(req.params.id);

        res.json({
            success: true,
            data: {
                ...identite,
                memberships,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/identites
 * Créer une nouvelle identité.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(creerIdentiteSchema, req.body);
        const data = await identiteService.create(dto);
        res.status(201).json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/identites/:id
 * Mettre à jour une identité.
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(modifierIdentiteSchema, req.body);
        const data = await identiteService.update(req.params.id, dto);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/identites/:id
 * Supprimer une identité (si pas de membership actif).
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await identiteService.delete(req.params.id);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/identites/:id/verify-email
 * Marquer l'email comme vérifié.
 */
router.post('/:id/verify-email', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await identiteService.verifyEmail(req.params.id);
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/identites/:id/memberships/assign
 * Assigner un rôle à une identité dans un contexte donné.
 */
router.post('/:id/memberships/assign', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(assignerRoleSchema, {
            ...req.body,
            identiteId: req.params.id,
        });
        const data = await membershipService.assignRole(
            dto.identiteId,
            dto.contexteType,
            dto.contexteId || null,
            dto.role,
        );
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/identites/:id/memberships/:membershipId/revoke
 * Révoquer un membership spécifique.
 */
router.post(
    '/:id/memberships/:membershipId/revoke',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await membershipService.revokeMembership(req.params.membershipId);
            res.json({ success: true, data, timestamp: new Date().toISOString() });
        } catch (error) {
            next(error);
        }
    },
);

export { router as identiteController };
