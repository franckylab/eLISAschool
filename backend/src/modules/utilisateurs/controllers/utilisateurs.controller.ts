/**
 * ==================================
 * eLISAschool - Controller Utilisateurs
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UtilisateursService } from '../services/utilisateurs.service';
import {
    createUtilisateurSchema,
    updateUtilisateurSchema,
    updateProfilSchema,
    queryUtilisateursSchema,
} from '../dto';
import { authMiddleware, requireRoles, adminOnly } from '@modules/auth/middlewares';
import { Role, StatutUtilisateur } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const utilisateursService = new UtilisateursService();

/**
 * Helper de validation Zod
 */
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', true, { errors });
    }
    return result.data;
}

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * GET /api/utilisateurs
 * Liste des utilisateurs avec pagination et filtres
 * Réservé aux admins et managers
 */
router.get('/', requireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validate(queryUtilisateursSchema, req.query);
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
        if (req.utilisateur!.id !== id && ![Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT].includes(req.utilisateur!.role as Role)) {
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
router.post('/', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const createDto = validate(createUtilisateurSchema, req.body);
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
router.patch('/:id', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updateDto = validate(updateUtilisateurSchema, req.body);
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
        if (req.utilisateur!.id !== id && ![Role.SUPER_ADMIN, Role.ADMIN].includes(req.utilisateur!.role as Role)) {
            throw new AppError('Accès non autorisé', 403, 'FORBIDDEN');
        }

        const updateDto = validate(updateProfilSchema, req.body);
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
router.patch('/:id/statut', adminOnly, async (req: Request, res: Response, next: NextFunction) => {
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
 * DELETE /api/utilisateurs/:id
 * Supprimer un utilisateur
 * Réservé aux super admins
 */
router.delete('/:id', requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await utilisateursService.remove(id);

        res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

export const utilisateursController = router;
export default router;
