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
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { requireGroupeAccess } from '../guards/groupe-access.guard';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// ==================================
// Helpers
// ==================================

/**
 * Transforme une entité GroupeEtablissement en DTO pour l'API
 * Fonction centralisée pour garantir la cohérence des réponses
 */
function transformGroupeToDto(groupe: any, includeEtablissements: boolean = false): any {
    // Compter les établissements (liens qui ont un établissement chargé)
    const nbEtablissements = groupe.etablissements?.length || 0;
    
    const dto: any = {
        id: groupe.id,
        nom: groupe.nom,
        description: groupe.description,
        proprietaireId: groupe.proprietaireId,
        code: groupe.code,
        actif: groupe.actif,
        nbEtablissements, // ✅ Nombre correct d'établissements
        creeAt: groupe.creeAt?.toISOString(),
        majAt: groupe.majAt?.toISOString(),
    };
    
    if (includeEtablissements && groupe.etablissements) {
        dto.etablissements = groupe.etablissements
            .filter((lien: any) => lien.etablissement) // ✅ Filtrer les liens sans établissement
            .map((lien: any) => ({
                id: lien.etablissement.id,
                nom: lien.etablissement.nom,
                code: lien.etablissement.code,
            }));
    }
    
    logger.debug(`[transformGroupeToDto] ${groupe.nom}: ${nbEtablissements} établissements`);
    
    return dto;
}

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
 * GET /api/groupes-etablissements
 * Liste tous les groupes (SUPER_ADMIN voient tout, autres voient leurs groupes)
 * Supporte la pagination: ?page=1&limit=20&search=xxx&actif=true
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const actif = req.query.actif ? req.query.actif === 'true' : undefined;
        const utilisateur = req.utilisateur!;

        // Utiliser la pagination côté base de données
        const { groupes, total } = await groupesService.findAllPaginated(
            utilisateur.id,
            utilisateur.role,
            page,
            limit,
            search,
            actif
        );

        // Transformer les groupes vers le format DTO
        const groupesTransformes = groupes.map((g: any) => transformGroupeToDto(g));

        res.json({
            success: true,
            data: groupesTransformes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
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
    requirePermission('super_admin:all'),
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

// ==================================
// Routes SPÉCIFIQUES (doivent être AVANT les routes génériques /:id)
// ==================================

// ==================================
// Gestion des Établissements
// ==================================

/**
 * GET /api/groupes-etablissements/:id/etablissements
 * Liste les établissements du groupe
 */
router.get('/:id/etablissements', requireGroupeAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupe = await groupesService.getGroupeById(req.params.id);
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'NOT_FOUND');
        }

        // groupe.etablissements est un tableau de GroupeEtablissementLien
        // Chaque lien a une propriété 'etablissement' qui contient l'établissement
        const etablissements = (groupe.etablissements || [])
            .filter(lien => lien.etablissement) // Filtrer les liens sans établissement
            .map(lien => ({
                id: lien.etablissement.id,
                nom: lien.etablissement.nom,
                code: (lien.etablissement as any).codeEtablissement,
            }));

        res.json({ success: true, data: etablissements });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/groupes-etablissements/:id/etablissements
 * Ajoute un ou plusieurs établissements au groupe (nécessite GROUPES_ETABLISSEMENTS_MANAGE)
 * Supporte l'ajout multiple: { "etablissementIds": ["uuid1", "uuid2"] }
 */
router.post(
    '/:id/etablissements',
    requireGroupeAccess,
    requirePermission('chef:manage'),
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
 * DELETE /api/groupes-etablissements/:id/etablissements/:etablissementId
 * Retire un établissement du groupe
 */
router.delete(
    '/:id/etablissements/:etablissementId',
    requireGroupeAccess,
    requirePermission('chef:manage'),
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
 * GET /api/groupes-etablissements/:id/admins
 * Liste les administrateurs du groupe
 */
router.get('/:id/admins', requireGroupeAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupe = await groupesService.getGroupeById(req.params.id);
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'NOT_FOUND');
        }

        // groupe.admins est un tableau de GroupeAdmin
        // Chaque admin a une propriété 'utilisateur' qui contient les infos
        const admins = (groupe.admins || [])
            .filter(admin => admin.utilisateur) // Filtrer les admins sans utilisateur
            .map(admin => ({
                id: admin.id,
                utilisateurId: admin.utilisateurId,
                assignePar: admin.assignePar,
                dateAssignation: admin.dateAssignation?.toISOString(),
                utilisateur: {
                    id: admin.utilisateur.id,
                    nom: (admin.utilisateur as any).nom || (admin.utilisateur as any).pseudonyme || '',
                    prenom: (admin.utilisateur as any).prenom || '',
                    email: admin.utilisateur.email,
                    role: admin.utilisateur.role,
                },
            }));

        res.json({ success: true, data: admins });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/groupes-etablissements/:id/admins
 * Ajoute un administrateur au groupe (nécessite GROUPES_MANAGE)
 */
router.post(
    '/:id/admins',
    requireGroupeAccess,
    requirePermission('chef:manage'),
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
 * DELETE /api/groupes-etablissements/:id/admins/:utilisateurId
 * Retire un administrateur du groupe
 */
router.delete(
    '/:id/admins/:utilisateurId',
    requireGroupeAccess,
    requirePermission('chef:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await groupesService.removeAdmin(req.params.id, req.params.utilisateurId);
            res.json({ success: true, message: 'Administrateur retiré du groupe' });
        } catch (error) {
            next(error);
        }
    }
);

// ==================================
// Dashboard & Rapports Consolidés
// ==================================

/**
 * GET /api/groupes-etablissements/:id/dashboard
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
 * GET /api/groupes-etablissements/:id/rapports/scolarite
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
 * GET /api/groupes-etablissements/:id/rapports/finances
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
// Routes GÉNÉRIQUES CRUD (doivent être APRÈS les routes spécifiques)
// ==================================

/**
 * GET /api/groupes-etablissements
 * Liste tous les groupes (SUPER_ADMIN voient tout, autres voient leurs groupes)
 * Supporte la pagination: ?page=1&limit=20&search=xxx&actif=true
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const actif = req.query.actif ? req.query.actif === 'true' : undefined;
        const utilisateur = req.utilisateur!;

        // Utiliser la pagination côté base de données
        const { groupes, total } = await groupesService.findAllPaginated(
            utilisateur.id,
            utilisateur.role,
            page,
            limit,
            search,
            actif
        );

        // Transformer les groupes vers le format DTO
        const groupesTransformes = groupes.map((g: any) => transformGroupeToDto(g));

        res.json({
            success: true,
            data: groupesTransformes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/groupes-etablissements
 * Crée un nouveau groupe
 */
router.post(
    '/',
    requirePermission('super_admin:all'),
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
 * GET /api/groupes-etablissements/:id
 * Récupère les détails d'un groupe
 */
router.get('/:id', requireGroupeAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupe = await groupesService.getGroupeById(req.params.id);
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'NOT_FOUND');
        }

        // Utiliser la fonction de transformation centralisée avec établissements
        const groupeTransforme = transformGroupeToDto(groupe, true);

        res.json({ success: true, data: groupeTransforme });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/groupes-etablissements/:id
 * Met à jour un groupe (nécessite GROUPES_MANAGE)
 */
router.patch(
    '/:id',
    requireGroupeAccess,
    requirePermission('super_admin:all'),
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
 * DELETE /api/groupes-etablissements/:id
 * Supprime un groupe (soft delete) - seulement le propriétaire
 */
router.delete(
    '/:id',
    requireGroupeAccess,
    requirePermission('chef:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await groupesService.deleteGroupe(req.params.id, req.utilisateur!.id);
            res.json({ success: true, message: 'Groupe supprimé avec succès' });
        } catch (error) {
            next(error);
        }
    }
);

export const groupesController = router;
