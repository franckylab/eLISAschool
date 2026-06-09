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
import { AppDataSource } from '@database/data-source';
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
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils';
import { MODULE_REGISTRY } from '@shared/config/config.registry';
import { ModuleName } from '@shared/enums/modules.enum';
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
// CONFIGURATION APPLICATION
// =============================================

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configurationService.getConfigApp();
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
        res.json({ success: true, data: publicConfig });
    } catch (error) { next(error); }
});

router.get('/full', authMiddleware, canViewConfigApp, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configurationService.getConfigApp();
        res.json({ success: true, data: config });
    } catch (error) { next(error); }
});

router.patch('/', authMiddleware, canEditConfigApp, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ancienneValeur = await configurationService.getConfigApp();
        const dto = validateDto(updateConfigAppSchema, req.body);
        const config = await configurationService.updateConfigApp(dto);

        await historyService.logAction({
            utilisateurId: req.utilisateur?.id,
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.APP,
            ancienneValeur,
            nouvelleValeur: config,
            req,
        });

        configurationListener.emitChange({
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.APP,
            ancienneValeur,
            nouvelleValeur: config,
            timestamp: new Date(),
            utilisateurId: req.utilisateur?.id,
        });

        res.json({ success: true, data: config, message: 'Configuration mise à jour' });
    } catch (error) { next(error); }
});

router.post('/licence', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/modules/:moduleNom/dependencies', authMiddleware, canViewConfigModule, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const moduleNom = req.params.moduleNom;
        const etablissementId = req.utilisateur?.etablissementId;
        
        const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
        if (!registryConfig) {
            throw new AppError(`Module "${moduleNom}" non trouvé dans le registre`, 404, 'MODULE_NOT_FOUND');
        }

        // Optimisation: Charger tous les modules actifs en UNE SEULE requête
        const modulesActifsData: Record<string, boolean> = {};
        
        if (etablissementId) {
            const configRepo = AppDataSource.getRepository('EtablissementConfig');
            const config = await configRepo.findOne({ where: { etablissementId } });
            if (config?.modulesActifs) {
                Object.assign(modulesActifsData, config.modulesActifs);
            }
        }
        
        // Fallback: ConfigurationApp
        if (Object.keys(modulesActifsData).length === 0) {
            const appConfig = await configurationService.getConfigApp();
            if (appConfig.modulesActifs) {
                Object.assign(modulesActifsData, appConfig.modulesActifs);
            }
        }

        // Dépendances (calcul en mémoire, pas de requêtes DB)
        const dependances = (registryConfig.dependencies || []).map((dep) => {
            const depConfig = MODULE_REGISTRY[dep];
            const actif = modulesActifsData[dep] ?? depConfig?.defaultActive ?? false;
            return {
                nom: dep,
                label: depConfig?.label || dep,
                actif,
                requis: true,
            };
        });

        // Reverse dépendances (calcul en mémoire)
        const reverseDependances = configurationService.getReverseDependencies(moduleNom).map((revDep) => {
            const revConfig = MODULE_REGISTRY[revDep];
            const actif = modulesActifsData[revDep] ?? revConfig?.defaultActive ?? false;
            return {
                nom: revDep,
                label: revConfig?.label || revDep,
                actif,
            };
        });

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
        const parametres = await configurationService.getParametres(query);
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

router.post('/parametres/reset-all', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/seed', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await seedService.runAllSeeds(false); // force = false par défaut
        res.json({ success: true, data: result, message: 'Seeds exécutés' });
    } catch (error) { next(error); }
});

router.post('/seed/force', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await seedService.runAllSeeds(true); // force = true
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
