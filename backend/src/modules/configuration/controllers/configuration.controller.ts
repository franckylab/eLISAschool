/**
 * ==================================
 * eLISAschool - Controller Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ConfigurationService } from '../services/configuration.service';
import { updateConfigAppSchema, activerLicenceSchema, updateConfigModuleSchema } from '../dto';
import { authMiddleware, adminOnly, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const configurationService = new ConfigurationService();

/**
 * Helper de validation
 */
function validate<T>(schema: any, data: unknown): T {
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

/**
 * GET /api/configuration
 * Récupérer la configuration globale (publique pour les infos de base)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configurationService.getConfigApp();

        // Masquer les données sensibles pour les requêtes non authentifiées
        const publicConfig = {
            nomEtablissement: config.nomEtablissement,
            typeEtablissement: config.typeEtablissement,
            logoUrl: config.logoUrl,
            sloganEtablissement: config.sloganEtablissement,
            messageAccueil: config.messageAccueil,
            langueDefaut: config.langueDefaut,
            devise: config.devise,
            couleurPrimaire: config.couleurPrimaire,
            couleurSecondaire: config.couleurSecondaire,
            couleurAccent: config.couleurAccent,
            theme: config.theme,
            version: config.version,
        };

        res.status(200).json({
            success: true,
            data: publicConfig,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/configuration/full
 * Récupérer la configuration complète (admin only)
 */
router.get('/full', authMiddleware, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configurationService.getConfigApp();

        res.status(200).json({
            success: true,
            data: config,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/configuration
 * Mettre à jour la configuration globale
 */
router.patch('/', authMiddleware, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updateDto = validate(updateConfigAppSchema, req.body);
        const config = await configurationService.updateConfigApp(updateDto);

        res.status(200).json({
            success: true,
            data: config,
            message: 'Configuration mise à jour',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/configuration/licence
 * Activer une licence
 */
router.post('/licence', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const licenceDto = validate(activerLicenceSchema, req.body);
        const result = await configurationService.activerLicence(licenceDto);

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
 * GET /api/configuration/modules
 * Liste de tous les modules configurés
 */
router.get('/modules', authMiddleware, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        const modules = await configurationService.getAllModulesConfig(etablissementId);

        res.status(200).json({
            success: true,
            data: modules,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/configuration/modules/:moduleNom
 * Récupérer la configuration d'un module
 */
router.get('/modules/:moduleNom', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { moduleNom } = req.params;
        const etablissementId = req.utilisateur?.etablissementId;
        const config = await configurationService.getConfigModule(moduleNom, etablissementId);

        res.status(200).json({
            success: true,
            data: config,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/configuration/modules/:moduleNom
 * Mettre à jour la configuration d'un module
 */
router.patch('/modules/:moduleNom', authMiddleware, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { moduleNom } = req.params;
        const updateDto = validate(updateConfigModuleSchema, req.body);
        const etablissementId = req.utilisateur?.etablissementId;
        const config = await configurationService.updateConfigModule(moduleNom, updateDto, etablissementId);

        res.status(200).json({
            success: true,
            data: config,
            message: `Configuration du module ${moduleNom} mise à jour`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/configuration/modules/:moduleNom/toggle
 * Activer/désactiver un module
 */
router.post('/modules/:moduleNom/toggle', authMiddleware, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { moduleNom } = req.params;
        const { actif } = req.body;

        if (typeof actif !== 'boolean') {
            throw new AppError('Le paramètre "actif" doit être un booléen', 400, 'INVALID_PARAM');
        }

        const config = await configurationService.toggleModule(moduleNom, actif);

        res.status(200).json({
            success: true,
            data: { modulesActifs: config.modulesActifs },
            message: `Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

export const configurationController = router;
export default router;
