/**
 * ==================================
 * eLISAschool - Controller Groupes Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Endpoints pour la gestion des groupes et dashboards consolidés.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { groupesService } from '../services/groupes.service';
import { consolidationService } from '../services/consolidation.service';
import {
    createGroupeSchema,
    updateGroupeSchema,
    addEtablissementSchema,
    addAdminSchema,
} from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { requireRoles } from '@modules/auth/middlewares/role.middleware';
import { requireGroupeAccess } from '../guards/groupe-access.guard';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Helper pour valider les dates
function validateDate(dateStr: string | undefined, fieldName: string): Date {
    if (!dateStr) {
        throw new AppError(`${fieldName} est requis`, 400, 'INVALID_DATE');
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new AppError(`Format de ${fieldName} invalide`, 400, 'INVALID_DATE');
    }
    return date;
}

// ==================================
// CRUD Groupes
// ==================================

/**
 * GET /api/groupes
 * Liste tous les groupes de l'utilisateur (propriétaire OU admin)
 * Supporte la pagination: ?page=1&limit=20
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = (page - 1) * limit;

        const groupes = await groupesService.getGroupesForUser(req.utilisateur!.id);
        
        // Pagination manuelle pour le moment (à optimiser avec repo.findAndCount)
        const paginatedGroupes = groupes.slice(offset, offset + limit);
        
        res.json({
            success: true,
            data: paginatedGroupes,
            pagination: {
                page,
                limit,
                total: groupes.length,
                totalPages: Math.ceil(groupes.length / limit),
                hasNext: page * limit < groupes.length,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/groupes
 * Crée un nouveau groupe
 */
router.post(
    '/',
    requireRoles(Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR, Role.DIRECTEUR_ADJOINT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createGroupeSchema, req.body);
            const groupe = await groupesService.createGroupe(dto, req.utilisateur!.id);
            res.status(201).json({ success: true, data: groupe });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/groupes/:id
 * Récupère les détails d'un groupe
 */
router.get('/:id', requireGroupeAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupe = await groupesService.getGroupeById(req.params.id);
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'NOT_FOUND');
        }

        res.json({ success: true, data: groupe });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/groupes/:id
 * Met à jour un groupe (nécessite GROUPES_MANAGE)
 */
router.patch(
    '/:id',
    requireGroupeAccess,
    requireRoles(Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR, Role.DIRECTEUR_ADJOINT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateGroupeSchema, req.body);
            const groupe = await groupesService.updateGroupe(req.params.id, dto);
            res.json({ success: true, data: groupe });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/groupes/:id
 * Supprime un groupe (soft delete) - seulement le propriétaire
 */
router.delete(
    '/:id',
    requireGroupeAccess,
    requireRoles(Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await groupesService.deleteGroupe(req.params.id, req.utilisateur!.id);
            res.json({ success: true, message: 'Groupe supprimé avec succès' });
        } catch (error) {
            next(error);
        }
    }
);

// ==================================
// Dashboard & Rapports Consolidés
// ==================================

/**
 * GET /api/groupes/:id/dashboard
 * Récupère le dashboard consolidé du groupe
 */
router.get('/:id/dashboard', requireGroupeAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dashboard = await consolidationService.getDashboardConsolide(req.params.id);
        res.json({ success: true, data: dashboard });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/groupes/:id/rapports/scolarite
 * Rapport de scolarité consolidé
 */
router.get('/:id/rapports/scolarite', requireGroupeAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateDebut = validateDate(req.query.dateDebut as string, 'dateDebut');
        const dateFin = validateDate(req.query.dateFin as string, 'dateFin');

        const rapport = await consolidationService.getRapportScolariteConsolide(
            req.params.id,
            dateDebut,
            dateFin
        );
        res.json({ success: true, data: rapport });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/groupes/:id/rapports/finances
 * Rapport financier consolidé
 */
router.get('/:id/rapports/finances', requireGroupeAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dateDebut = validateDate(req.query.dateDebut as string, 'dateDebut');
        const dateFin = validateDate(req.query.dateFin as string, 'dateFin');

        const rapport = await consolidationService.getRapportFinancierConsolide(
            req.params.id,
            dateDebut,
            dateFin
        );
        res.json({ success: true, data: rapport });
    } catch (error) {
        next(error);
    }
});

// ==================================
// Gestion des Établissements
// ==================================

/**
 * POST /api/groupes/:id/etablissements
 * Ajoute un ou plusieurs établissements au groupe (nécessite GROUPES_ETABLISSEMENTS_MANAGE)
 * Supporte l'ajout multiple: { "etablissementIds": ["uuid1", "uuid2"] }
 */
router.post(
    '/:id/etablissements',
    requireGroupeAccess,
    requireRoles(Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(addEtablissementSchema, req.body);
            
            // Supporter etablissementId seul OU etablissementIds
            const idsToAdd = dto.etablissementIds || 
                (dto.etablissementId ? [dto.etablissementId] : []);
            
            await groupesService.addEtablissements(
                req.params.id,
                idsToAdd,
                req.utilisateur!.id
            );

            res.json({ 
                success: true, 
                message: `${idsToAdd.length} établissement(s) ajouté(s) au groupe` 
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/groupes/:id/etablissements/:etablissementId
 * Retire un établissement du groupe
 */
router.delete(
    '/:id/etablissements/:etablissementId',
    requireGroupeAccess,
    requireRoles(Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await groupesService.removeEtablissement(req.params.id, req.params.etablissementId);
            res.json({ success: true, message: 'Établissement retiré du groupe' });
        } catch (error) {
            next(error);
        }
    }
);

// ==================================
// Gestion des Admins
// ==================================

/**
 * GET /api/groupes/:id/admins
 * Liste les administrateurs du groupe
 */
router.get('/:id/admins', requireGroupeAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupe = await groupesService.getGroupeById(req.params.id);
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'NOT_FOUND');
        }

        res.json({ success: true, data: groupe.admins || [] });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/groupes/:id/admins
 * Ajoute un administrateur au groupe (nécessite GROUPES_MANAGE)
 */
router.post(
    '/:id/admins',
    requireGroupeAccess,
    requireRoles(Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(addAdminSchema, req.body);
            await groupesService.addAdmin(req.params.id, dto.utilisateurId, req.utilisateur!.id);

            res.status(201).json({ success: true, message: 'Administrateur ajouté au groupe' });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/groupes/:id/admins/:utilisateurId
 * Retire un administrateur du groupe
 */
router.delete(
    '/:id/admins/:utilisateurId',
    requireGroupeAccess,
    requireRoles(Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await groupesService.removeAdmin(req.params.id, req.params.utilisateurId);
            res.json({ success: true, message: 'Administrateur retiré du groupe' });
        } catch (error) {
            next(error);
        }
    }
);

export const groupesController = router;
