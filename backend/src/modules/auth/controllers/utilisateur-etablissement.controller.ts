/**
 * ==================================
 * eLISAschool - Controller Gestion Multi-Établissements
 * ==================================
 * Version: 2.0.0
 * 
 * Endpoints pour gérer les affectations d'utilisateurs à plusieurs établissements.
 * 
 * Routes :
 * - POST   /api/utilisateurs/:id/etablissements         - Ajouter un établissement
 * - DELETE /api/utilisateurs/:id/etablissements/:eid    - Retirer un établissement
 * - PATCH  /api/utilisateurs/:id/etablissements/:eid/principal - Définir principal
 * - GET    /api/utilisateurs/:id/etablissements         - Lister les établissements
 * - GET    /api/utilisateurs/:id/etablissements/verify/:eid - Vérifier accès
 */

import { Request, Response, Router } from 'express';
import { utilisateurEtablissementService, AffecterUtilisateurDto } from '../services/utilisateur-etablissement.service';
import { Role } from '@modules/auth/entities';
import { authMiddleware } from '@modules/auth/middlewares/auth.middleware';
import { checkPermission } from '@modules/auth/guards/check-permission.middleware';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * POST /api/utilisateurs/:id/etablissements
 * Ajouter un établissement à un utilisateur
 * 
 * Permission: utilisateurs:manage ou SUPER_ADMIN
 */
router.post(
    '/:id/etablissements',
    checkPermission('utilisateurs:manage'),
    async (req: Request, res: Response, next) => {
        try {
            const { etablissementId, role, etablissementPrincipal, dateDebut, dateFin, motif } = req.body;

            // Validation
            if (!etablissementId || !role) {
                throw new AppError(
                    'etablissementId et role sont requis',
                    400,
                    'MISSING_FIELDS'
                );
            }

            if (!Object.values(Role).includes(role)) {
                throw new AppError(
                    `Rôle invalide. Valeurs acceptées: ${Object.values(Role).join(', ')}`,
                    400,
                    'INVALID_ROLE'
                );
            }

            const dto: AffecterUtilisateurDto = {
                utilisateurId: req.params.id,
                etablissementId,
                role,
                etablissementPrincipal: etablissementPrincipal || false,
                dateDebut,
                dateFin,
                motif,
            };

            const affectation = await utilisateurEtablissementService.ajouter(
                dto,
                req.utilisateur.id
            );

            res.status(201).json({
                success: true,
                message: 'Établissement ajouté avec succès',
                data: affectation,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/utilisateurs/:id/etablissements/:etablissementId
 * Retirer un établissement à un utilisateur (désactivation logique)
 * 
 * Permission: utilisateurs:manage ou SUPER_ADMIN
 */
router.delete(
    '/:id/etablissements/:etablissementId',
    checkPermission('utilisateurs:manage'),
    async (req: Request, res: Response, next) => {
        try {
            await utilisateurEtablissementService.retirer(
                req.params.id,
                req.params.etablissementId
            );

            res.status(200).json({
                success: true,
                message: 'Établissement retiré avec succès',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/utilisateurs/:id/etablissements/:etablissementId/principal
 * Définir l'établissement principal
 * 
 * Permission: utilisateurs:manage ou SUPER_ADMIN
 */
router.patch(
    '/:id/etablissements/:etablissementId/principal',
    checkPermission('utilisateurs:manage'),
    async (req: Request, res: Response, next) => {
        try {
            await utilisateurEtablissementService.definirPrincipal(
                req.params.id,
                req.params.etablissementId
            );

            res.status(200).json({
                success: true,
                message: 'Établissement principal défini avec succès',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/utilisateurs/:id/etablissements
 * Lister tous les établissements d'un utilisateur
 * 
 * Permission: utilisateurs:read ou l'utilisateur lui-même
 */
router.get(
    '/:id/etablissements',
    async (req: Request, res: Response, next) => {
        try {
            // Vérification des permissions
            const isOwner = req.utilisateur?.id === req.params.id;
            const hasPerm = req.utilisateur?.permissions?.includes('utilisateurs:read') ||
                            req.utilisateur?.role === Role.SUPER_ADMIN;

            if (!isOwner && !hasPerm) {
                throw new AppError(
                    'Vous n\'avez pas la permission de voir ces informations',
                    403,
                    'FORBIDDEN'
                );
            }

            const etablissements = await utilisateurEtablissementService.findByUtilisateur(
                req.params.id
            );

            res.status(200).json({
                success: true,
                data: etablissements,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/utilisateurs/:id/etablissements/verify/:etablissementId
 * Vérifier si un utilisateur a accès à un établissement
 * 
 * Permission: utilisateurs:read ou SUPER_ADMIN
 */
router.get(
    '/:id/etablissements/verify/:etablissementId',
    checkPermission('utilisateurs:read'),
    async (req: Request, res: Response, next) => {
        try {
            const hasAccess = await utilisateurEtablissementService.hasAccess(
                req.params.id,
                req.params.etablissementId
            );

            res.status(200).json({
                success: true,
                data: {
                    utilisateurId: req.params.id,
                    etablissementId: req.params.etablissementId,
                    hasAccess,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/utilisateurs/:id/etablissements/:etablissementId/role
 * Mettre à jour le rôle d'un utilisateur dans un établissement
 * 
 * Permission: utilisateurs:manage ou SUPER_ADMIN
 */
router.patch(
    '/:id/etablissements/:etablissementId/role',
    checkPermission('utilisateurs:manage'),
    async (req: Request, res: Response, next) => {
        try {
            const { role } = req.body;

            if (!role || !Object.values(Role).includes(role)) {
                throw new AppError(
                    `Rôle invalide. Valeurs acceptées: ${Object.values(Role).join(', ')}`,
                    400,
                    'INVALID_ROLE'
                );
            }

            const affectation = await utilisateurEtablissementService.updateRole(
                req.params.id,
                req.params.etablissementId,
                role
            );

            res.status(200).json({
                success: true,
                message: 'Rôle mis à jour avec succès',
                data: affectation,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
