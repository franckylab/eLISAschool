/**
 * ==================================
 * eLISAschool - Controller Utilisateurs
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UtilisateursService } from '../services/utilisateurs.service';
import { verificationSuppressionService } from '../services/verification-suppression.service';
import {
    createUtilisateurSchema,
    updateUtilisateurSchema,
    updateProfilSchema,
    queryUtilisateursSchema,
    toggleStatutSchema,
    supprimerUtilisateurSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role as RoleEntity, StatutUtilisateur } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils';
import { utilisateurEtablissementService } from '@modules/auth/services';

const router = Router();
const utilisateursService = new UtilisateursService();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/utilisateurs
 * Liste des utilisateurs avec pagination et filtres
 * Réservé aux admins et managers
 */
router.get('/', requirePermission('utilisateurs:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryUtilisateursSchema, req.query);
        const result = await utilisateursService.findAll(query);

        res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/utilisateurs/:id
 * Récupérer un utilisateur par ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Les utilisateurs peuvent voir leur propre profil, les admins peuvent voir tous
        if (req.utilisateur!.id !== id && ![Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT].includes(req.utilisateur!.role as unknown as Role)) {
            throw new AppError('Accès non autorisé', 403, 'FORBIDDEN');
        }

        const utilisateur = await utilisateursService.findOne(id);

        res.status(200).json({
            success: true,
            data: utilisateur,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/utilisateurs
 * Créer un nouvel utilisateur
 * Réservé aux admins
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const createDto = validateDto(createUtilisateurSchema, req.body);
        const utilisateur = await utilisateursService.create(createDto);

        res.status(201).json({
            success: true,
            data: utilisateur,
            message: 'Utilisateur créé avec succès',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/utilisateurs/:id
 * Mettre à jour un utilisateur
 * Réservé aux admins
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updateDto = validateDto(updateUtilisateurSchema, req.body);
        const utilisateur = await utilisateursService.update(id, updateDto);

        res.status(200).json({
            success: true,
            data: utilisateur,
            message: 'Utilisateur mis à jour',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/utilisateurs/:id/profil
 * Mettre à jour le profil d'un utilisateur
 * L'utilisateur peut modifier son propre profil, les admins peuvent modifier tous
 */
router.patch('/:id/profil', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Vérification des permissions
        if (req.utilisateur!.id !== id && ![Role.SUPER_ADMIN, Role.ADMIN].includes(req.utilisateur!.role as unknown as Role)) {
            throw new AppError('Accès non autorisé', 403, 'FORBIDDEN');
        }

        const updateDto = validateDto(updateProfilSchema, req.body);
        const utilisateur = await utilisateursService.updateProfil(id, updateDto);

        res.status(200).json({
            success: true,
            data: utilisateur,
            message: 'Profil mis à jour',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/utilisateurs/:id/statut
 * Changer le statut d'un utilisateur
 * Réservé aux admins
 */
router.patch('/:id/statut', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        if (!Object.values(StatutUtilisateur).includes(statut)) {
            throw new AppError('Statut invalide', 400, 'INVALID_STATUS');
        }

        const utilisateur = await utilisateursService.changeStatut(id, statut);

        res.status(200).json({
            success: true,
            data: utilisateur,
            message: `Statut changé en ${statut}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/utilisateurs/:id/etablissements/:etablissementId/statut
 * Activer ou désactiver un utilisateur dans un établissement spécifique
 * Permission: utilisateurs:statut:change
 */
router.patch(
    '/:id/etablissements/:etablissementId/statut',
    requirePermission('utilisateurs:statut:change'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id: utilisateurId, etablissementId } = req.params;
            const dto = validateDto(toggleStatutSchema, req.body);

            const affectation = await utilisateurEtablissementService.toggleStatut(
                utilisateurId,
                etablissementId,
                dto.actif,
                dto.motif,
                req.utilisateur!.id,
                req
            );

            res.status(200).json({
                success: true,
                data: {
                    utilisateurId,
                    etablissementId,
                    actif: affectation.actif,
                    motif: affectation.motif,
                },
                message: affectation.actif
                    ? 'Utilisateur réactivé avec succès'
                    : 'Utilisateur désactivé avec succès',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/utilisateurs/:id/verifier-suppression
 * Vérifier les impacts avant suppression d'un utilisateur
 * 
 * Query params:
 * - etablissementId (optionnel): Contexte établissement pour filtrage
 * 
 * Retourne:
 * - Impacts détaillés par catégorie (comptages)
 * - Éléments critiques bloquants
 * - Permissions requises pour chaque mode
 * - Mode recommandé
 */
router.get(
    '/:id/verifier-suppression',
    requirePermission('utilisateurs:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const etablissementId = req.query.etablissementId as string | undefined;

            const verification = await verificationSuppressionService.verifierSuppression(
                id,
                etablissementId,
                req.utilisateur?.permissions
            );

            res.status(200).json({
                success: true,
                data: verification,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/utilisateurs/:id
 * Supprimer un utilisateur (soft delete ou cascade)
 * 
 * Body:
 * - mode: 'soft' | 'cascade'
 * - motif: string (obligatoire, min 10 caractères)
 * - etablissementId: string (optionnel)
 * 
 * Permissions:
 * - soft: utilisateurs:delete
 * - cascade: super_admin:all (SUPER_ADMIN a automatiquement toutes les permissions)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        
        // Valider le body
        const deleteDto = validateDto(supprimerUtilisateurSchema, req.body);
        const { mode, motif, etablissementId } = deleteDto;

        // Vérifier les permissions selon le mode
        if (mode === 'cascade') {
            // requirePermission vérifie automatiquement si SUPER_ADMIN
            requirePermission('super_admin:all')(req, res, () => {});
        } else {
            requirePermission('utilisateurs:delete')(req, res, () => {});
        }

        // Vérifier les éléments critiques avant cascade
        if (mode === 'cascade' && etablissementId) {
            const verification = await verificationSuppressionService.verifierSuppression(
                id,
                etablissementId,
                req.utilisateur?.permissions
            );

            if (verification.blocageTotal) {
                throw new AppError(
                    `Suppression en cascade impossible: ${verification.raisonBlocage}`,
                    400,
                    'BLOCAGE_ELEMENTS_CRITIQUES',
                    false,
                    { elementsCritiques: verification.elementsCritiques }
                );
            }
        }

        // Exécuter la suppression
        if (mode === 'soft') {
            await utilisateursService.remove(id, motif);
        } else {
            await utilisateursService.removeCascade(id, motif, etablissementId);
        }

        res.status(200).json({
            success: true,
            message: mode === 'soft' 
                ? 'Utilisateur désactivé avec succès'
                : 'Utilisateur supprimé définitivement avec succès',
            mode,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

export const utilisateursController = router;
export default router;
