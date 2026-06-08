/**
 * ==================================
 * eLISAschool - Service Configuration v5.0
 * ==================================
 * Version: 5.0.0
 * Auteur: xAI Éducation
 * 
 * Système de configuration hybride complet avec :
 * - Cache mémoire performant
 * - Intégration historique automatique
 * - Listener pour événements
 * - CRUD complet
 */

import { Repository, Like, In, IsNull } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { ConfigurationApp, ConfigurationModule } from '../entities';
import { ParametreSysteme, CategorieParametre, TypeValeurParametre } from '../entities/parametre-systeme.entity';
import { ActionConfiguration, CibleConfiguration } from '../entities/historique-configuration.entity';
import {
    UpdateConfigAppDto,
    UpdateConfigModuleDto,
    ActiverLicenceDto,
    CreateParametreDto,
    UpdateParametreDto,
    UpdateParametresBulkDto,
    QueryParametresDto,
    ExportConfigDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { MODULE_REGISTRY, ModuleConfig } from '@shared/config/config.registry';
import { ModuleName } from '@shared/enums/modules.enum';
import { configurationListener, ConfigChangeEvent } from './configuration-listener';
import { ConfigurationHistoryService, configurationHistoryService } from './configuration-history.service';

/**
 * Cache en mémoire pour les configurations
 */
interface ConfigCache {
    app: ConfigurationApp | null;
    modules: Map<string, ConfigurationModule>;
    parametres: Map<string, any>;
    modulesActifs: Map<string, { value: boolean; expiry: number }>;
    lastRefresh: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Service de gestion de la configuration hybride v5.0
 */
export class ConfigurationService {
    private configAppRepository: Repository<ConfigurationApp>;
    private configModuleRepository: Repository<ConfigurationModule>;
    private parametreRepository: Repository<ParametreSysteme>;
    private historyService: ConfigurationHistoryService;

    private cache: ConfigCache = {
        app: null,
        modules: new Map(),
        parametres: new Map(),
        modulesActifs: new Map(),
        lastRefresh: 0,
    };

    // Compteur d'erreurs DB pour monitoring
    private dbErrorCount = 0;
    private readonly MAX_DB_ERRORS = 5;

    constructor() {
        this.configAppRepository = AppDataSource.getRepository(ConfigurationApp);
        this.configModuleRepository = AppDataSource.getRepository(ConfigurationModule);
        this.parametreRepository = AppDataSource.getRepository(ParametreSysteme);
        this.historyService = configurationHistoryService;
    }

    // ============================================
    // CACHE
    // ============================================

    invalidateCache(type?: 'app' | 'modules' | 'parametres'): void {
        if (!type || type === 'app') this.cache.app = null;
        if (!type || type === 'modules') this.cache.modules.clear();
        if (!type || type === 'parametres') this.cache.parametres.clear();
        this.cache.lastRefresh = 0;
        configurationListener.emitCacheInvalidated(type);
        logger.debug('Cache de configuration invalidé');
    }

    private isCacheValid(): boolean {
        return Date.now() - this.cache.lastRefresh < CACHE_TTL;
    }

    // ============================================
    // CONFIGURATION APPLICATION
    // ============================================

    async getConfigApp(): Promise<ConfigurationApp> {
        if (this.cache.app && this.isCacheValid()) {
            return this.cache.app;
        }

        let config = await this.configAppRepository.findOne({ where: {} });

        if (!config) {
            config = this.configAppRepository.create({
                nomEtablissement: 'Mon Établissement',
                langueDefaut: 'fr',
                devise: 'XOF',
                fuseauHoraire: 'Africa/Douala',
                couleurPrimaire: '#28a745',
                couleurSecondaire: '#ffc107',
                couleurAccent: '#007bff',
                theme: 'default',
                modulesActifs: this.getDefaultActiveModules(),
                version: '1.0.0',
            });
            await this.configAppRepository.save(config);
        }

        this.cache.app = config;
        this.cache.lastRefresh = Date.now();
        return config;
    }

    async updateConfigApp(updateDto: UpdateConfigAppDto, utilisateurId?: string, req?: Request): Promise<ConfigurationApp> {
        const config = await this.getConfigApp();
        const ancienneValeur = { ...config };

        Object.assign(config, updateDto);
        await this.configAppRepository.save(config);
        this.invalidateCache('app');

        // Historique
        await this.historyService.logAction({
            utilisateurId,
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.APP,
            ancienneValeur,
            nouvelleValeur: config,
            restaurable: true,
            req,
        });

        // Événement
        this.emitChange(ActionConfiguration.UPDATE, CibleConfiguration.APP, undefined, undefined, ancienneValeur, config, utilisateurId);

        logger.info('Configuration application mise à jour');
        return config;
    }

    private getDefaultActiveModules(): Record<string, boolean> {
        const modules: Record<string, boolean> = {};
        Object.values(MODULE_REGISTRY).forEach((m: ModuleConfig) => {
            modules[m.name] = m.defaultActive;
        });
        return modules;
    }

    // ============================================
    // CONFIGURATION MODULES
    // ============================================

    async getConfigModule(moduleNom: string, etablissementId?: string): Promise<ConfigurationModule> {
        const cacheKey = `${moduleNom}:${etablissementId || 'global'}`;

        if (this.cache.modules.has(cacheKey) && this.isCacheValid()) {
            return this.cache.modules.get(cacheKey)!;
        }

        let config = await this.configModuleRepository.findOne({
            where: { moduleNom, etablissementId: etablissementId || undefined },
        });

        if (!config) {
            const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
            config = this.configModuleRepository.create({
                moduleNom,
                etablissementId,
                champsPersonnalises: [],
                widgets: [],
                parametres: registryConfig?.defaultSettings || {},
                actif: registryConfig?.defaultActive ?? true,
            });
            await this.configModuleRepository.save(config);
        }

        this.cache.modules.set(cacheKey, config);
        return config;
    }

    async updateConfigModule(
        moduleNom: string,
        updateDto: UpdateConfigModuleDto,
        etablissementId?: string,
        utilisateurId?: string,
        req?: Request
    ): Promise<ConfigurationModule> {
        const config = await this.getConfigModule(moduleNom, etablissementId);
        const ancienneValeur = { ...config };

        if (updateDto.champsPersonnalises !== undefined) config.champsPersonnalises = updateDto.champsPersonnalises;
        if (updateDto.widgets !== undefined) config.widgets = updateDto.widgets;
        if (updateDto.parametres !== undefined) config.parametres = { ...config.parametres, ...updateDto.parametres };
        if (updateDto.actif !== undefined) config.actif = updateDto.actif;

        await this.configModuleRepository.save(config);
        this.invalidateCache('modules');

        await this.historyService.logAction({
            utilisateurId,
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.MODULE,
            cibleNom: moduleNom,
            ancienneValeur,
            nouvelleValeur: config,
            restaurable: true,
            req,
        });

        this.emitChange(ActionConfiguration.UPDATE, CibleConfiguration.MODULE, config.id, moduleNom, ancienneValeur, config, utilisateurId);

        logger.info(`Configuration du module ${moduleNom} mise à jour`);
        return config;
    }

    async toggleModule(
        moduleNom: string,
        actif: boolean,
        etablissementId?: string,
        utilisateurId?: string,
        req?: Request
    ): Promise<{ success: boolean; message: string; modulesAutoActive?: string[] }> {
        // Validation: module existe dans le registre
        const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
        if (!registryConfig) {
            throw new AppError(
                `Module "${moduleNom}" non reconnu. Modules valides: ${Object.keys(MODULE_REGISTRY).join(', ')}`,
                400,
                'INVALID_MODULE'
            );
        }

        const modulesAutoActivés: string[] = [];

        // 1. Vérifier les dépendances (avec détection de cycles)
        const verification = await this.verifierDependances(moduleNom, actif, etablissementId, new Set());
        if (!verification.valide) {
            throw new AppError(
                `Impossible ${actif ? "d'activer" : 'de désactiver'} le module: ${verification.erreurs.join(', ')}`,
                400,
                actif ? 'DEPENDENCIES_NOT_MET' : 'DEPENDENT_MODULES_ACTIVE'
            );
        }
        modulesAutoActivés.push(...verification.modulesAutoActivés);

        // 2. Récupérer l'ancien état
        const ancienEtat = await this.isModuleActive(moduleNom, etablissementId);

        // 3. Écrire dans EtablissementConfig (priorité) ou ConfigurationApp (fallback)
        if (etablissementId) {
            await this.toggleModuleEtablissement(moduleNom, actif, etablissementId);
        } else {
            await this.toggleModuleApp(moduleNom, actif);
        }

        // 4. Synchroniser ConfigurationModule.actif
        await this.syncConfigurationModule(moduleNom, actif, etablissementId);

        // 5. Historique
        await this.historyService.logAction({
            utilisateurId,
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.MODULE,
            cibleNom: moduleNom,
            description: `Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}`,
            ancienneValeur: { actif: ancienEtat },
            nouvelleValeur: { actif },
            req,
        });

        // 6. Invalidation granulaire du cache
        this.invalidateModuleCache(moduleNom, etablissementId);
        modulesAutoActivés.forEach(dep => this.invalidateModuleCache(dep, etablissementId));

        // 7. Événement
        this.emitChange(
            ActionConfiguration.UPDATE,
            CibleConfiguration.MODULE,
            undefined,
            moduleNom,
            { actif: ancienEtat },
            { actif },
            utilisateurId
        );

        logger.info(`Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}${etablissementId ? ` (établissement: ${etablissementId})` : ''}`);

        return {
            success: true,
            message: `Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}`,
            modulesAutoActive: modulesAutoActivés.length > 0 ? modulesAutoActivés : undefined,
        };
    }

    private async toggleModuleEtablissement(moduleNom: string, actif: boolean, etablissementId: string): Promise<void> {
        const configRepo = AppDataSource.getRepository('EtablissementConfig');
        let config = await configRepo.findOne({ where: { etablissementId } });
        
        if (!config) {
            config = configRepo.create({ etablissementId, modulesActifs: {} });
        }

        if (!config.modulesActifs) {
            config.modulesActifs = {};
        }

        config.modulesActifs[moduleNom] = actif;
        await configRepo.save(config);
    }

    private async toggleModuleApp(moduleNom: string, actif: boolean): Promise<void> {
        const config = await this.getConfigApp();
        config.modulesActifs[moduleNom] = actif;
        await this.configAppRepository.save(config);
    }

    private async syncConfigurationModule(moduleNom: string, actif: boolean, etablissementId?: string): Promise<void> {
        let config = await this.configModuleRepository.findOne({
            where: { moduleNom, etablissementId: etablissementId || undefined }
        });

        if (!config) {
            const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
            config = this.configModuleRepository.create({
                moduleNom,
                etablissementId,
                actif,
                parametres: registryConfig?.defaultSettings || {},
            });
        } else {
            config.actif = actif;
        }

        await this.configModuleRepository.save(config);
    }

    async getAllModulesConfig(etablissementId?: string): Promise<ConfigurationModule[]> {
        return this.configModuleRepository.find({
            where: { etablissementId: etablissementId || undefined },
        });
    }

    // ============================================
    // GESTION DES DÉPENDANCES
    // ============================================

    private async verifierDependances(
        moduleNom: string,
        actif: boolean,
        etablissementId?: string,
        visited: Set<string> = new Set()
    ): Promise<{ valide: boolean; erreurs: string[]; modulesAutoActivés: string[] }> {
        // Détection de dépendances circulaires
        if (visited.has(moduleNom)) {
            return { 
                valide: false, 
                erreurs: [`Dépendance circulaire détectée: ${moduleNom}`], 
                modulesAutoActivés: [] 
            };
        }
        visited.add(moduleNom);

        const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
        if (!registryConfig || !registryConfig.dependencies || registryConfig.dependencies.length === 0) {
            return { valide: true, erreurs: [], modulesAutoActivés: [] };
        }

        const erreurs: string[] = [];
        const modulesAutoActivés: string[] = [];

        if (actif) {
            // Activation: vérifier que toutes les dépendances sont actives
            for (const dep of registryConfig.dependencies) {
                const estActive = await this.isModuleActive(dep, etablissementId);
                if (!estActive) {
                    // Auto-activation de la dépendance
                    try {
                        if (etablissementId) {
                            await this.toggleModuleEtablissement(dep, true, etablissementId);
                        } else {
                            await this.toggleModuleApp(dep, true);
                        }
                        await this.syncConfigurationModule(dep, true, etablissementId);
                        modulesAutoActivés.push(dep);
                    } catch (error) {
                        const depConfig = MODULE_REGISTRY[dep];
                        erreurs.push(`Dépendance requise: ${depConfig?.label || dep} (auto-activation échouée)`);
                    }
                }
            }
        } else {
            // Désactivation: vérifier les reverse dependencies
            const reverseDeps = this.getReverseDependencies(moduleNom);
            const reverseDepsActives: string[] = [];

            for (const revDep of reverseDeps) {
                const estActive = await this.isModuleActive(revDep, etablissementId);
                if (estActive) {
                    const revConfig = MODULE_REGISTRY[revDep];
                    reverseDepsActives.push(revConfig?.label || revDep);
                }
            }

            if (reverseDepsActives.length > 0) {
                erreurs.push(
                    `Modules dépendants actifs: ${reverseDepsActives.join(', ')}. Désactivez-les d'abord`
                );
            }
        }

        return {
            valide: erreurs.length === 0,
            erreurs,
            modulesAutoActivés,
        };
    }

    /**
     * Vérifie si un module peut être activé (endpoint public)
     */
    public async verifierActivationModule(moduleNom: string, etablissementId?: string) {
        return this.verifierDependances(moduleNom, true, etablissementId, new Set());
    }

    getReverseDependencies(moduleNom: string): ModuleName[] {
        const reverseDeps: ModuleName[] = [];
        
        for (const [name, config] of Object.entries(MODULE_REGISTRY)) {
            if (config.dependencies && config.dependencies.includes(moduleNom as ModuleName)) {
                reverseDeps.push(name as ModuleName);
            }
        }

        return reverseDeps;
    }

    async isModuleActive(moduleNom: string, etablissementId?: string): Promise<boolean> {
        const startTime = Date.now();
        const cacheKey = `${moduleNom}:${etablissementId || 'global'}`;
        
        // Check cache (TTL 30s)
        const cached = this.cache.modulesActifs.get(cacheKey);
        if (cached && Date.now() < cached.expiry) {
            return cached.value;
        }

        let result = false;

        // 1. Priorité: EtablissementConfig (multi-tenant)
        if (etablissementId) {
            try {
                const configRepo = AppDataSource.getRepository('EtablissementConfig');
                const config = await configRepo.findOne({ where: { etablissementId } });
                if (config?.modulesActifs && moduleNom in config.modulesActifs) {
                    result = config.modulesActifs[moduleNom];
                    this.dbErrorCount = 0; // Reset compteur
                }
            } catch (error) {
                this.dbErrorCount++;
                logger.warn(`Erreur lecture EtablissementConfig (${this.dbErrorCount}/${this.MAX_DB_ERRORS}): ${error}`);
                if (this.dbErrorCount >= this.MAX_DB_ERRORS) {
                    logger.error(`⚠️ Trop d'erreurs DB consecutives (${this.dbErrorCount}). Vérifier la connection!`);
                }
            }
        }

        // 2. Fallback: ConfigurationApp (legacy)
        if (!result || !etablissementId) {
            try {
                const appConfig = await this.getConfigApp();
                if (appConfig.modulesActifs && moduleNom in appConfig.modulesActifs) {
                    result = appConfig.modulesActifs[moduleNom];
                    this.dbErrorCount = 0;
                }
            } catch (error) {
                this.dbErrorCount++;
                logger.warn(`Erreur lecture ConfigurationApp (${this.dbErrorCount}/${this.MAX_DB_ERRORS}): ${error}`);
            }
        }

        // 3. Fallback: ConfigurationModule.actif
        if (!result) {
            try {
                const moduleConfig = await this.configModuleRepository.findOne({
                    where: { moduleNom, etablissementId: etablissementId || undefined }
                });
                if (moduleConfig) {
                    result = moduleConfig.actif;
                    this.dbErrorCount = 0;
                }
            } catch (error) {
                this.dbErrorCount++;
                logger.warn(`Erreur lecture ConfigurationModule (${this.dbErrorCount}/${this.MAX_DB_ERRORS}): ${error}`);
            }
        }

        // 4. Fallback: MODULE_REGISTRY defaultActive
        if (!result) {
            const registryConfig = MODULE_REGISTRY[moduleNom as ModuleName];
            result = registryConfig?.defaultActive ?? false;
        }

        // Cache le résultat (TTL 30s)
        this.cache.modulesActifs.set(cacheKey, {
            value: result,
            expiry: Date.now() + 30 * 1000
        });

        // Métriques de performance
        const duration = Date.now() - startTime;
        if (duration > 50) {
            logger.warn(`⚠️ isModuleActive(${moduleNom}) took ${duration}ms`);
        }

        return result;
    }

    /**
     * Invalidation granulaire du cache des modules actifs
     */
    private invalidateModuleCache(moduleNom: string, etablissementId?: string): void {
        const cacheKey = `${moduleNom}:${etablissementId || 'global'}`;
        this.cache.modulesActifs.delete(cacheKey);
        this.cache.modules.delete(cacheKey);
    }

    // ============================================
    // PARAMÈTRES SYSTÈME - CRUD COMPLET
    // ============================================

    async createParametre(dto: CreateParametreDto, utilisateurId?: string, req?: Request): Promise<ParametreSysteme> {
        // Vérifier l'unicité avec le scopage par établissement
        const whereCondition: any = { cle: dto.cle };
        if (dto.etablissementId) {
            whereCondition.etablissementId = dto.etablissementId;
        } else {
            whereCondition.etablissementId = IsNull();
        }
        const existing = await this.parametreRepository.findOne({ 
            where: whereCondition
        });
        if (existing) {
            throw new AppError(
                `Le paramètre "${dto.cle}" existe déjà${dto.etablissementId ? ' pour cet établissement' : ' (global)'}`,
                409, 
                'PARAM_EXISTS'
            );
        }

        const param = this.parametreRepository.create({
            cle: dto.cle,
            valeur: JSON.stringify(dto.valeur),
            typeValeur: dto.typeValeur || this.detectTypeValeur(dto.valeur),
            categorie: dto.categorie,
            module: dto.module,
            description: dto.description,
            etablissementId: dto.etablissementId || undefined,
            valeurDefaut: JSON.stringify(dto.valeur),
            modifiableRuntime: dto.modifiableRuntime,
            visible: dto.visible,
            ordre: dto.ordre,
            validation: dto.validation,
            options: dto.options,
        });

        await this.parametreRepository.save(param);
        this.invalidateCache('parametres');

        await this.historyService.logAction({
            utilisateurId,
            action: ActionConfiguration.CREATE,
            cible: CibleConfiguration.PARAMETRE,
            cibleId: param.id,
            cibleNom: dto.cle,
            nouvelleValeur: dto.valeur,
            req,
        });

        this.emitChange(ActionConfiguration.CREATE, CibleConfiguration.PARAMETRE, param.id, dto.cle, undefined, dto.valeur, utilisateurId);

        logger.info(`Paramètre créé: ${dto.cle}`);
        return param;
    }

    async getParametreByKey(cle: string): Promise<ParametreSysteme | null> {
        return this.parametreRepository.findOne({ where: { cle } });
    }

    /**
     * Récupère un paramètre avec logique de fallback multi-établissement
     * 
     * Ordre de résolution :
     * 1. Paramètre scopé à l'établissement (si etablissementId fourni)
     * 2. Paramètre global (etablissementId = NULL)
     * 3. Valeur par défaut (si fournie)
     * 
     * @param cle Clé du paramètre
     * @param etablissementId ID de l'établissement (optionnel)
     * @returns Valeur du paramètre ou null
     */
    async getParametre<T = any>(cle: string, etablissementId?: string): Promise<T | null> {
        const cacheKey = etablissementId ? `${cle}:${etablissementId}` : cle;
        
        if (this.cache.parametres.has(cacheKey) && this.isCacheValid()) {
            return this.cache.parametres.get(cacheKey) as T;
        }

        // 1. Chercher d'abord le paramètre scopé à l'établissement
        if (etablissementId) {
            const paramScope = await this.parametreRepository.findOne({
                where: { cle, etablissementId }
            });
            if (paramScope) {
                const value = this.parseParametreValue(paramScope);
                this.cache.parametres.set(cacheKey, value);
                return value as T;
            }
        }

        // 2. Fallback vers le paramètre global
        const paramGlobal = await this.parametreRepository.findOne({
            where: { cle, etablissementId: IsNull() }
        });
        
        if (!paramGlobal) return null;

        const value = this.parseParametreValue(paramGlobal);
        this.cache.parametres.set(cacheKey, value);
        return value as T;
    }

    async updateParametre(cle: string, dto: UpdateParametreDto, utilisateurId?: string, req?: Request): Promise<ParametreSysteme> {
        const param = await this.parametreRepository.findOne({ where: { cle } });
        if (!param) {
            throw new AppError(`Paramètre "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
        }

        if (!param.modifiableRuntime && dto.valeur !== undefined) {
            throw new AppError('Ce paramètre ne peut pas être modifié en runtime', 400, 'PARAM_NOT_MODIFIABLE');
        }

        // Validation de la valeur avant sauvegarde
        if (dto.valeur !== undefined) {
            this.validateParametreValue(param, dto.valeur);
        }

        const ancienneValeur = param.valeur;

        if (dto.valeur !== undefined) param.valeur = JSON.stringify(dto.valeur);
        if (dto.description !== undefined) param.description = dto.description;
        if (dto.visible !== undefined) param.visible = dto.visible;
        if (dto.ordre !== undefined) param.ordre = dto.ordre;
        if (dto.options !== undefined) param.options = dto.options;

        await this.parametreRepository.save(param);
        this.invalidateCache('parametres');

        await this.historyService.logAction({
            utilisateurId,
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.PARAMETRE,
            cibleId: param.id,
            cibleNom: cle,
            ancienneValeur,
            nouvelleValeur: param.valeur,
            restaurable: true,
            req,
        });

        this.emitChange(ActionConfiguration.UPDATE, CibleConfiguration.PARAMETRE, param.id, cle, ancienneValeur, param.valeur, utilisateurId);

        logger.info(`Paramètre mis à jour: ${cle}`);
        return param;
    }

    /**
     * Définit ou met à jour un paramètre avec support multi-établissement
     * 
     * Si etablissementId est fourni:
     * - Crée un override pour cet établissement
     * - Si le paramètre global n'existe pas, le crée d'abord
     * 
     * Si etablissementId n'est pas fourni:
     * - Modifie le paramètre global
     */
    async setParametre(
        cle: string, 
        valeur: any, 
        etablissementId?: string,
        utilisateurId?: string, 
        req?: Request
    ): Promise<ParametreSysteme> {
        let param: ParametreSysteme | null = null;
        let ancienneValeur: string | undefined;

        if (etablissementId) {
            // Chercher l'override pour cet établissement
            param = await this.parametreRepository.findOne({
                where: { cle, etablissementId }
            });

            if (!param) {
                // L'override n'existe pas, on va le créer
                // Mais d'abord, vérifier que le paramètre global existe
                const paramGlobal = await this.parametreRepository.findOne({
                    where: { cle, etablissementId: IsNull() }
                });

                if (!paramGlobal) {
                    // Le paramètre global n'existe pas, on le crée
                    const typeValeur = this.detectTypeValeur(valeur);
                    param = this.parametreRepository.create({
                        cle,
                        valeur: JSON.stringify(valeur),
                        typeValeur,
                        categorie: CategorieParametre.CUSTOM,
                        modifiableRuntime: true,
                        etablissementId: undefined, // Global d'abord
                    });
                    await this.parametreRepository.save(param);
                    ancienneValeur = undefined;
                    
                    // Maintenant créer l'override
                    param = this.parametreRepository.create({
                        cle,
                        valeur: JSON.stringify(valeur),
                        typeValeur,
                        categorie: CategorieParametre.CUSTOM,
                        modifiableRuntime: true,
                        etablissementId,
                    });
                } else {
                    // Le paramètre global existe, créer l'override
                    if (!paramGlobal.modifiableRuntime) {
                        throw new AppError('Ce paramètre ne peut pas être modifié en runtime', 400, 'PARAM_NOT_MODIFIABLE');
                    }
                    
                    param = this.parametreRepository.create({
                        cle,
                        valeur: JSON.stringify(valeur),
                        typeValeur: paramGlobal.typeValeur,
                        categorie: paramGlobal.categorie,
                        module: paramGlobal.module,
                        description: paramGlobal.description,
                        modifiableRuntime: true,
                        visible: paramGlobal.visible,
                        ordre: paramGlobal.ordre,
                        validation: paramGlobal.validation,
                        options: paramGlobal.options,
                        etablissementId,
                    });
                }
            } else {
                // L'override existe, le mettre à jour
                if (!param.modifiableRuntime) {
                    throw new AppError('Ce paramètre ne peut pas être modifié en runtime', 400, 'PARAM_NOT_MODIFIABLE');
                }
                
                this.validateParametreValue(param, valeur);
                ancienneValeur = param.valeur;
                param.valeur = JSON.stringify(valeur);
            }
        } else {
            // Modification du paramètre global
            param = await this.parametreRepository.findOne({
                where: { cle, etablissementId: IsNull() }
            });
            ancienneValeur = param?.valeur;

            if (!param) {
                const typeValeur = this.detectTypeValeur(valeur);
                param = this.parametreRepository.create({
                    cle,
                    valeur: JSON.stringify(valeur),
                    typeValeur,
                    categorie: CategorieParametre.CUSTOM,
                    modifiableRuntime: true,
                    etablissementId: undefined,
                });
            } else {
                if (!param.modifiableRuntime) {
                    throw new AppError('Ce paramètre ne peut pas être modifié en runtime', 400, 'PARAM_NOT_MODIFIABLE');
                }
                this.validateParametreValue(param, valeur);
                param.valeur = JSON.stringify(valeur);
            }
        }

        await this.parametreRepository.save(param);
        this.invalidateCache('parametres');

        await this.historyService.logAction({
            utilisateurId,
            action: ancienneValeur ? ActionConfiguration.UPDATE : ActionConfiguration.CREATE,
            cible: CibleConfiguration.PARAMETRE,
            cibleId: param.id,
            cibleNom: etablissementId ? `${cle} [${etablissementId}]` : cle,
            ancienneValeur,
            nouvelleValeur: valeur,
            restaurable: true,
            req,
        });

        this.emitChange(
            ancienneValeur ? ActionConfiguration.UPDATE : ActionConfiguration.CREATE,
            CibleConfiguration.PARAMETRE,
            param.id,
            etablissementId ? `${cle} [${etablissementId}]` : cle,
            ancienneValeur,
            valeur,
            utilisateurId
        );

        logger.info(`Paramètre défini: ${cle}${etablissementId ? ` [${etablissementId}]` : ''} = ${valeur}`);
        return param;
    }

    /**
     * Réinitialise un paramètre :
     * - Si etablissementId fourni : supprime l'override (retour au global)
     * - Sinon : réinitialise vers la valeur par défaut
     */
    async resetParametre(
        cle: string,
        etablissementId?: string,
        utilisateurId?: string,
        req?: Request
    ): Promise<void> {
        if (etablissementId) {
            // Supprimer l'override pour cet établissement
            const paramOverride = await this.parametreRepository.findOne({
                where: { cle, etablissementId }
            });

            if (!paramOverride) {
                throw new AppError(
                    `Aucun override trouvé pour le paramètre "${cle}" dans cet établissement`,
                    404,
                    'OVERRIDE_NOT_FOUND'
                );
            }

            const ancienneValeur = paramOverride.valeur;
            await this.parametreRepository.remove(paramOverride);
            this.invalidateCache('parametres');

            await this.historyService.logAction({
                utilisateurId,
                action: ActionConfiguration.DELETE,
                cible: CibleConfiguration.PARAMETRE,
                cibleNom: `${cle} [${etablissementId}] (override)` ,
                ancienneValeur,
                req,
            });

            logger.info(`Override supprimé pour ${cle} [${etablissementId}] - retour au global`);
        } else {
            // Réinitialiser le paramètre global vers sa valeur par défaut
            const param = await this.parametreRepository.findOne({
                where: { cle, etablissementId: IsNull() }
            });

            if (!param) {
                throw new AppError(`Paramètre "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
            }

            if (!param.valeurDefaut) {
                throw new AppError(
                    `Aucune valeur par défaut définie pour le paramètre "${cle}"`,
                    400,
                    'NO_DEFAULT_VALUE'
                );
            }

            const ancienneValeur = param.valeur;
            param.valeur = param.valeurDefaut;
            await this.parametreRepository.save(param);
            this.invalidateCache('parametres');

            await this.historyService.logAction({
                utilisateurId,
                action: ActionConfiguration.UPDATE,
                cible: CibleConfiguration.PARAMETRE,
                cibleId: param.id,
                cibleNom: cle,
                ancienneValeur,
                nouvelleValeur: param.valeur,
                restaurable: true,
                req,
            });

            logger.info(`Paramètre réinitialisé vers valeur par défaut: ${cle}`);
        }
    }

    async updateParametresBulk(dto: UpdateParametresBulkDto, utilisateurId?: string, req?: Request): Promise<number> {
        let updated = 0;
        for (const { cle, valeur, etablissementId } of dto.parametres) {
            try {
                await this.setParametre(cle, valeur, etablissementId, utilisateurId, req);
                updated++;
            } catch (e) {
                logger.warn(`Échec mise à jour paramètre ${cle}: ${e}`);
            }
        }
        return updated;
    }

    async deleteParametre(cle: string, utilisateurId?: string, req?: Request): Promise<void> {
        const param = await this.parametreRepository.findOne({ where: { cle } });
        if (!param) {
            throw new AppError(`Paramètre "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
        }

        const ancienneValeur = param.valeur;
        await this.parametreRepository.remove(param);
        this.invalidateCache('parametres');

        await this.historyService.logAction({
            utilisateurId,
            action: ActionConfiguration.DELETE,
            cible: CibleConfiguration.PARAMETRE,
            cibleNom: cle,
            ancienneValeur,
            req,
        });

        this.emitChange(ActionConfiguration.DELETE, CibleConfiguration.PARAMETRE, undefined, cle, ancienneValeur, undefined, utilisateurId);

        logger.info(`Paramètre supprimé: ${cle}`);
    }

    async getParametres(query: QueryParametresDto, etablissementId?: string): Promise<ParametreSysteme[]> {
        const qb = this.parametreRepository.createQueryBuilder('p');

        // Filtrer par établissement : paramètres globaux (NULL) + paramètres scopés
        if (etablissementId) {
            qb.where('(p.etablissement_id IS NULL OR p.etablissement_id = :etablissementId)', { etablissementId });
        } else {
            qb.where('p.etablissement_id IS NULL');
        }

        if (query.categorie) qb.andWhere('p.categorie = :categorie', { categorie: query.categorie });
        if (query.module) qb.andWhere('p.module = :module', { module: query.module });
        if (query.modifiableRuntime !== undefined) qb.andWhere('p.modifiableRuntime = :mr', { mr: query.modifiableRuntime });
        if (query.visible !== undefined) qb.andWhere('p.visible = :visible', { visible: query.visible });
        if (query.search) qb.andWhere('(p.cle LIKE :search OR p.description LIKE :search)', { search: `%${query.search}%` });

        return qb.orderBy('p.ordre', 'ASC').addOrderBy('p.cle', 'ASC').getMany();
    }

    async getParametresByCategorie(categorie: CategorieParametre): Promise<ParametreSysteme[]> {
        return this.parametreRepository.find({
            where: { categorie, visible: true },
            order: { ordre: 'ASC', cle: 'ASC' },
        });
    }

    async getParametresByModule(module: string): Promise<ParametreSysteme[]> {
        return this.parametreRepository.find({
            where: { module, visible: true },
            order: { ordre: 'ASC', cle: 'ASC' },
        });
    }

    async getAllParametres(): Promise<ParametreSysteme[]> {
        return this.parametreRepository.find({ order: { categorie: 'ASC', ordre: 'ASC', cle: 'ASC' } });
    }

    // ============================================
    // EXPORT
    // ============================================

    async exportConfig(options: ExportConfigDto): Promise<any> {
        const exported: any = { exportedAt: new Date().toISOString(), version: '1.0.0' };

        if (options.includeApp) {
            exported.app = await this.getConfigApp();
        }

        if (options.includeModules) {
            exported.modules = await this.configModuleRepository.find();
        }

        if (options.includeParametres) {
            exported.parametres = await this.parametreRepository.find();
        }

        return exported;
    }

    // ============================================
    // LICENCE
    // ============================================

    async activerLicence(dto: ActiverLicenceDto): Promise<{ success: boolean; message: string }> {
        const config = await this.getConfigApp();

        if (dto.licenceKey.length < 10) {
            throw new AppError('Clé de licence invalide', 400, 'INVALID_LICENSE');
        }

        config.licenceKey = dto.licenceKey;
        config.licenceActive = true;
        config.licenceExpiration = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        await this.configAppRepository.save(config);
        this.invalidateCache('app');

        logger.info('Licence activée avec succès');
        return { success: true, message: 'Licence activée avec succès' };
    }

    // ============================================
    // HELPERS
    // ============================================

    private emitChange(
        action: ActionConfiguration,
        cible: CibleConfiguration,
        cibleId?: string,
        cibleNom?: string,
        ancienneValeur?: any,
        nouvelleValeur?: any,
        utilisateurId?: string
    ): void {
        const event: ConfigChangeEvent = {
            action,
            cible,
            cibleId,
            cibleNom,
            ancienneValeur,
            nouvelleValeur,
            timestamp: new Date(),
            utilisateurId,
        };
        configurationListener.emitChange(event);
    }

    private parseParametreValue(param: ParametreSysteme): any {
        try {
            switch (param.typeValeur) {
                case TypeValeurParametre.NUMBER:
                    return Number(JSON.parse(param.valeur));
                case TypeValeurParametre.BOOLEAN:
                    const parsed = JSON.parse(param.valeur);
                    return parsed === true || parsed === 'true';
                case TypeValeurParametre.JSON:
                case TypeValeurParametre.ARRAY:
                    return JSON.parse(param.valeur);
                default:
                    return JSON.parse(param.valeur);
            }
        } catch {
            return param.valeur;
        }
    }

    private detectTypeValeur(valeur: any): TypeValeurParametre {
        if (typeof valeur === 'boolean') return TypeValeurParametre.BOOLEAN;
        if (typeof valeur === 'number') return TypeValeurParametre.NUMBER;
        if (Array.isArray(valeur)) return TypeValeurParametre.ARRAY;
        if (typeof valeur === 'object') return TypeValeurParametre.JSON;
        return TypeValeurParametre.STRING;
    }

    /**
     * Valide la valeur d'un paramètre selon sa configuration
     */
    private validateParametreValue(param: ParametreSysteme, valeur: any): void {
        // Validation par regex si définie
        if (param.validation) {
            try {
                const regex = new RegExp(param.validation);
                const valeurStr = String(valeur);
                if (!regex.test(valeurStr)) {
                    throw new AppError(
                        `La valeur ne respecte pas le format requis pour le paramètre "${param.cle}"`,
                        400,
                        'INVALID_PARAM_VALUE'
                    );
                }
            } catch (e) {
                if (e instanceof AppError) throw e;
                throw new AppError(
                    `Regex de validation invalide pour le paramètre "${param.cle}"`,
                    500,
                    'INVALID_VALIDATION_REGEX'
                );
            }
        }

        // Validation des ranges pour les nombres
        if (param.typeValeur === TypeValeurParametre.NUMBER) {
            const numValue = typeof valeur === 'string' ? parseFloat(valeur) : valeur;
            
            if (isNaN(numValue)) {
                throw new AppError(
                    `La valeur doit être un nombre valide pour le paramètre "${param.cle}"`,
                    400,
                    'INVALID_NUMBER_VALUE'
                );
            }

            // Validation min/max basée sur les options si disponibles
            if (param.options && param.options.length >= 2) {
                const min = parseFloat(param.options[0]?.value);
                const max = parseFloat(param.options[param.options.length - 1]?.value);
                
                if (!isNaN(min) && !isNaN(max) && (numValue < min || numValue > max)) {
                    throw new AppError(
                        `La valeur doit être comprise entre ${min} et ${max} pour le paramètre "${param.cle}"`,
                        400,
                        'VALUE_OUT_OF_RANGE'
                    );
                }
            }
        }

        // Validation des enums
        if (param.options && param.options.length > 0 && param.typeValeur === TypeValeurParametre.STRING) {
            const validValues = param.options.map(opt => opt.value);
            if (!validValues.includes(String(valeur))) {
                throw new AppError(
                    `La valeur doit être l'une des suivantes : ${validValues.join(', ')} pour le paramètre "${param.cle}"`,
                    400,
                    'INVALID_ENUM_VALUE'
                );
            }
        }
    }
}

export const configurationService = new ConfigurationService();
export default ConfigurationService;
