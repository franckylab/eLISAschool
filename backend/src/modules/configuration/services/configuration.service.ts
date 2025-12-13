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

import { Repository, Like, In } from 'typeorm';
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
        lastRefresh: 0,
    };

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

    async toggleModule(moduleNom: string, actif: boolean, utilisateurId?: string, req?: Request): Promise<ConfigurationApp> {
        const config = await this.getConfigApp();
        const ancienEtat = config.modulesActifs[moduleNom];

        config.modulesActifs[moduleNom] = actif;
        await this.configAppRepository.save(config);
        this.invalidateCache('app');

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

        this.emitChange(ActionConfiguration.UPDATE, CibleConfiguration.MODULE, undefined, moduleNom, { actif: ancienEtat }, { actif }, utilisateurId);

        logger.info(`Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}`);
        return config;
    }

    async getAllModulesConfig(etablissementId?: string): Promise<ConfigurationModule[]> {
        return this.configModuleRepository.find({
            where: { etablissementId: etablissementId || undefined },
        });
    }

    async isModuleActive(moduleNom: string): Promise<boolean> {
        const config = await this.getConfigApp();
        return config.modulesActifs[moduleNom] ?? false;
    }

    // ============================================
    // PARAMÈTRES SYSTÈME - CRUD COMPLET
    // ============================================

    async createParametre(dto: CreateParametreDto, utilisateurId?: string, req?: Request): Promise<ParametreSysteme> {
        const existing = await this.parametreRepository.findOne({ where: { cle: dto.cle } });
        if (existing) {
            throw new AppError(`Le paramètre "${dto.cle}" existe déjà`, 409, 'PARAM_EXISTS');
        }

        const param = this.parametreRepository.create({
            cle: dto.cle,
            valeur: JSON.stringify(dto.valeur),
            typeValeur: dto.typeValeur || this.detectTypeValeur(dto.valeur),
            categorie: dto.categorie,
            module: dto.module,
            description: dto.description,
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

    async getParametre<T = any>(cle: string): Promise<T | null> {
        if (this.cache.parametres.has(cle) && this.isCacheValid()) {
            return this.cache.parametres.get(cle) as T;
        }

        const param = await this.parametreRepository.findOne({ where: { cle } });
        if (!param) return null;

        const value = this.parseParametreValue(param);
        this.cache.parametres.set(cle, value);
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

    async setParametre(cle: string, valeur: any, utilisateurId?: string, req?: Request): Promise<ParametreSysteme> {
        let param = await this.parametreRepository.findOne({ where: { cle } });
        const ancienneValeur = param?.valeur;

        if (!param) {
            param = this.parametreRepository.create({
                cle,
                valeur: JSON.stringify(valeur),
                typeValeur: this.detectTypeValeur(valeur),
                categorie: CategorieParametre.CUSTOM,
                modifiableRuntime: true,
            });
        } else {
            if (!param.modifiableRuntime) {
                throw new AppError('Ce paramètre ne peut pas être modifié en runtime', 400, 'PARAM_NOT_MODIFIABLE');
            }
            param.valeur = JSON.stringify(valeur);
        }

        await this.parametreRepository.save(param);
        this.invalidateCache('parametres');

        await this.historyService.logAction({
            utilisateurId,
            action: ancienneValeur ? ActionConfiguration.UPDATE : ActionConfiguration.CREATE,
            cible: CibleConfiguration.PARAMETRE,
            cibleId: param.id,
            cibleNom: cle,
            ancienneValeur,
            nouvelleValeur: valeur,
            restaurable: true,
            req,
        });

        this.emitChange(
            ancienneValeur ? ActionConfiguration.UPDATE : ActionConfiguration.CREATE,
            CibleConfiguration.PARAMETRE,
            param.id,
            cle,
            ancienneValeur,
            valeur,
            utilisateurId
        );

        logger.info(`Paramètre défini: ${cle} = ${valeur}`);
        return param;
    }

    async updateParametresBulk(dto: UpdateParametresBulkDto, utilisateurId?: string, req?: Request): Promise<number> {
        let updated = 0;
        for (const { cle, valeur } of dto.parametres) {
            try {
                await this.setParametre(cle, valeur, utilisateurId, req);
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

    async resetParametre(cle: string, utilisateurId?: string, req?: Request): Promise<ParametreSysteme> {
        const param = await this.parametreRepository.findOne({ where: { cle } });
        if (!param) {
            throw new AppError(`Paramètre "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
        }

        const ancienneValeur = param.valeur;

        if (param.valeurDefaut) {
            param.valeur = param.valeurDefaut;
            await this.parametreRepository.save(param);
            this.invalidateCache('parametres');

            await this.historyService.logAction({
                utilisateurId,
                action: ActionConfiguration.RESET,
                cible: CibleConfiguration.PARAMETRE,
                cibleId: param.id,
                cibleNom: cle,
                ancienneValeur,
                nouvelleValeur: param.valeur,
                req,
            });

            this.emitChange(ActionConfiguration.RESET, CibleConfiguration.PARAMETRE, param.id, cle, ancienneValeur, param.valeur, utilisateurId);
        }

        return param;
    }

    async getParametres(query: QueryParametresDto): Promise<ParametreSysteme[]> {
        const qb = this.parametreRepository.createQueryBuilder('p');

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
}

export const configurationService = new ConfigurationService();
export default ConfigurationService;
