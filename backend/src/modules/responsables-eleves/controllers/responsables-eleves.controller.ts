/**
 * ==================================
 * eLISAschool - Controller Responsables Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Description: API pour gérer les relations entre parents et élèves.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ParentsService, PortalParentService } from '../services';
import { lierParentSchema, updateResponsableSchema } from '../dto';
import { authMiddleware, requireRoles, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new ParentsService();
const portalService = new PortalParentService();

/**
 * Helper de validation Zod
 */
function validateDto(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', result.error.flatten());
    }
    return result.data;
}

// ==================================
// Routes ADMIN pour gérer les relations
// ==================================

/**
 * POST /api/responsables-eleves/lier
 * Lier un parent à un élève
 */
router.post(
    '/lier',
    authMiddleware,
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(lierParentSchema, req.body);
            const responsable = await service.lierParent(dto, req);
            res.status(201).json({ success: true, data: responsable });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/eleve/:enfantId/parents
 * Récupérer tous les parents d'un élève
 */
router.get(
    '/eleve/:enfantId/parents',
    authMiddleware,
    requirePermission('responsables:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { enfantId } = req.params;
            const parents = await service.getParentsEleve(enfantId);
            res.json({ success: true, data: parents });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/parent/:parentId/enfants
 * Récupérer tous les enfants d'un parent
 */
router.get(
    '/parent/:parentId/enfants',
    authMiddleware,
    requirePermission('responsables:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { parentId } = req.params;
            const enfants = await service.getEnfantsParent(parentId);
            res.json({ success: true, data: enfants });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/responsables-eleves/:parentId/:enfantId
 * Modifier une relation parent-élève
 */
router.patch(
    '/:parentId/:enfantId',
    authMiddleware,
    requirePermission('responsables:update'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { parentId, enfantId } = req.params;
            const dto = validateDto(updateResponsableSchema, req.body);
            const responsable = await service.updateResponsable(parentId, enfantId, dto, req);
            res.json({ success: true, data: responsable });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/responsables-eleves/:parentId/:enfantId
 * Supprimer une relation parent-élève (soft delete)
 */
router.delete(
    '/:parentId/:enfantId',
    authMiddleware,
    requirePermission('responsables:delete'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { parentId, enfantId } = req.params;
            await service.deleteResponsable(parentId, enfantId, req);
            res.json({ success: true, message: 'Relation parent-élève supprimée' });
        } catch (error) {
            next(error);
        }
    }
);

// ==================================
// Routes PARENT pour consulter ses enfants
// ==================================

/**
 * GET /api/responsables-eleves/mes-enfants
 * Récupérer mes enfants (pour le parent connecté)
 */
router.get(
    '/mes-enfants',
    authMiddleware,
    requirePermission('parents:view-enfants'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const enfants = await service.getEnfantsParent(req.utilisateur.id);
            res.json({ success: true, data: enfants });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/verifier-acces/:eleveId
 * Vérifier si le parent connecté peut accéder à un élève
 */
router.get(
    '/verifier-acces/:eleveId',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const { eleveId } = req.params;
            const peutAcceder = await service.peutAccederEleve(req.utilisateur.id, eleveId);
            
            res.json({
                success: true,
                data: {
                    peutAcceder,
                    parentId: req.utilisateur.id,
                    eleveId,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// ==================================
// PORTAL PARENT - Endpoints dédiés
// ==================================

/**
 * GET /api/responsables-eleves/portal/dashboard
 * Dashboard parent avec vue d'ensemble de tous les enfants
 */
router.get(
    '/portal/dashboard',
    authMiddleware,
    requirePermission('parents:view-enfants'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const dashboard = await portalService.getDashboardParent(req.utilisateur.id);
            res.json({ success: true, data: dashboard });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/portal/enfants
 * Liste des enfants du parent avec infos complètes
 */
router.get(
    '/portal/enfants',
    authMiddleware,
    requirePermission('parents:view-enfants'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const enfants = await portalService.getEnfantsParent(req.utilisateur.id);
            res.json({ success: true, data: enfants });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/portal/enfant/:enfantId/notes
 * Notes d'un enfant spécifique
 */
router.get(
    '/portal/enfant/:enfantId/notes',
    authMiddleware,
    requirePermission('parents:view-notes'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const { enfantId } = req.params;
            const notes = await portalService.getNotesEnfant(req.utilisateur.id, enfantId, {
                periodeId: req.query.periodeId as string,
                matiereId: req.query.matiereId as string,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            });

            res.json({ success: true, data: notes });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/portal/enfant/:enfantId/bulletins
 * Bulletins d'un enfant spécifique
 */
router.get(
    '/portal/enfant/:enfantId/bulletins',
    authMiddleware,
    requirePermission('parents:view-bulletins'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const { enfantId } = req.params;
            const bulletins = await portalService.getBulletinsEnfant(req.utilisateur.id, enfantId);
            res.json({ success: true, data: bulletins });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/portal/enfant/:enfantId/cantine
 * Situation cantine d'un enfant
 */
router.get(
    '/portal/enfant/:enfantId/cantine',
    authMiddleware,
    requirePermission('parents:view-enfants'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const { enfantId } = req.params;
            const cantine = await portalService.getCantineEnfant(req.utilisateur.id, enfantId);
            res.json({ success: true, data: cantine });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/portal/enfant/:enfantId/transport
 * Situation transport d'un enfant
 */
router.get(
    '/portal/enfant/:enfantId/transport',
    authMiddleware,
    requirePermission('parents:view-enfants'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const { enfantId } = req.params;
            const transport = await portalService.getTransportEnfant(req.utilisateur.id, enfantId);
            res.json({ success: true, data: transport });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/responsables-eleves/portal/enfant/:enfantId/paiements
 * Historique des paiements d'un enfant
 */
router.get(
    '/portal/enfant/:enfantId/paiements',
    authMiddleware,
    requirePermission('parents:pay'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const { enfantId } = req.params;
            const paiements = await portalService.getPaiementsEnfant(req.utilisateur.id, enfantId);
            res.json({ success: true, data: paiements });
        } catch (error) {
            next(error);
        }
    }
);

export const responsablesElevesController = router;
export default router;
