/**
 * ==================================
 * eLISAschool - Controller Préférences Globales
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { preferenceGlobaleService } from '../services/preference-globale.service';
import { CategoriePreference } from '@modules/auth/entities/preference-utilisateur.entity';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { z } from 'zod';

const router = Router();

// Helper de validation
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError(
            `Données invalides: ${result.error.errors[0]?.message}`,
            400,
            'VALIDATION_ERROR'
        );
    }
    return result.data;
}

// Schémas de validation
const setPreferenceSchema = z.object({
    cle: z.string().min(2).max(100),
    valeur: z.string(),
});

// ==================================
// ROUTES PUBLIQUES (non authentifiées)
// ==================================

// Aucune route publique

// ==================================
// ROUTES AUTHENTIFIÉES
// ==================================

/**
 * GET /api/preferences-globales
 * Obtenir toutes les préférences globales de l'établissement
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId;
        const { categorie } = req.query;

        const prefs = await preferenceGlobaleService.getToutesPreferences(
            etablissementId!,
            categorie as CategoriePreference
        );

        res.json({ success: true, data: prefs });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/preferences-globales/statistiques
 * Obtenir les statistiques des préférences globales
 */
router.get('/statistiques', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId;

        const stats = await preferenceGlobaleService.getStatistiques(etablissementId!);

        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/preferences-globales/:cle/valeur
 * Obtenir la valeur effective d'une préférence pour l'utilisateur
 */
router.get('/:cle/valeur', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle } = req.params;
        const utilisateurId = req.utilisateur!.id;
        const etablissementId = req.utilisateur!.etablissementId;

        const { preferenceUtilisateurService } = await import('@modules/auth/services');

        const valeur = await preferenceGlobaleService.getValeurEffective(
            cle,
            etablissementId!,
            preferenceUtilisateurService,
            utilisateurId
        );

        res.json({ success: true, data: { cle, valeur } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/preferences-globales
 * Définir ou mettre à jour une préférence globale
 */
router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId;
        const utilisateurId = req.utilisateur!.id;
        const dto = validate(setPreferenceSchema, req.body);

        const preference = await preferenceGlobaleService.setPreference(
            dto.cle,
            dto.valeur,
            etablissementId!,
            utilisateurId
        );

        logger.info('[PrefGlobales] Préférence mise à jour', {
            cle: dto.cle,
            etablissementId,
            utilisateurId,
        });

        res.status(201).json({ success: true, data: preference });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/preferences-globales/reset
 * Réinitialiser toutes les préférences globales
 */
router.post('/reset', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId;
        const utilisateurId = req.utilisateur!.id;

        const count = await preferenceGlobaleService.resetAll(
            etablissementId!,
            utilisateurId
        );

        logger.warn('[PrefGlobales] Toutes les préférences réinitialisées', {
            etablissementId,
            count,
            utilisateurId,
        });

        res.json({ success: true, data: { count } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/preferences-globales/reset/:cle
 * Réinitialiser une préférence spécifique
 */
router.post('/reset/:cle', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle } = req.params;
        const etablissementId = req.utilisateur!.etablissementId;
        const utilisateurId = req.utilisateur!.id;

        const preference = await preferenceGlobaleService.resetPreference(
            cle,
            etablissementId!,
            utilisateurId
        );

        res.json({ success: true, data: preference });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/preferences-globales/reset-categorie/:categorie
 * Réinitialiser toutes les préférences d'une catégorie
 */
router.post('/reset-categorie/:categorie', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { categorie } = req.params;
        const etablissementId = req.utilisateur!.etablissementId;
        const utilisateurId = req.utilisateur!.id;

        // Vérifier que la catégorie est valide
        if (!Object.values(CategoriePreference).includes(categorie as CategoriePreference)) {
            throw new AppError(`Catégorie invalide: ${categorie}`, 400);
        }

        const count = await preferenceGlobaleService.resetCategorie(
            categorie as CategoriePreference,
            etablissementId!,
            utilisateurId
        );

        res.json({ success: true, data: { count, categorie } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/preferences-globales/init
 * Initialiser les préférences par défaut (utile après création d'établissement)
 */
router.post('/init', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId } = req.body;
        const utilisateurId = req.utilisateur!.id;

        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400);
        }

        await preferenceGlobaleService.initialiserDefaults(etablissementId, utilisateurId);

        res.json({ success: true, message: 'Préférences par défaut initialisées' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/preferences-globales/export
 * Exporter toutes les préférences en JSON
 */
router.get('/export', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId;

        const jsonExport = await preferenceGlobaleService.exporterPreferences(etablissementId!);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="preferences-${etablissementId}-${new Date().toISOString().split('T')[0]}.json"`);
        res.send(jsonExport);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/preferences-globales/import
 * Importer des préférences depuis un fichier JSON
 */
router.post('/import', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId;
        const utilisateurId = req.utilisateur!.id;
        const { jsonData, mode = 'merge' } = req.body;

        if (!jsonData) {
            throw new AppError('jsonData requis (string JSON)', 400);
        }

        const resultat = await preferenceGlobaleService.importerPreferences(
            jsonData,
            etablissementId!,
            utilisateurId,
            mode
        );

        logger.info('[PrefGlobales] Import effectué', {
            etablissementId,
            mode,
            ...resultat,
            utilisateurId,
        });

        res.json({ success: true, data: resultat });
    } catch (error) {
        next(error);
    }
});

export const preferencesGlobalesController = router;
