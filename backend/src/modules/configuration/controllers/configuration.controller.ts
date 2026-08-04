/**
 * ==================================
 * eLISAschool - Controller Configuration v4.0
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 * 
 * Endpoints CRUD, historique, sauvegarde, restauration
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ConfigurationService } from '../services/configuration.service';
import { ConfigurationSeedService } from '../services/configuration-seed.service';
import { ConfigurationHistoryService } from '../services/configuration-history.service';
import { configurationListener } from '../services/configuration-listener';
import { ActionConfiguration, CibleConfiguration } from '../entities/historique-configuration.entity';
import {
    updateConfigAppSchema,
    activerLicenceSchema,
    updateConfigModuleSchema,
    createParametreSchema,
    updateParametreSchema,
    updateParametresBulkSchema,
    queryParametresSchema,
    exportConfigSchema,
    toggleModuleSchema,
} from '../dto';
import { CategorieParametre } from '../entities/parametre-systeme.entity';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils';
import { MODULE_REGISTRY } from '@shared/config/config.registry';
import { ModuleName, MODULE_CATEGORIES } from '@shared/enums/modules.enum';
import {
    canViewConfigApp,
    canEditConfigApp,
    canViewConfigModule,
    canEditConfigModule,
    canToggleModule,
    canViewParams,
    canCreateParams,
    canEditParams,
    canDeleteParams,
    canResetParams,
    canViewHistory,
    canRestoreHistory,
    canCreateBackup,
    canRestoreBackup,
    canExportConfig,
    canInvalidateCache,
} from '../guards';

const router = Router();
const configurationService = new ConfigurationService();
const seedService = new ConfigurationSeedService();
const historyService = new ConfigurationHistoryService();

// =============================================
// CONFIGURATION APPLICATION - Migré vers ParametreSysteme
// =============================================

/**
 * GET /api/configuration
 * Récupère les paramètres globaux de l'application
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Récupérer les paramètres globaux depuis ParametreSysteme
        const params = await configurationService.getParametres({ visible: true });
        
        // Construire la configuration publique
        const publicConfig: any = {};
        for (const param of params) {
            if (!param.etablissementId) { // Uniquement les paramètres globaux
                try {
                    publicConfig[param.cle] = JSON.parse(param.valeur);
                } catch {
                    publicConfig[param.cle] = param.valeur;
                }
            }
        }
        
        res.json({ success: true, data: publicConfig });
    } catch (error) { next(error); }
});

/**
 * GET /api/configuration/full
 * Récupère TOUS les paramètres (admin uniquement)
 */
router.get('/full', authMiddleware, canViewConfigApp, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = await configurationService.getAllParametres();
        res.json({ success: true, data: params });
    } catch (error) { next(error); }
});

/**
 * PATCH /api/configuration
 * Met à jour les paramètres globaux
 */
router.patch('/', authMiddleware, canEditConfigApp, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateConfigAppSchema, req.body);
        
        // Mettre à jour chaque paramètre individuellement
        const updated: any = {};
        for (const [key, value] of Object.entries(dto)) {
            if (value !== undefined) {
                await configurationService.setParametre(`app.${key}`, value);
                updated[key] = value;
            }
        }

        await historyService.logAction({
            utilisateurId: req.utilisateur?.id,
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.APP,
            nouvelleValeur: updated,
            req,
        });

        configurationListener.emitChange({
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.APP,
            nouvelleValeur: updated,
            timestamp: new Date(),
            utilisateurId: req.utilisateur?.id,
        });

        logger.info('Configuration application mise à jour (via ParametreSysteme)');
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.post('/licence', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(activerLicenceSchema, req.body);
        const result = await configurationService.activerLicence(dto);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// =============================================
// MODULES
// =============================================

router.get('/modules', authMiddleware, canViewConfigModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const modules = await configurationService.getAllModulesConfig(req.utilisateur?.etablissementId);
        res.json({ success: true, data: modules });
    } catch (error) { next(error); }
});

// Registry des modules (depuis MODULE_REGISTRY) - doit être avant /modules/:moduleNom
router.get('/modules/registry', authMiddleware, canViewConfigModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        const registry = await Promise.all(
            Object.values(MODULE_REGISTRY).map(async (config) => {
                const actif = await configurationService.isModuleActive(config.name, etablissementId);
                return {
                    name: config.name,
                    label: config.label,
                    description: config.description,
                    icon: config.icon,
                    basePath: config.basePath,
                    category: MODULE_CATEGORIES[config.name],
                    defaultActive: config.defaultActive,
                    premium: config.premium,
                    dependencies: config.dependencies,
                    defaultRoles: config.defaultRoles,
                    actif,
                };
            })
        );
        res.json({ success: true, data: registry });
    } catch (error) { next(error); }
});

// Impact d'activation/désactivation
router.get('/modules/registry/impact', authMiddleware, canViewConfigModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { moduleNom, actif } = req.query;
        if (!moduleNom || typeof actif === 'undefined') {
            throw new AppError('moduleNom et actif requis', 400, 'MISSING_PARAMS');
        }
        const isActivating = actif === 'true';
        const etablissementId = req.utilisateur?.etablissementId;
        const impact = await configurationService.calculerImpactActivation(
            moduleNom as string,
            isActivating,
            etablissementId
        );
        res.json({ success: true, data: impact });
    } catch (error) { next(error); }
});

router.get('/modules/:moduleNom', authMiddleware, canViewConfigModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configurationService.getConfigModule(req.params.moduleNom, req.utilisateur?.etablissementId);
        res.json({ success: true, data: config });
    } catch (error) { next(error); }
});

router.patch('/modules/:moduleNom', authMiddleware, canEditConfigModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateConfigModuleSchema, req.body);
        const config = await configurationService.updateConfigModule(req.params.moduleNom, dto, req.utilisateur?.etablissementId);

        configurationListener.emitChange({
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.MODULE,
            cibleNom: req.params.moduleNom,
            nouvelleValeur: config,
            timestamp: new Date(),
            utilisateurId: req.utilisateur?.id,
        });

        res.json({ success: true, data: config, message: `Module ${req.params.moduleNom} configuré` });
    } catch (error) { next(error); }
});

router.post('/modules/:moduleNom/toggle', authMiddleware, canToggleModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { actif } = validateDto(toggleModuleSchema, req.body);
        const result = await configurationService.toggleModule(
            req.params.moduleNom,
            actif,
            req.utilisateur?.etablissementId,
            req.utilisateur?.id,
            req
        );
        res.json({ success: true, data: result, message: result.message });
    } catch (error) { next(error); }
});

// Nouvelle route toggle avec moduleNom dans le body (correspond au frontend)
router.post('/modules/toggle', authMiddleware, canToggleModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { moduleNom, actif } = req.body;
        if (!moduleNom || typeof actif !== 'boolean') {
            throw new AppError('moduleNom (string) et actif (boolean) requis', 400, 'INVALID_TOGGLE_BODY');
        }
        const result = await configurationService.toggleModule(
            moduleNom,
            actif,
            req.utilisateur?.etablissementId,
            req.utilisateur?.id,
            req
        );
        res.json({ success: true, data: result, message: result.message });
    } catch (error) { next(error); }
});

router.get('/modules/:moduleNom/dependencies', authMiddleware, canViewConfigModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const moduleNom = req.params.moduleNom;
        const etablissementId = req.utilisateur?.etablissementId;
        
        const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
        if (!registryConfig) {
            throw new AppError(`Module "${moduleNom}" non trouvé dans le registre`, 404, 'MODULE_NOT_FOUND');
        }

        // Dépendances (depuis ParametreSysteme - source de vérité)
        const dependances = [];
        for (const dep of (registryConfig.dependencies || [])) {
            const depConfig = MODULE_REGISTRY[dep];
            const actif = await configurationService.isModuleActive(dep, etablissementId);
            dependances.push({
                nom: dep,
                label: depConfig?.label || dep,
                actif,
                requis: true,
            });
        }

        // Reverse dépendances (depuis ParametreSysteme)
        const reverseDependances = [];
        for (const revDep of configurationService.getReverseDependencies(moduleNom)) {
            const revConfig = MODULE_REGISTRY[revDep];
            const actif = await configurationService.isModuleActive(revDep, etablissementId);
            reverseDependances.push({
                nom: revDep,
                label: revConfig?.label || revDep,
                actif,
            });
        }

        // État actuel (utilise le cache maintenant)
        const estActif = await configurationService.isModuleActive(moduleNom, etablissementId);

        // Peut être activé? (utilise la méthode publique)
        const verification = await configurationService.verifierActivationModule(moduleNom, etablissementId);
        const peutEtreActive = verification.valide;
        const bloquages = verification.erreurs;

        res.json({
            success: true,
            data: {
                moduleNom,
                label: registryConfig.label,
                dependances,
                reverseDependances,
                estActif,
                peutEtreActive,
                bloquages,
            }
        });
    } catch (error) { next(error); }
});

// =============================================
// PARAMÈTRES
// =============================================

router.get('/parametres', authMiddleware, canViewParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryParametresSchema, req.query);
        const parametres = await configurationService.getParametres(query, req.utilisateur?.etablissementId);
        res.json({ success: true, data: parametres, total: parametres.length });
    } catch (error) { next(error); }
});

router.get('/parametres/categories', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({ success: true, data: Object.values(CategorieParametre) });
    } catch (error) { next(error); }
});

router.get('/parametres/categorie/:categorie', authMiddleware, canViewParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parametres = await configurationService.getParametresByCategorie(req.params.categorie as CategorieParametre);
        res.json({ success: true, data: parametres });
    } catch (error) { next(error); }
});

router.get('/parametres/module/:module', authMiddleware, canViewParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parametres = await configurationService.getParametresByModule(req.params.module);
        res.json({ success: true, data: parametres });
    } catch (error) { next(error); }
});

router.get('/parametres/:cle', authMiddleware, canViewParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Utiliser req.etablissementId pour la résolution avec fallback
        const etablissementId = req.utilisateur?.role === Role.SUPER_ADMIN
            ? (req.query.etablissementId as string | undefined)
            : req.etablissementId;

        const valeur = await configurationService.getParametre(req.params.cle, etablissementId);
        
        if (valeur === null) {
            throw new AppError('Paramètre non trouvé', 404, 'NOT_FOUND');
        }
        
        // Retourner aussi les métadonnées du paramètre
        const paramGlobal = await configurationService.getParametreByKey(req.params.cle);
        
        res.json({ 
            success: true, 
            data: {
                cle: req.params.cle,
                valeur,
                etablissementId: etablissementId || null,
                metadata: paramGlobal ? {
                    description: paramGlobal.description,
                    typeValeur: paramGlobal.typeValeur,
                    categorie: paramGlobal.categorie,
                } : null
            }
        });
    } catch (error) { next(error); }
});

router.post('/parametres', authMiddleware, canCreateParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createParametreSchema, req.body);
        
        // SUPER_ADMIN peut créer pour un établissement spécifique
        const etablissementId = req.utilisateur?.role === Role.SUPER_ADMIN
            ? dto.etablissementId
            : req.etablissementId;
        
        const param = await configurationService.createParametre({
            ...dto,
            etablissementId
        }, req.utilisateur?.id, req);

        await historyService.logAction({
            utilisateurId: req.utilisateur?.id,
            action: ActionConfiguration.CREATE,
            cible: CibleConfiguration.PARAMETRE,
            cibleNom: etablissementId ? `${dto.cle} [${etablissementId}]` : dto.cle,
            nouvelleValeur: dto.valeur,
            req,
        });

        res.status(201).json({ 
            success: true, 
            data: param, 
            message: `Paramètre créé${etablissementId ? ' pour cet établissement' : ''}` 
        });
    } catch (error) { next(error); }
});

router.put('/parametres/:cle', authMiddleware, canEditParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateParametreSchema, req.body);
        
        // Utiliser req.etablissementId pour le scopage
        const etablissementId = req.utilisateur?.role === Role.SUPER_ADMIN
            ? (req.query.etablissementId as string | undefined)
            : req.etablissementId;
        
        const ancienParam = await configurationService.getParametreByKey(req.params.cle);
        
        // Utiliser setParametre qui gère le scopage
        const param = await configurationService.setParametre(
            req.params.cle, 
            dto.valeur,
            etablissementId,
            req.utilisateur?.id,
            req
        );

        await historyService.logAction({
            utilisateurId: req.utilisateur?.id,
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.PARAMETRE,
            cibleNom: etablissementId ? `${req.params.cle} [${etablissementId}]` : req.params.cle,
            ancienneValeur: ancienParam?.valeur,
            nouvelleValeur: param.valeur,
            restaurable: true,
            req,
        });

        configurationListener.emitChange({
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.PARAMETRE,
            cibleNom: req.params.cle,
            ancienneValeur: ancienParam?.valeur,
            nouvelleValeur: param.valeur,
            timestamp: new Date(),
            utilisateurId: req.utilisateur?.id,
        });

        res.json({ 
            success: true, 
            data: param, 
            message: `Paramètre mis à jour${etablissementId ? ' pour cet établissement' : ''}` 
        });
    } catch (error) { next(error); }
});

router.delete('/parametres/:cle', authMiddleware, canDeleteParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Utiliser req.etablissementId pour le scopage
        const etablissementId = req.utilisateur?.role === Role.SUPER_ADMIN
            ? (req.query.etablissementId as string | undefined)
            : req.etablissementId;
        
        if (etablissementId) {
            // Supprimer l'override pour cet établissement (retour au global)
            const param = await configurationService.getParametre(req.params.cle, etablissementId);
            await configurationService.resetParametre(
                req.params.cle,
                etablissementId,
                req.utilisateur?.id,
                req
            );

            await historyService.logAction({
                utilisateurId: req.utilisateur?.id,
                action: ActionConfiguration.DELETE,
                cible: CibleConfiguration.PARAMETRE,
                cibleNom: `${req.params.cle} [${etablissementId}] (override)`,
                ancienneValeur: param ? JSON.stringify(param) : undefined,
                req,
            });

            res.json({ 
                success: true, 
                message: `Override supprimé - retour au paramètre global` 
            });
        } else {
            // Supprimer le paramètre global (seulement si aucun override n'existe)
            const param = await configurationService.getParametreByKey(req.params.cle);
            await configurationService.deleteParametre(req.params.cle, req.utilisateur?.id, req);

            await historyService.logAction({
                utilisateurId: req.utilisateur?.id,
                action: ActionConfiguration.DELETE,
                cible: CibleConfiguration.PARAMETRE,
                cibleNom: req.params.cle,
                ancienneValeur: param?.valeur,
                req,
            });

            res.json({ success: true, message: 'Paramètre global supprimé' });
        }
    } catch (error) { next(error); }
});

router.post('/parametres/:cle/reset', authMiddleware, canResetParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ancienParam = await configurationService.getParametreByKey(req.params.cle);
        await configurationService.resetParametre(req.params.cle);
        const nouveauParam = await configurationService.getParametreByKey(req.params.cle);

        await historyService.logAction({
            utilisateurId: req.utilisateur?.id,
            action: ActionConfiguration.RESET,
            cible: CibleConfiguration.PARAMETRE,
            cibleNom: req.params.cle,
            ancienneValeur: ancienParam?.valeur,
            nouvelleValeur: nouveauParam?.valeur,
            req,
        });

        res.json({ success: true, data: nouveauParam, message: 'Paramètre réinitialisé' });
    } catch (error) { next(error); }
});

router.post('/parametres/reset-all', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId } = req.body || {};
        
        const result = await configurationService.resetAllParametres(
            etablissementId,
            req.utilisateur?.id,
            req
        );

        res.json({ 
            success: true, 
            data: result, 
            message: `${result.resetCount} paramètres réinitialisés sur ${result.total}` 
        });
    } catch (error) { next(error); }
});

router.put('/parametres/bulk', authMiddleware, canEditParams, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateParametresBulkSchema, req.body);
        const count = await configurationService.updateParametresBulk(dto);
        res.json({ success: true, data: { updated: count }, message: `${count} paramètres mis à jour` });
    } catch (error) { next(error); }
});

// =============================================
// HISTORIQUE
// =============================================

router.get('/historique', authMiddleware, canViewHistory, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cible, action, dateDebut, dateFin, limit, offset } = req.query;
        const result = await historyService.getHistorique({
            cible: cible as CibleConfiguration,
            action: action as ActionConfiguration,
            dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
            dateFin: dateFin ? new Date(dateFin as string) : undefined,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0,
        });
        res.json({ success: true, data: result.items, total: result.total });
    } catch (error) { next(error); }
});

router.post('/historique/:id/restore', authMiddleware, canRestoreHistory, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await historyService.restaurer(req.params.id, req.utilisateur?.id);
        configurationListener.emitRestored({ from: req.params.id, timestamp: new Date() });
        res.json({ success: true, message: 'Configuration restaurée' });
    } catch (error) { next(error); }
});

// =============================================
// SAUVEGARDES
// =============================================

router.get('/sauvegardes', authMiddleware, canViewHistory, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const sauvegardes = await historyService.getSauvegardes(limit);
        res.json({ success: true, data: sauvegardes });
    } catch (error) { next(error); }
});

router.post('/sauvegardes', authMiddleware, canCreateBackup, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await historyService.creerSauvegarde(req.utilisateur?.id);
        res.status(201).json({ success: true, data: result, message: 'Sauvegarde créée' });
    } catch (error) { next(error); }
});

router.post('/sauvegardes/:id/restore', authMiddleware, canRestoreBackup, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await historyService.restaurerSauvegarde(req.params.id, req.utilisateur?.id);
        configurationListener.emitCacheInvalidated();
        res.json({ success: true, message: 'Sauvegarde restaurée' });
    } catch (error) { next(error); }
});

// =============================================
// SEED, CACHE, EXPORT
// =============================================

router.post('/seed', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await seedService.runAllSeeds(undefined, false); // force = false par défaut
        res.json({ success: true, data: result, message: 'Seeds exécutés' });
    } catch (error) { next(error); }
});

router.post('/seed/force', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await seedService.runAllSeeds(undefined, true); // force = true
        res.json({ 
            success: true, 
            data: result, 
            message: 'Seeds forcés - toutes les valeurs par défaut restaurées' 
        });
    } catch (error) { next(error); }
});

router.post('/cache/invalidate', authMiddleware, canInvalidateCache, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;
        configurationService.invalidateCache(type);
        configurationListener.emitCacheInvalidated(type);
        res.json({ success: true, message: 'Cache invalidé' });
    } catch (error) { next(error); }
});

router.get('/export', authMiddleware, canExportConfig, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const options = validateDto(exportConfigSchema, {
            includeApp: req.query.includeApp !== 'false',
            includeModules: req.query.includeModules !== 'false',
            includeParametres: req.query.includeParametres !== 'false',
        });
        const exported = await configurationService.exportConfig(options);

        await historyService.logAction({
            utilisateurId: req.utilisateur?.id,
            action: ActionConfiguration.EXPORT,
            cible: CibleConfiguration.APP,
            description: 'Export de configuration',
            req,
        });

        res.json({ success: true, data: exported });
    } catch (error) { next(error); }
});

export const configurationController = router;
export default router;
