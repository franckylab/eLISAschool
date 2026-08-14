/**
 * ==================================
 * eLISAschool - Service Configuration v5.0
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 * 
 * Système de configuration hybride complet avec :
 * - Cache mémoire performant
 * - Intégration historique automatique
 * - Listener pour événements
 * - CRUD complet
 */

import { Repository, Like, In, IsNull, Not } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { ConfigurationModule } from '../entities';
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
import { configurationListener, ConfigChangeEvent } from './configuration-listener';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { ModuleCatalogue } from '@modules/billing/entities/module-catalogue.entity'; // P2.1 v7
import { entitlementService } from '@modules/billing/services/entitlement.service'; // fusion P0.1 — source unique
import { redisService } from '@common/services/redis.service'; // R2 v7.1 — pub/sub cross-instance
import { encrypt, decrypt } from '@common/utils/encryption.util'; // R3 v7.1 — chiffrement paramètres sensibles
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities'; // v10 — cascade groupe
import { validateParametreValue } from '../utils/param-validation'; // v10 — validation Zod

/**
 * Cache en mémoire pour les configurations
 */
interface ConfigCache {
    modules: Map<string, ConfigurationModule>;
    parametres: Map<string, any>;
    modulesActifs: Map<string, { value: boolean; expiry: number }>;
    lastRefresh: number;
}

const CACHE_TTL = 60 * 1000; // P1.5 v7 — 60 secondes (unifié, était 5 min)

/** R2 v7.1 — Canal pub/sub pour invalidation cross-instance */
const PUBSUB_CHANNEL = 'config:cache:invalidate';

/** v10 — Cache Redis pour les paramètres (TTL 60s) */
const REDIS_CACHE_PREFIX = 'config:param';
const REDIS_CACHE_TTL = 60; // secondes

/**
 * Service de gestion de la configuration unifiée v6.0
 * 
 * Architecture simplifiée:
 * - ParametreSysteme: TOUS les paramètres (global + établissement)
 * - ConfigurationModule: Config technique uniquement (champs perso, widgets)
 * - EtablissementConfig: Uniquement quotas/abonnement SaaS
 */
export class ConfigurationService {
    private configModuleRepository: Repository<ConfigurationModule>;
    private parametreRepository: Repository<ParametreSysteme>;
    private catalogueRepository: Repository<ModuleCatalogue>; // P2.1 v7
    private groupeLienRepository: Repository<GroupeEtablissementLien>; // v10 — cascade groupe

    private cache: ConfigCache = {
        modules: new Map(),
        parametres: new Map(),
        modulesActifs: new Map(),
        lastRefresh: 0,
    };

    constructor() {
        this.configModuleRepository = AppDataSource.getRepository(ConfigurationModule);
        this.parametreRepository = AppDataSource.getRepository(ParametreSysteme);
        this.catalogueRepository = AppDataSource.getRepository(ModuleCatalogue); // P2.1 v7
        this.groupeLienRepository = AppDataSource.getRepository(GroupeEtablissementLien); // v10 — cascade groupe

        // R2 v7.1 — S'abonner aux invalidations cross-instance
        this.initPubSub();
    }

    /** R2 v7.1 — Initialiser l'abonnement pub/sub pour invalidation cross-instance */
    private initPubSub(): void {
        try {
            redisService.subscribe(PUBSUB_CHANNEL, (message: { type?: string }) => {
                const { type } = message;
                if (!type || type === 'modules') this.cache.modules.clear();
                if (!type || type === 'parametres') this.cache.parametres.clear();
                this.cache.lastRefresh = 0;
                logger.debug('[Configuration] Cache invalidé via pub/sub Redis');
            });
        } catch (error) {
            logger.warn('[Configuration] Pub/Sub init échoué (fonctionnel en mode single-instance)');
        }
    }

    // ============================================
    // CACHE
    // ============================================

    invalidateCache(type?: 'modules' | 'parametres'): void {
        if (!type || type === 'modules') this.cache.modules.clear();
        if (!type || type === 'parametres') this.cache.parametres.clear();
        this.cache.lastRefresh = 0;
        configurationListener.emitCacheInvalidated(type);
        logger.debug('Cache de configuration invalidé');

        // v10 — Invalider aussi le cache Redis
        if (!type || type === 'parametres') {
            this.invalidateRedisCache().catch(() => {
                // Silencieux — Redis indisponible
            });
        }

        // R2 v7.1 — Pub/sub pour propager l'invalidation aux autres instances
        try {
            redisService.publish(PUBSUB_CHANNEL, { type });
        } catch {
            // Silencieux — les autres instances expireront naturellement via TTL
        }
    }

    /**
     * v10 — Invalide le cache Redis des paramètres
     * Utilise SCAN pour trouver toutes les clés avec le préfixe
     */
    private async invalidateRedisCache(): Promise<void> {
        try {
            const pattern = `${REDIS_CACHE_PREFIX}:*`;
            const keys = await redisService.scan(pattern);
            if (keys.length > 0) {
                await redisService.del(keys);
                logger.debug(`[Configuration] Cache Redis invalidé (${keys.length} clés supprimées)`);
            }
        } catch {
            // Silencieux — Redis indisponible
        }
    }

    private isCacheValid(): boolean {
        return Date.now() - this.cache.lastRefresh < CACHE_TTL;
    }

    // ============================================
    // PARAMÈTRES SYSTÈME - Accès rapide
    // ============================================

    /**
     * Récupère un paramètre avec logique de fallback multi-établissement
     * 
     * Ordre de résolution :
     * 1. Paramètre scopé à l'établissement (si etablissementId fourni)
     * 2. Paramètre global (etablissementId = NULL)
     * 3. Valeur par défaut (si fournie)
     */

    async getConfigModule(moduleNom: string, etablissementId?: string): Promise<ConfigurationModule> {
        const cacheKey = `${moduleNom}:${etablissementId || 'global'}`;

        if (this.cache.modules.has(cacheKey) && this.isCacheValid()) {
            return this.cache.modules.get(cacheKey)!;
        }

        let config = await this.configModuleRepository.findOne({
            where: { moduleNom, etablissementId: etablissementId || undefined },
        });

        if (!config) {
            // P2.2 v7 — Lire la config par défaut depuis le catalogue DB
            const catalogueModule = await this.catalogueRepository.findOne({
                where: { code: moduleNom, estActif: true },
            });
            config = this.configModuleRepository.create({
                moduleNom,
                etablissementId,
                champsPersonnalises: [],
                widgets: [],
                parametres: catalogueModule?.config || {},
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
        // actif est géré via ParametresSysteme (toggleModule), pas dans ConfigurationModule

        await this.configModuleRepository.save(config);
        this.invalidateCache('modules');

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            cible: 'ConfigurationModule',
            cibleId: config.id,
            description: `Module ${moduleNom} mis à jour`,
            module: 'configuration',
            etablissementId,
            anciennesValeurs: ancienneValeur as unknown as Record<string, unknown>,
            nouvellesValeurs: config as unknown as Record<string, unknown>,
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
        // P2.2 v7 — Validation: module existe dans le catalogue DB (source unique)
        const catalogueModule = await this.catalogueRepository.findOne({
            where: { code: moduleNom, estActif: true },
        });
        if (!catalogueModule) {
            // Message d'erreur dynamique avec exemples de modules valides
            const validModules = await this.catalogueRepository.find({
                where: { estActif: true },
                select: ['code'],
                order: { code: 'ASC' },
            });
            throw new AppError(
                `Module "${moduleNom}" non reconnu. Modules valides: ${validModules.map(m => m.code).join(', ')}`,
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

        // 3. Écrire dans ParametreSysteme (override établissement) + Catalogue DB
        await this.toggleModuleParametre(moduleNom, actif, etablissementId);

        // P2.2 v7 — Mise à jour du catalogue DB (actifParDefaut pour le contexte global)
        if (!etablissementId) {
            catalogueModule.actifParDefaut = actif;
            await this.catalogueRepository.save(catalogueModule);
        }

        // 4. Historique
        await auditService.log({
            utilisateurId,
            action: actif ? AuditAction.MODULE_ACTIVATE : AuditAction.MODULE_DEACTIVATE,
            cible: 'ConfigurationModule',
            cibleId: moduleNom,
            description: `Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}`,
            module: 'configuration',
            etablissementId,
            anciennesValeurs: { actif: ancienEtat },
            nouvellesValeurs: { actif },
        });

        // 5. Invalidation granulaire du cache
        this.invalidateModuleCache(moduleNom, etablissementId);
        modulesAutoActivés.forEach(dep => this.invalidateModuleCache(dep, etablissementId));

        // P2.2 v7 — Invalidation du cache entitlement (fusion P0.1)
        entitlementService.invalidate(etablissementId);

        // 6. Événement
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

    /**
     * Active/désactive un module dans ParametreSysteme
     */
    private async toggleModuleParametre(moduleNom: string, actif: boolean, etablissementId?: string): Promise<void> {
        const cle = `modules.${moduleNom}.actif`;
        await this.setParametre(cle, actif, etablissementId);
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

        // P2.2 v7 — Lire les dépendances depuis le catalogue DB (source unique)
        const catalogueModule = await this.catalogueRepository.findOne({
            where: { code: moduleNom, estActif: true },
        });
        if (!catalogueModule) {
            return { valide: true, erreurs: [], modulesAutoActivés: [] };
        }

        // P4.1 v7 — Protection modules BASE : non désactivables
        if (!actif && catalogueModule.categorie === 'BASE') {
            return {
                valide: false,
                erreurs: [`Le module "${catalogueModule.nom}" est critique et ne peut pas être désactivé`],
                modulesAutoActivés: [],
            };
        }

        if (!catalogueModule.dependencies || catalogueModule.dependencies.length === 0) {
            return { valide: true, erreurs: [], modulesAutoActivés: [] };
        }

        const erreurs: string[] = [];
        const modulesAutoActivés: string[] = [];

        if (actif) {
            // Activation: vérifier que toutes les dépendances sont actives
            for (const dep of catalogueModule.dependencies) {
                const estActive = await this.isModuleActive(dep, etablissementId);
                if (!estActive) {
                    // Auto-activation de la dépendance (ParametreSysteme uniquement)
                    try {
                        await this.toggleModuleParametre(dep, true, etablissementId);
                        modulesAutoActivés.push(dep);
                    } catch (error) {
                        // Lire le nom depuis le catalogue DB
                        const depCatalogue = await this.catalogueRepository.findOne({ where: { code: dep } });
                        erreurs.push(`Dépendance requise: ${depCatalogue?.nom || dep} (auto-activation échouée)`);
                    }
                }
            }
        } else {
            // Désactivation: vérifier les reverse dependencies
            const reverseDeps = await this.getReverseDependencies(moduleNom);
            const reverseDepsActives: string[] = [];

            for (const revDep of reverseDeps) {
                const estActive = await this.isModuleActive(revDep, etablissementId);
                if (estActive) {
                    // P2.2 v7 — Lire le nom depuis le catalogue
                    const revCatalogue = await this.catalogueRepository.findOne({ where: { code: revDep } });
                    reverseDepsActives.push(revCatalogue?.nom || revDep);
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

    /**
     * Calcule l'impact d'une activation/désactivation de module
     * Retourne la liste des modules qui seraient activés/désactivés en cascade
     */
    public async calculerImpactActivation(
        moduleNom: string,
        actif: boolean,
        etablissementId?: string,
        visite: Set<string> = new Set()
    ): Promise<{ modulesAActiver: string[]; modulesADesactiver: string[]; conflits: string[] }> {
        if (visite.has(moduleNom)) {
            return { modulesAActiver: [], modulesADesactiver: [], conflits: [`Cycle détecté: ${moduleNom}`] };
        }
        visite.add(moduleNom);

        const modulesAActiver: string[] = [];
        const modulesADesactiver: string[] = [];
        const conflits: string[] = [];

        if (actif) {
            // P2.2 v7 — Lire les dépendances depuis le catalogue DB
            const catalogueModule = await this.catalogueRepository.findOne({
                where: { code: moduleNom, estActif: true },
            });
            if (catalogueModule?.dependencies) {
                for (const dep of catalogueModule.dependencies) {
                    const estActive = await this.isModuleActive(dep, etablissementId);
                    if (!estActive) {
                        modulesAActiver.push(dep);
                        const cascade = await this.calculerImpactActivation(dep, true, etablissementId, visite);
                        for (const m of cascade.modulesAActiver) {
                            if (!modulesAActiver.includes(m)) modulesAActiver.push(m);
                        }
                    }
                }
            }
        } else {
            const reverseDeps = await this.getReverseDependencies(moduleNom);
            for (const rev of reverseDeps) {
                const estActive = await this.isModuleActive(rev, etablissementId);
                if (estActive && !visite.has(rev)) {
                    modulesADesactiver.push(rev);
                    const cascade = await this.calculerImpactActivation(rev, false, etablissementId, visite);
                    for (const m of cascade.modulesADesactiver) {
                        if (!modulesADesactiver.includes(m)) modulesADesactiver.push(m);
                    }
                }
            }

            if (modulesADesactiver.length > 0) {
                conflits.push(
                    `La désactivation de "${moduleNom}" entraînera la désactivation de: ${modulesADesactiver.join(', ')}`
                );
            }
        }

        return { modulesAActiver, modulesADesactiver, conflits };
    }

    /**
     * P2.2 v7 — Trouve les modules qui dépendent de ce module (via catalogue DB)
     * Retourne les codes des modules ayant `moduleNom` dans leurs dépendances
     */
    async getReverseDependencies(moduleNom: string): Promise<string[]> {
        // TypeORM simple-array stocke en CSV, donc on utilise LIKE pour la recherche
        const modules = await this.catalogueRepository
            .createQueryBuilder('mc')
            .where('mc.estActif = :actif', { actif: true })
            .andWhere('mc.dependencies LIKE :dep', { dep: `%${moduleNom}%` })
            .select(['mc.code'])
            .getMany();

        // Filtrer les résultats pour confirmer la correspondance exacte
        // (LIKE peut matcher des sous-chaînes)
        return modules
            .filter(m => m.dependencies.includes(moduleNom))
            .map(m => m.code);
    }

    async isModuleActive(moduleNom: string, etablissementId?: string): Promise<boolean> {
        const startTime = Date.now();
        const cacheKey = `${moduleNom}:${etablissementId || 'global'}`;
        
        // Check cache (TTL 60s)
        const cached = this.cache.modulesActifs.get(cacheKey);
        if (cached && Date.now() < cached.expiry) {
            return cached.value;
        }

        let result: boolean | null = null;

        // Niveau 1: Paramètre scopé à l'établissement (override — priorité max)
        if (etablissementId) {
            const value = await this.getParametre<boolean>(`modules.${moduleNom}.actif`, etablissementId);
            if (value !== null) {
                result = value;
            }
        }

        // Niveau 2: Paramètre global (fallback)
        if (result === null) {
            const globalValue = await this.getParametre<boolean>(`modules.${moduleNom}.actif`);
            if (globalValue !== null) {
                result = globalValue;
            }
        }

        // Niveau 3: Délégation à entitlementService (source unique de vérité — fusion P0.1)
        if (result === null && etablissementId) {
            result = await entitlementService.isAccessible(etablissementId, moduleNom);
        }

        // Niveau 4 (fallback global sans etablissementId): Catalogue DB défaut
        if (result === null) {
            const catalogueModule = await this.catalogueRepository.findOne({
                where: { code: moduleNom, estActif: true },
            });
            result = catalogueModule?.actifParDefaut ?? false;
        }

        // Cache le résultat (TTL 60s)
        this.cache.modulesActifs.set(cacheKey, {
            value: result,
            expiry: Date.now() + CACHE_TTL
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

        const typeValeur = dto.typeValeur || this.detectTypeValeur(dto.valeur);
        
        // v10 — Validation Zod de la valeur avant sauvegarde
        const validation = validateParametreValue(dto.cle, dto.valeur, typeValeur);
        if (!validation.success) {
            throw new AppError(
                `Validation échouée pour "${dto.cle}": ${validation.errors?.join(', ')}`,
                400,
                'PARAM_VALIDATION_ERROR'
            );
        }
        
        // R3 v7.1 — Chiffrement automatique si type ENCRYPTED
        const valeurSerialisee = typeValeur === TypeValeurParametre.ENCRYPTED
            ? encrypt(JSON.stringify(validation.parsedValue ?? dto.valeur))
            : JSON.stringify(validation.parsedValue ?? dto.valeur);

        const param = this.parametreRepository.create({
            cle: dto.cle,
            valeur: valeurSerialisee,
            typeValeur,
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

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            cible: 'ParametreSysteme',
            cibleId: param.id,
            description: `Paramètre créé: ${dto.cle}`,
            module: 'configuration',
            etablissementId: dto.etablissementId,
            nouvellesValeurs: { valeur: dto.valeur },
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
     * Ordre de résolution (cascade v10 — 4 niveaux) :
     * 1. Paramètre scopé à l'établissement (si etablissementId fourni)
     * 2. Paramètre scopé au groupe (via GroupeEtablissementLien)
     * 3. Paramètre global (etablissementId = NULL)
     * 4. Valeur par défaut (si fournie)
     * 
     * Cache : In-memory (60s) → Redis (60s) → DB
     * 
     * @param cle Clé du paramètre
     * @param etablissementId ID de l'établissement (optionnel)
     * @returns Valeur du paramètre ou null
     */
    async getParametre<T = any>(cle: string, etablissementId?: string): Promise<T | null> {
        const cacheKey = etablissementId ? `${cle}:${etablissementId}` : cle;
        
        // 1. Cache in-memory (60s)
        if (this.cache.parametres.has(cacheKey) && this.isCacheValid()) {
            return this.cache.parametres.get(cacheKey) as T;
        }

        // 2. v10 — Cache Redis (60s)
        const redisKey = `${REDIS_CACHE_PREFIX}:${cacheKey}`;
        try {
            const cachedValue = await redisService.get(redisKey);
            if (cachedValue !== null) {
                const parsed = JSON.parse(cachedValue) as T;
                this.cache.parametres.set(cacheKey, parsed);
                return parsed;
            }
        } catch {
            // Silencieux — Redis indisponible, fallback sur DB
        }

        // 3. Cascade de résolution (cascade v10 — 4 niveaux)
        let value: T | null = null;

        // 3.1. Chercher d'abord le paramètre scopé à l'établissement
        if (etablissementId) {
            const paramScope = await this.parametreRepository.findOne({
                where: { cle, etablissementId }
            });
            if (paramScope) {
                value = this.parseParametreValue(paramScope) as T;
            }

            // 3.2. v10 — Chercher le paramètre scopé au groupe (via GroupeEtablissementLien)
            if (value === null) {
                const groupeId = await this.resoudreGroupeEtablissement(etablissementId);
                if (groupeId) {
                    const paramGroupe = await this.parametreRepository.findOne({
                        where: { cle, groupeEtablissementId: groupeId }
                    });
                    if (paramGroupe) {
                        value = this.parseParametreValue(paramGroupe) as T;
                    }
                }
            }
        }

        // 3.3. Fallback vers le paramètre global
        if (value === null) {
            const paramGlobal = await this.parametreRepository.findOne({
                where: { cle, etablissementId: IsNull() }
            });
            if (paramGlobal) {
                value = this.parseParametreValue(paramGlobal) as T;
            }
        }

        if (value === null) return null;

        // 4. Mettre en cache (in-memory + Redis)
        this.cache.parametres.set(cacheKey, value);
        try {
            await redisService.set(redisKey, JSON.stringify(value), REDIS_CACHE_TTL);
        } catch {
            // Silencieux — Redis indisponible
        }

        return value;
    }

    /**
     * v10 — Résout le groupe d'établissements auquel appartient un établissement
     * 
     * @param etablissementId ID de l'établissement
     * @returns ID du groupe ou null si aucun groupe
     */
    private async resoudreGroupeEtablissement(etablissementId: string): Promise<string | null> {
        const lien = await this.groupeLienRepository.findOne({
            where: { etablissementId },
            select: ['groupeId']
        });
        return lien?.groupeId ?? null;
    }

    /**
     * v10 — Charge plusieurs paramètres en une seule requête SQL (batch loading)
     * 
     * Utile pour les services qui consultent 10-20 paramètres au démarrage.
     * Applique la cascade 4 niveaux pour chaque paramètre.
     * 
     * @param cles Liste des clés de paramètres à charger
     * @param etablissementId ID de l'établissement (optionnel)
     * @returns Map<cle, valeur> des paramètres trouvés
     */
    async getParametresBatch<T = any>(cles: string[], etablissementId?: string): Promise<Map<string, T>> {
        const result = new Map<string, T>();
        
        if (cles.length === 0) return result;

        // 1. Vérifier le cache in-memory pour toutes les clés
        const clesNonCachees: string[] = [];
        for (const cle of cles) {
            const cacheKey = etablissementId ? `${cle}:${etablissementId}` : cle;
            if (this.cache.parametres.has(cacheKey) && this.isCacheValid()) {
                result.set(cle, this.cache.parametres.get(cacheKey) as T);
            } else {
                clesNonCachees.push(cle);
            }
        }

        if (clesNonCachees.length === 0) return result;

        // 2. v10 — Vérifier le cache Redis pour les clés non cachées
        const clesNonRedis: string[] = [];
        try {
            const redisKeys = clesNonCachees.map(c => `${REDIS_CACHE_PREFIX}:${etablissementId ? `${c}:${etablissementId}` : c}`);
            const redisValues = await Promise.all(
                redisKeys.map(k => redisService.get(k).catch(() => null))
            );
            
            for (let i = 0; i < clesNonCachees.length; i++) {
                const value = redisValues[i];
                if (value !== null) {
                    const parsed = JSON.parse(value) as T;
                    result.set(clesNonCachees[i], parsed);
                    // Mettre aussi en cache in-memory
                    const cacheKey = etablissementId ? `${clesNonCachees[i]}:${etablissementId}` : clesNonCachees[i];
                    this.cache.parametres.set(cacheKey, parsed);
                } else {
                    clesNonRedis.push(clesNonCachees[i]);
                }
            }
        } catch {
            // Redis indisponible, tout charger depuis la DB
            clesNonRedis.push(...clesNonCachees);
        }

        if (clesNonRedis.length === 0) return result;

        // 3. Charger depuis la base de données en une seule requête
        // Résoudre le groupe si nécessaire
        let groupeId: string | null = null;
        if (etablissementId) {
            groupeId = await this.resoudreGroupeEtablissement(etablissementId);
        }

        // Construire les conditions WHERE pour la requête batch
        const conditions: any[] = [];
        
        // Paramètres globaux (etablissementId = NULL)
        conditions.push({ cle: In(clesNonRedis), etablissementId: IsNull() });
        
        // Paramètres scopés à l'établissement
        if (etablissementId) {
            conditions.push({ cle: In(clesNonRedis), etablissementId });
        }
        
        // Paramètres scopés au groupe
        if (groupeId) {
            conditions.push({ cle: In(clesNonRedis), groupeEtablissementId: groupeId });
        }

        const params = await this.parametreRepository.find({
            where: conditions,
        });

        // 4. Appliquer la cascade pour chaque clé
        for (const cle of clesNonRedis) {
            const paramsForCle = params.filter(p => p.cle === cle);
            
            // Priorité : établissement > groupe > global
            const paramEtab = paramsForCle.find(p => p.etablissementId === etablissementId);
            const paramGroupe = paramsForCle.find(p => p.groupeEtablissementId === groupeId);
            const paramGlobal = paramsForCle.find(p => p.etablissementId === null);
            
            const param = paramEtab || paramGroupe || paramGlobal;
            
            if (param) {
                const value = this.parseParametreValue(param) as T;
                result.set(cle, value);
                
                // Mettre en cache
                const cacheKey = etablissementId ? `${cle}:${etablissementId}` : cle;
                this.cache.parametres.set(cacheKey, value);
                
                // Mettre en cache Redis
                try {
                    const redisKey = `${REDIS_CACHE_PREFIX}:${cacheKey}`;
                    await redisService.set(redisKey, JSON.stringify(value), REDIS_CACHE_TTL);
                } catch {
                    // Silencieux
                }
            }
        }

        return result;
    }

    /**
     * v10 — Vue en cascade de tous les paramètres pour un établissement
     * 
     * Retourne pour chaque paramètre :
     * - La valeur globale
     * - La valeur du groupe (si applicable)
     * - La valeur de l'établissement (override)
     * - La valeur effective (après cascade)
     * - La source de la valeur effective
     */
    async getCascadeViewForEtablissement(etablissementId: string): Promise<any[]> {
        // Résoudre le groupe
        const groupeId = await this.resoudreGroupeEtablissement(etablissementId);
        
        // Récupérer tous les paramètres (globaux + établissement + groupe)
        const allParams = await this.parametreRepository.find({
            where: [
                { etablissementId: IsNull() }, // Globaux
                { etablissementId }, // Établissement
                ...(groupeId ? [{ groupeEtablissementId: groupeId }] : []), // Groupe
            ],
            order: { categorie: 'ASC', cle: 'ASC' },
        });

        // Grouper par clé
        const paramsByCle = new Map<string, ParametreSysteme[]>();
        for (const param of allParams) {
            const existing = paramsByCle.get(param.cle) || [];
            existing.push(param);
            paramsByCle.set(param.cle, existing);
        }

        // Construire la vue pour chaque paramètre
        const result: any[] = [];
        for (const [cle, params] of paramsByCle) {
            const paramGlobal = params.find(p => !p.etablissementId && !p.groupeEtablissementId);
            const paramGroupe = params.find(p => p.groupeEtablissementId === groupeId);
            const paramEtab = params.find(p => p.etablissementId === etablissementId);

            // Déterminer la valeur effective et sa source
            let valeurEffective: any;
            let source: 'etablissement' | 'groupe' | 'global' | 'defaut';

            if (paramEtab) {
                valeurEffective = this.parseParametreValue(paramEtab);
                source = 'etablissement';
            } else if (paramGroupe) {
                valeurEffective = this.parseParametreValue(paramGroupe);
                source = 'groupe';
            } else if (paramGlobal) {
                valeurEffective = this.parseParametreValue(paramGlobal);
                source = 'global';
            } else {
                valeurEffective = null;
                source = 'defaut';
            }

            result.push({
                cle,
                categorie: paramGlobal?.categorie || paramEtab?.categorie,
                module: paramGlobal?.module || paramEtab?.module,
                description: paramGlobal?.description || paramEtab?.description,
                typeValeur: paramGlobal?.typeValeur || paramEtab?.typeValeur,
                valeurGlobale: paramGlobal ? this.parseParametreValue(paramGlobal) : null,
                valeurGroupe: paramGroupe ? this.parseParametreValue(paramGroupe) : null,
                valeurEtablissement: paramEtab ? this.parseParametreValue(paramEtab) : null,
                valeurEffective,
                source,
                modifiableRuntime: paramGlobal?.modifiableRuntime ?? true,
            });
        }

        return result;
    }

    /**
     * v10 — Vue globale de tous les paramètres avec leur cascade
     * 
     * Retourne la liste de tous les paramètres globaux avec le nombre
     * d'établissements qui ont un override.
     */
    async getCascadeViewGlobal(): Promise<any[]> {
        const paramsGlobaux = await this.parametreRepository.find({
            where: { etablissementId: IsNull(), groupeEtablissementId: IsNull() },
            order: { categorie: 'ASC', cle: 'ASC' },
        });

        // Pour chaque paramètre, compter les overrides
        const result: any[] = [];
        for (const param of paramsGlobaux) {
            // Compter les overrides établissement
            const nbOverridesEtab = await this.parametreRepository.count({
                where: { cle: param.cle, etablissementId: Not(IsNull()) },
            });

            // Compter les overrides groupe
            const nbOverridesGroupe = await this.parametreRepository.count({
                where: { cle: param.cle, groupeEtablissementId: Not(IsNull()) },
            });

            result.push({
                cle: param.cle,
                categorie: param.categorie,
                module: param.module,
                description: param.description,
                typeValeur: param.typeValeur,
                valeurGlobale: this.parseParametreValue(param),
                nbOverridesEtablissement: nbOverridesEtab,
                nbOverridesGroupe: nbOverridesGroupe,
                modifiableRuntime: param.modifiableRuntime,
                visible: param.visible,
            });
        }

        return result;
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

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            cible: 'ParametreSysteme',
            cibleId: param.id,
            description: `Paramètre mis à jour: ${cle}`,
            module: 'configuration',
            etablissementId: param.etablissementId || undefined,
            anciennesValeurs: { valeur: ancienneValeur },
            nouvellesValeurs: { valeur: param.valeur },
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
        // v10 — Validation Zod de la valeur avant toute opération
        // Déterminer le type de valeur pour la validation
        let typeValeur: TypeValeurParametre;
        const existingParam = await this.parametreRepository.findOne({
            where: { cle }
        });
        if (existingParam) {
            typeValeur = existingParam.typeValeur;
        } else {
            typeValeur = this.detectTypeValeur(valeur);
        }
        
        const validation = validateParametreValue(cle, valeur, typeValeur);
        if (!validation.success) {
            throw new AppError(
                `Validation échouée pour "${cle}": ${validation.errors?.join(', ')}`,
                400,
                'PARAM_VALIDATION_ERROR'
            );
        }
        
        // Utiliser la valeur validée/parsée si disponible
        const valeurValidee = validation.parsedValue ?? valeur;
        
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
                    const typeValeur = this.detectTypeValeur(valeurValidee);
                    param = this.parametreRepository.create({
                        cle,
                        valeur: JSON.stringify(valeurValidee),
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
                        valeur: JSON.stringify(valeurValidee),
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
                        valeur: JSON.stringify(valeurValidee),
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
                
                this.validateParametreValue(param, valeurValidee);
                ancienneValeur = param.valeur;
                param.valeur = this.serializeParametreValue(param, valeurValidee);
            }
        } else {
            // Modification du paramètre global
            param = await this.parametreRepository.findOne({
                where: { cle, etablissementId: IsNull() }
            });
            ancienneValeur = param?.valeur;

            if (!param) {
                const typeValeur = this.detectTypeValeur(valeurValidee);
                param = this.parametreRepository.create({
                    cle,
                    valeur: JSON.stringify(valeurValidee),
                    typeValeur,
                    categorie: CategorieParametre.CUSTOM,
                    modifiableRuntime: true,
                    etablissementId: undefined,
                });
            } else {
                if (!param.modifiableRuntime) {
                    throw new AppError('Ce paramètre ne peut pas être modifié en runtime', 400, 'PARAM_NOT_MODIFIABLE');
                }
                this.validateParametreValue(param, valeurValidee);
                param.valeur = this.serializeParametreValue(param, valeurValidee);
            }
        }

        await this.parametreRepository.save(param);
        this.invalidateCache('parametres');

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            cible: 'ParametreSysteme',
            cibleId: param.id,
            description: `Paramètre défini: ${cle}${etablissementId ? ` [${etablissementId}]` : ''}`,
            module: 'configuration',
            etablissementId,
            anciennesValeurs: ancienneValeur ? { valeur: ancienneValeur } : undefined,
            nouvellesValeurs: { valeur },
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

            await auditService.log({
                utilisateurId,
                action: AuditAction.CONFIG_CHANGE,
                cible: 'ParametreSysteme',
                description: `Override supprimé pour ${cle} [${etablissementId}] - retour au global`,
                module: 'configuration',
                etablissementId,
                anciennesValeurs: { valeur: ancienneValeur },
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

            await auditService.log({
                utilisateurId,
                action: AuditAction.CONFIG_CHANGE,
                cible: 'ParametreSysteme',
                cibleId: param.id,
                description: `Paramètre réinitialisé vers valeur par défaut: ${cle}`,
                module: 'configuration',
                etablissementId,
                anciennesValeurs: { valeur: ancienneValeur },
                nouvellesValeurs: { valeur: param.valeur },
            });

            logger.info(`Paramètre réinitialisé vers valeur par défaut: ${cle}`);
        }
    }

    /**
     * Réinitialise TOUS les paramètres vers leurs valeurs par défaut
     * 
     * Si etablissementId fourni :
     * - Supprime TOUS les overrides de cet établissement (retour aux valeurs globales)
     * 
     * Sinon :
     * - Réinitialise TOUS les paramètres globaux vers leur valeurDefaut
     */
    async resetAllParametres(
        etablissementId?: string,
        utilisateurId?: string,
        req?: Request
    ): Promise<{ resetCount: number; skippedCount: number; total: number }> {
        let resetCount = 0;
        let skippedCount = 0;

        if (etablissementId) {
            // Supprimer TOUS les overrides de cet établissement
            const overrides = await this.parametreRepository.find({
                where: { etablissementId }
            });

            if (overrides.length > 0) {
                await this.parametreRepository.remove(overrides);
                resetCount = overrides.length;

                await auditService.log({
                    utilisateurId,
                    action: AuditAction.CONFIG_CHANGE,
                    cible: 'ParametreSysteme',
                    description: `${resetCount} overrides supprimés pour établissement ${etablissementId}`,
                    module: 'configuration',
                    etablissementId,
                });

                logger.info(`${resetCount} overrides supprimés pour établissement ${etablissementId}`);
            }

            this.invalidateCache('parametres');

            return {
                resetCount,
                skippedCount: 0,
                total: resetCount
            };
        } else {
            // Réinitialiser TOUS les paramètres globaux vers valeurDefaut
            const parametres = await this.parametreRepository.find({
                where: { etablissementId: IsNull() }
            });

            for (const param of parametres) {
                if (param.valeurDefaut && param.valeur !== param.valeurDefaut) {
                    const ancienneValeur = param.valeur;
                    param.valeur = param.valeurDefaut;
                    await this.parametreRepository.save(param);
                    resetCount++;

                    logger.info(`Paramètre réinitialisé: ${param.cle}`);
                } else {
                    skippedCount++;
                }
            }

            if (resetCount > 0) {
                await auditService.log({
                    utilisateurId,
                    action: AuditAction.CONFIG_CHANGE,
                    cible: 'ParametreSysteme',
                    description: `${resetCount} paramètres globaux réinitialisés vers leurs valeurs par défaut`,
                    module: 'configuration',
                });

                this.invalidateCache('parametres');
                logger.info(`${resetCount} paramètres globaux réinitialisés vers valeurs par défaut`);
            }

            return {
                resetCount,
                skippedCount,
                total: parametres.length
            };
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

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            cible: 'ParametreSysteme',
            description: `Paramètre supprimé: ${cle}`,
            module: 'configuration',
            etablissementId: param.etablissementId || undefined,
            anciennesValeurs: { valeur: ancienneValeur },
        });

        this.emitChange(ActionConfiguration.DELETE, CibleConfiguration.PARAMETRE, undefined, cle, ancienneValeur, undefined, utilisateurId);

        logger.info(`Paramètre supprimé: ${cle}`);
    }

    async getParametres(query: QueryParametresDto, etablissementId?: string): Promise<ParametreSysteme[]> {
        const qb = this.parametreRepository.createQueryBuilder('p');

        // Filtrer par établissement : paramètres globaux (NULL) + paramètres scopés
        if (etablissementId) {
            qb.where('(p."etablissementId" IS NULL OR p."etablissementId" = :etablissementId)', { etablissementId });
        } else {
            qb.where('p."etablissementId" IS NULL');
        }

        // Par défaut, ne montrer que les paramètres visibles
        const visibleFilter = query.visible !== undefined ? query.visible : true;
        qb.andWhere('p.visible = :visible', { visible: visibleFilter });

        if (query.categorie) qb.andWhere('p.categorie = :categorie', { categorie: query.categorie });
        if (query.module) qb.andWhere('p.module = :module', { module: query.module });
        if (query.modifiableRuntime !== undefined) qb.andWhere('p.modifiableRuntime = :mr', { mr: query.modifiableRuntime });
        if (query.search) qb.andWhere('(p.cle LIKE :search OR p.description LIKE :search)', { search: `%${query.search}%` });

        return qb.orderBy('p.ordre', 'ASC').addOrderBy('p.cle', 'ASC').getMany();
    }

    async getParametresByCategorie(categorie: CategorieParametre, globauxUniquement = false): Promise<ParametreSysteme[]> {
        const where: any = { categorie, visible: true };
        if (globauxUniquement) {
            where.etablissementId = IsNull();
        }
        return this.parametreRepository.find({
            where,
            order: { ordre: 'ASC', cle: 'ASC' },
        });
    }

    async getParametresByModule(module: string): Promise<ParametreSysteme[]> {
        return this.parametreRepository.find({
            where: { module, visible: true },
            order: { ordre: 'ASC', cle: 'ASC' },
        });
    }

    async getAllParametres(globauxUniquement = false): Promise<ParametreSysteme[]> {
        const where: any = {};
        if (globauxUniquement) {
            where.etablissementId = IsNull();
        }
        return this.parametreRepository.find({
            where,
            order: { categorie: 'ASC', ordre: 'ASC', cle: 'ASC' },
        });
    }

    // ============================================
    // EXPORT
    // ============================================

    async exportConfig(options: ExportConfigDto): Promise<any> {
        const exported: any = { exportedAt: new Date().toISOString(), version: '1.0.0' };

        if (options.includeModules) {
            exported.modules = await this.configModuleRepository.find();
        }

        if (options.includeParametres) {
            exported.parametres = await this.parametreRepository.find();
        }

        return exported;
    }

    // ============================================
    // LICENCE - Migré vers ParametreSysteme
    // ============================================

    /**
     * @deprecated Utiliser setParametre('app.licence_*') à la place
     */
    async activerLicence(dto: ActiverLicenceDto): Promise<{ success: boolean; message: string }> {
        // Migré vers ParametreSysteme
        await this.setParametre('app.licence_key', dto.licenceKey);
        await this.setParametre('app.licence_active', true);
        await this.setParametre('app.licence_expiration', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());

        logger.info('Licence activée avec succès (via ParametreSysteme)');
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
            // R3 v7.1 — Déchiffrement automatique pour les paramètres ENCRYPTED
            if (param.typeValeur === TypeValeurParametre.ENCRYPTED) {
                try {
                    const decrypted = decrypt(param.valeur);
                    return JSON.parse(decrypted);
                } catch {
                    // Si le déchiffrement échoue, retourner la valeur brute (peut être non chiffrée legacy)
                    logger.warn(`[Configuration] Échec déchiffrement paramètre ${param.cle} — valeur retournée en clair`);
                    return param.valeur;
                }
            }

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
     * R3 v7.1 — Sérialise la valeur selon le type du paramètre.
     * Pour ENCRYPTED : chiffre avec AES-256-GCM.
     * Pour les autres : JSON.stringify standard.
     * Si la valeur est déjà une string, la retourner telle quelle (déjà sérialisée).
     */
    private serializeParametreValue(param: ParametreSysteme, valeur: any): string {
        // Gérer null/undefined pour éviter le NOT NULL constraint
        if (valeur === undefined || valeur === null) {
            return '';
        }
        if (param.typeValeur === TypeValeurParametre.ENCRYPTED) {
            const str = typeof valeur === 'string' ? valeur : JSON.stringify(valeur);
            return encrypt(str);
        }
        // Si déjà une string (sérialisée côté frontend), ne pas re-sérialiser
        if (typeof valeur === 'string') {
            return valeur;
        }
        return JSON.stringify(valeur);
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
