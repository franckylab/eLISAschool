/**
 * ==================================
 * eLISAschool - Controller Apparence (Fonds d'écran)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { apparenceService } from '../services';
import {
    ajouterFondSchema,
    modifierFondEtablissementSchema,
    configRotationSchema,
    uploadFondSchema,
    filterCatalogueSchema,
} from '../dto';
import { requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Helper de validation Zod
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', result.error.errors);
    }
    return result.data;
}

// ==================== Catalogue Global ====================

/**
 * GET /api/apparence/fonds/catalogue
 * Lister tous les fonds du catalogue
 */
router.get(
    '/catalogue',
    requirePermission('apparence:fonds:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validate(filterCatalogueSchema, req.query);
            const result = await apparenceService.getCatalogue(query);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/apparence/fonds/catalogue/:id
 * Obtenir un fond par son ID
 */
router.get(
    '/catalogue/:id',
    requirePermission('apparence:fonds:view'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const fond = await apparenceService.getFondById(req.params.id);
            res.json({ success: true, data: fond });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== Fonds par Établissement ====================

/**
 * GET /api/apparence/fonds/etablissement
 * Lister les fonds sélectionnés par l'établissement courant
 */
router.get(
    '/etablissement',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.utilisateur!.etablissementId!;
            const fonds = await apparenceService.getFondsEtablissement(etablissementId);
            res.json({ success: true, data: fonds });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/apparence/fonds/etablissement
 * Ajouter un fond à la sélection de l'établissement
 */
router.post(
    '/etablissement',
    requirePermission('apparence:fonds:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validate(ajouterFondSchema, req.body);
            const etablissementId = req.utilisateur!.etablissementId!;
            const fondEtab = await apparenceService.ajouterFondEtablissement(etablissementId, dto);
            res.status(201).json({ success: true, data: fondEtab });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/apparence/fonds/etablissement/:id
 * Modifier un fond de l'établissement (actif/ordre)
 */
router.patch(
    '/etablissement/:id',
    requirePermission('apparence:fonds:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validate(modifierFondEtablissementSchema, req.body);
            const etablissementId = req.utilisateur!.etablissementId!;
            const fondEtab = await apparenceService.modifierFondEtablissement(
                etablissementId,
                req.params.id,
                dto
            );
            res.json({ success: true, data: fondEtab });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/apparence/fonds/etablissement/:id
 * Retirer un fond de la sélection de l'établissement
 */
router.delete(
    '/etablissement/:id',
    requirePermission('apparence:fonds:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.utilisateur!.etablissementId!;
            await apparenceService.retirerFondEtablissement(etablissementId, req.params.id);
            res.json({ success: true, message: 'Fond retiré de la sélection' });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== Upload ====================

/**
 * POST /api/apparence/fonds/upload
 * Uploader un fond personnalisé
 */
router.post(
    '/upload',
    requirePermission('apparence:fonds:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validate(uploadFondSchema, req.body);
            const etablissementId = req.utilisateur!.etablissementId!;
            const utilisateurId = req.utilisateur!.id;
            const fond = await apparenceService.uploadFond(dto, etablissementId, utilisateurId);
            res.status(201).json({ success: true, data: fond });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/apparence/fonds/:id
 * Supprimer un fond personnalisé
 */
router.delete(
    '/:id',
    requirePermission('apparence:fonds:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const utilisateurId = req.utilisateur!.id;
            await apparenceService.supprimerFond(req.params.id, utilisateurId);
            res.json({ success: true, message: 'Fond supprimé' });
        } catch (error) {
            next(error);
        }
    }
);

// ==================== Configuration Rotation ====================

/**
 * GET /api/apparence/fonds/config
 * Obtenir la configuration de rotation
 */
router.get(
    '/config',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.utilisateur!.etablissementId!;
            const config = await apparenceService.getConfigRotation(etablissementId);
            res.json({ success: true, data: config });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/apparence/fonds/config
 * Mettre à jour la configuration de rotation
 */
router.patch(
    '/config',
    requirePermission('apparence:fonds:manage'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validate(configRotationSchema, req.body);
            const etablissementId = req.utilisateur!.etablissementId!;
            const utilisateurId = req.utilisateur!.id;
            await apparenceService.updateConfigRotation(etablissementId, dto, utilisateurId);
            res.json({ success: true, message: 'Configuration de rotation mise à jour' });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/apparence/fonds/rotation
 * Obtenir les fonds actifs pour la rotation
 */
router.get(
    '/rotation',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissementId = req.utilisateur!.etablissementId!;
            const fonds = await apparenceService.getFondsRotation(etablissementId);
            res.json({ success: true, data: fonds });
        } catch (error) {
            next(error);
        }
    }
);

export const apparenceController = router;
export default router;
