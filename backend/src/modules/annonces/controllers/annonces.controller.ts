/**
 * ==================================
 * eLISAschool - Contrôleur du module Annonces
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Routes HTTP pour la gestion des annonces avec :
 * - Authentification et autorisation RBAC
 * - Validation Zod des entrées
 * - Gestion multi-tenant
 */

import { Router, Request, Response, NextFunction } from 'express';
import { annoncesService } from '../services';
import { createAnnonceSchema, updateAnnonceSchema, annonceConfigurationSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// ==================== HELPER ====================

function validate(schema: any, data: unknown): any {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
  }
  return result.data;
}

// ==================== ROUTES PUBLIQUES ====================

/**
 * GET /api/annonces/actives
 * Récupère les annonces actives visibles par l'utilisateur connecté
 */
router.get(
  '/actives',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;
      const utilisateurRoles = req.utilisateur?.roles || [];

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const annonces = await annoncesService.getAnnoncesActives(
        utilisateurId,
        etablissementId,
        utilisateurRoles
      );

      res.json({
        success: true,
        data: annonces,
        meta: {
          total: annonces.length,
          actualiseA: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== CONFIGURATION ====================

/**
 * GET /api/annonces/configuration
 * Récupère la configuration de la bande d'annonces
 */
router.get(
  '/configuration',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const etablissementId = req.utilisateur?.etablissementId;

      if (!etablissementId) {
        throw new AppError('Établissement requis', 400, 'BAD_REQUEST');
      }

      const configuration = await annoncesService.getConfiguration(etablissementId);

      res.json({
        success: true,
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/annonces/configuration
 * Met à jour la configuration de la bande d'annonces
 */
router.put(
  '/configuration',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const config = validate(annonceConfigurationSchema, req.body);
      const nouvelleConfig = await annoncesService.updateConfiguration(
        config,
        utilisateurId,
        etablissementId
      );

      res.json({
        success: true,
        data: nouvelleConfig,
        message: 'Configuration mise à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/annonces/criteres-ciblage
 * Récupère les critères disponibles pour le ciblage
 */
router.get(
  '/criteres-ciblage',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const etablissementId = req.utilisateur?.etablissementId;

      if (!etablissementId) {
        throw new AppError('Établissement requis', 400, 'BAD_REQUEST');
      }

      const criteres = await annoncesService.getCriteresDisponibles(etablissementId);

      res.json({
        success: true,
        data: criteres,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/annonces/reset-configuration
 * Réinitialise la configuration aux valeurs par défaut
 */
router.post(
  '/reset-configuration',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;
      const { scope, cible } = req.body;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const resultat = await annoncesService.resetConfiguration(
        utilisateurId,
        etablissementId,
        scope || 'all',
        cible
      );

      res.json({
        success: true,
        data: resultat,
        message: `Configuration réinitialisée (${resultat.resetCount} paramètres)`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/annonces/export-configuration
 * Exporte la configuration actuelle
 */
router.get(
  '/export-configuration',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const etablissementId = req.utilisateur?.etablissementId;

      if (!etablissementId) {
        throw new AppError('Établissement requis', 400, 'BAD_REQUEST');
      }

      const configuration = await annoncesService.exportConfiguration(etablissementId);

      res.json({
        success: true,
        data: configuration,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/annonces/import-configuration
 * Importe une configuration
 */
router.post(
  '/import-configuration',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const nouvelleConfig = await annoncesService.importConfiguration(
        req.body,
        utilisateurId,
        etablissementId
      );

      res.json({
        success: true,
        data: nouvelleConfig,
        message: 'Configuration importée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/annonces/statistiques
 * Récupère les statistiques détaillées des annonces
 */
router.get(
  '/statistiques',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const etablissementId = req.utilisateur?.etablissementId;

      if (!etablissementId) {
        throw new AppError('Établissement requis', 400, 'BAD_REQUEST');
      }

      const statistiques = await annoncesService.getStatistiques(etablissementId);

      res.json({
        success: true,
        data: statistiques,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/annonces/mettre-a-jour-statuts
 * Met à jour automatiquement les statuts selon les dates
 */
router.post(
  '/mettre-a-jour-statuts',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resultat = await annoncesService.mettreAJourStatutsAutomatiquement();

      res.json({
        success: true,
        data: resultat,
        message: `Statuts mis à jour: ${resultat.actif} activée(s), ${resultat.archive} archivée(s)`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== CRUD PRINCIPAL ====================

/**
 * GET /api/annonces
 * Liste paginée de toutes les annonces avec filtres
 */
router.get(
  '/',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const etablissementId = req.utilisateur?.etablissementId;

      if (!etablissementId) {
        throw new AppError('Établissement requis', 400, 'BAD_REQUEST');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const filtres = {
        statut: req.query.statut as string | undefined,
        recherche: req.query.recherche as string | undefined,
      };

      const result = await annoncesService.findAll(etablissementId, page, limit, filtres);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/annonces/:id
 * Récupère une annonce par son ID
 */
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!etablissementId) {
        throw new AppError('Établissement requis', 400, 'BAD_REQUEST');
      }

      const annonce = await annoncesService.findOne(id, etablissementId);

      res.json({
        success: true,
        data: annonce,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/annonces
 * Crée une nouvelle annonce
 */
router.post(
  '/',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const dto = validate(createAnnonceSchema, req.body);
      const annonce = await annoncesService.create(dto, utilisateurId, etablissementId);

      res.status(201).json({
        success: true,
        data: annonce,
        message: 'Annonce créée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/annonces/:id
 * Met à jour une annonce existante
 */
router.patch(
  '/:id',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const dto = validate(updateAnnonceSchema, req.body);
      const annonce = await annoncesService.update(id, dto, utilisateurId, etablissementId);

      res.json({
        success: true,
        data: annonce,
        message: 'Annonce mise à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/annonces/:id
 * Supprime une annonce (soft delete)
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      await annoncesService.delete(id, utilisateurId, etablissementId);

      res.json({
        success: true,
        message: 'Annonce supprimée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== WORKFLOW DE VALIDATION ====================

/**
 * POST /api/annonces/:id/soumettre-validation
 * Soumet une annonce pour validation
 */
router.post(
  '/:id/soumettre-validation',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const annonce = await annoncesService.soumettrePourValidation(
        id,
        utilisateurId,
        etablissementId
      );

      res.json({
        success: true,
        data: annonce,
        message: 'Annonce soumise pour validation',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/annonces/:id/valider
 * Valide une annonce
 */
router.post(
  '/:id/valider',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const annonce = await annoncesService.validerAnnonce(id, utilisateurId, etablissementId);

      res.json({
        success: true,
        data: annonce,
        message: 'Annonce validée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/annonces/:id/rejeter
 * Rejette une annonce
 */
router.post(
  '/:id/rejeter',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;
      const { motifRejet } = req.body;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      if (!motifRejet) {
        throw new AppError('Le motif de rejet est requis', 400, 'VALIDATION_ERROR');
      }

      const annonce = await annoncesService.rejeterAnnonce(
        id,
        utilisateurId,
        motifRejet,
        etablissementId
      );

      res.json({
        success: true,
        data: annonce,
        message: 'Annonce rejetée',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== ACTIONS DE GESTION ====================

/**
 * POST /api/annonces/:id/activer
 * Active une annonce
 */
router.post(
  '/:id/activer',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;
      const { avecProgrammation } = req.body;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const annonce = await annoncesService.activerAnnonce(
        id,
        utilisateurId,
        etablissementId,
        avecProgrammation || false
      );

      res.json({
        success: true,
        data: annonce,
        message: avecProgrammation ? 'Annonce programmée avec succès' : 'Annonce activée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/annonces/:id/desactiver
 * Désactive une annonce
 */
router.post(
  '/:id/desactiver',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const annonce = await annoncesService.desactiverAnnonce(id, utilisateurId, etablissementId);

      res.json({
        success: true,
        data: annonce,
        message: 'Annonce désactivée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/annonces/:id/archiver
 * Archive une annonce
 */
router.post(
  '/:id/archiver',
  authMiddleware,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const utilisateurId = req.utilisateur?.id;
      const etablissementId = req.utilisateur?.etablissementId;

      if (!utilisateurId || !etablissementId) {
        throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
      }

      const annonce = await annoncesService.archiverAnnonce(id, utilisateurId, etablissementId);

      res.json({
        success: true,
        data: annonce,
        message: 'Annonce archivée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

export const annoncesController = router;
export default router;
