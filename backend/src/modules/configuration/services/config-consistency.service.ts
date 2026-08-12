/**
 * ==================================
 * eLISAschool - Service ConfigConsistency v10.0
 * ==================================
 * Version: 10.0.0
 * Auteur: franck arlos chendjou
 * 
 * Vérification de cohérence inter-cascades :
 * - Si module désactivé via {module}.actif = false → ses feature flags retournent false
 * - Vérifier cohérence modules/feature flags/tranches
 * - Détecter les incohérences de configuration
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ParametreSysteme } from '../entities/parametre-systeme.entity';
import { ModuleCatalogue } from '@modules/billing/entities/module-catalogue.entity';
import { FeatureFlagTenant } from '@modules/billing/entities/feature-flag-tenant.entity';
import { AbonnementClient, StatutAbonnement } from '@modules/billing/entities';
import { logger } from '@common/utils/logger.util';

/**
 * Résultat d'une vérification de cohérence
 */
export interface ConsistencyCheckResult {
    /** Type d'incohérence détectée */
    type: 'module_disabled_but_flags_active' | 'module_enabled_but_flags_inactive' | 'orphan_feature_flag' | 'missing_module_param';
    /** Sévérité */
    severity: 'error' | 'warning' | 'info';
    /** Message descriptif */
    message: string;
    /** Clé du paramètre ou module concerné */
    key: string;
    /** Valeur actuelle */
    currentValue?: any;
    /** Valeur attendue */
    expectedValue?: any;
    /** Établissement concerné (null si global) */
    etablissementId?: string | null;
}

/**
 * Résultat complet du check de cohérence
 */
export interface ConsistencyReport {
    /** Timestamp du rapport */
    timestamp: Date;
    /** Nombre total d'incohérences détectées */
    totalIssues: number;
    /** Incohérences par sévérité */
    bySeverity: {
        errors: number;
        warnings: number;
        infos: number;
    };
    /** Liste des incohérences détectées */
    issues: ConsistencyCheckResult[];
    /** Statut global */
    status: 'healthy' | 'degraded' | 'critical';
}

export class ConfigConsistencyService {
    private parametreRepository: Repository<ParametreSysteme>;
    private catalogueRepository: Repository<ModuleCatalogue>;
    private featureFlagRepository: Repository<FeatureFlagTenant>;
    private abonnementRepository: Repository<AbonnementClient>;

    constructor() {
        this.parametreRepository = AppDataSource.getRepository(ParametreSysteme);
        this.catalogueRepository = AppDataSource.getRepository(ModuleCatalogue);
        this.featureFlagRepository = AppDataSource.getRepository(FeatureFlagTenant);
        this.abonnementRepository = AppDataSource.getRepository(AbonnementClient);
    }

    /**
     * Vérifie la cohérence de toute la configuration
     * 
     * @returns Rapport complet de cohérence
     */
    async checkConsistency(): Promise<ConsistencyReport> {
        const issues: ConsistencyCheckResult[] = [];

        // 1. Vérifier cohérence modules/feature flags
        const moduleIssues = await this.checkModuleFeatureFlagsConsistency();
        issues.push(...moduleIssues);

        // 2. Vérifier cohérence modules/paramètres
        const moduleParamIssues = await this.checkModuleParamsConsistency();
        issues.push(...moduleParamIssues);

        // 3. Vérifier feature flags orphelins
        const orphanIssues = await this.checkOrphanFeatureFlags();
        issues.push(...orphanIssues);

        // Calculer les statistiques
        const bySeverity = {
            errors: issues.filter(i => i.severity === 'error').length,
            warnings: issues.filter(i => i.severity === 'warning').length,
            infos: issues.filter(i => i.severity === 'info').length,
        };

        // Déterminer le statut global
        let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
        if (bySeverity.errors > 0) {
            status = 'critical';
        } else if (bySeverity.warnings > 5) {
            status = 'degraded';
        }

        logger.info(`[ConfigConsistency] Rapport généré : ${issues.length} incohérences détectées (statut: ${status})`);

        return {
            timestamp: new Date(),
            totalIssues: issues.length,
            bySeverity,
            issues,
            status,
        };
    }

    /**
     * Vérifie la cohérence entre l'état des modules et leurs feature flags
     * 
     * Règle : Si un module est désactivé, tous ses feature flags associés devraient être false
     */
    private async checkModuleFeatureFlagsConsistency(): Promise<ConsistencyCheckResult[]> {
        const issues: ConsistencyCheckResult[] = [];

        // Récupérer tous les modules du catalogue
        const modules = await this.catalogueRepository.find({
            select: ['code', 'nom', 'actifParDefaut'],
        });

        // Récupérer tous les paramètres {module}.actif
        const moduleParams = await this.parametreRepository.find({
            where: {
                cle: In(modules.map(m => `modules.${m.code}.actif`)),
            },
        });

        // Créer une map module code → actif
        const moduleActiveMap = new Map<string, boolean>();
        for (const mod of modules) {
            const param = moduleParams.find(p => p.cle === `modules.${mod.code}.actif`);
            const isActive = param ? JSON.parse(param.valeur) === true : mod.actifParDefaut;
            moduleActiveMap.set(mod.code, isActive);
        }

        // Récupérer tous les feature flags
        const allFlags = await this.featureFlagRepository.find({
            select: ['flagName', 'enabled', 'etablissementId'],
        });

        // Vérifier chaque flag
        for (const flag of allFlags) {
            // Extraire le nom du module du flag (ex: "module_transport" → "transport")
            const moduleName = flag.flagName.replace('module_', '');
            const moduleActive = moduleActiveMap.get(moduleName);

            // Si le module existe et est désactivé, mais le flag est actif
            if (moduleActive === false && flag.enabled) {
                issues.push({
                    type: 'module_disabled_but_flags_active',
                    severity: 'error',
                    message: `Le module "${moduleName}" est désactivé mais le feature flag "${flag.flagName}" est actif pour l'établissement ${flag.etablissementId}`,
                    key: flag.flagName,
                    currentValue: flag.enabled,
                    expectedValue: false,
                    etablissementId: flag.etablissementId,
                });
            }
        }

        return issues;
    }

    /**
     * Vérifie la cohérence entre les modules et leurs paramètres
     * 
     * Règle : Chaque module du catalogue devrait avoir un paramètre {module}.actif
     */
    private async checkModuleParamsConsistency(): Promise<ConsistencyCheckResult[]> {
        const issues: ConsistencyCheckResult[] = [];

        const modules = await this.catalogueRepository.find({
            select: ['code', 'nom'],
        });

        const moduleParams = await this.parametreRepository.find({
            where: {
                cle: In(modules.map(m => `modules.${m.code}.actif`)),
            },
            select: ['cle'],
        });

        const paramKeys = new Set(moduleParams.map(p => p.cle));

        for (const mod of modules) {
            const expectedKey = `modules.${mod.code}.actif`;
            if (!paramKeys.has(expectedKey)) {
                issues.push({
                    type: 'missing_module_param',
                    severity: 'warning',
                    message: `Le module "${mod.code}" (${mod.nom}) n'a pas de paramètre "${expectedKey}" défini`,
                    key: expectedKey,
                    expectedValue: mod.actifParDefaut,
                });
            }
        }

        return issues;
    }

    /**
     * Vérifie les feature flags orphelins (sans module associé)
     */
    private async checkOrphanFeatureFlags(): Promise<ConsistencyCheckResult[]> {
        const issues: ConsistencyCheckResult[] = [];

        const allFlags = await this.featureFlagRepository.find({
            select: ['flagName'],
        });

        const modules = await this.catalogueRepository.find({
            select: ['code'],
        });

        const moduleCodes = new Set(modules.map(m => m.code));

        for (const flag of allFlags) {
            // Les flags qui commencent par "module_" devraient avoir un module associé
            if (flag.flagName.startsWith('module_')) {
                const moduleName = flag.flagName.replace('module_', '');
                if (!moduleCodes.has(moduleName)) {
                    issues.push({
                        type: 'orphan_feature_flag',
                        severity: 'info',
                        message: `Le feature flag "${flag.flagName}" n'a pas de module associé dans le catalogue`,
                        key: flag.flagName,
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Vérifie la cohérence pour un établissement spécifique
     * 
     * @param etablissementId ID de l'établissement
     */
    async checkConsistencyForEtablissement(etablissementId: string): Promise<ConsistencyCheckResult[]> {
        const issues: ConsistencyCheckResult[] = [];

        // Récupérer les modules actifs pour cet établissement
        const modules = await this.catalogueRepository.find();
        const moduleActiveMap = new Map<string, boolean>();

        for (const mod of modules) {
            const isActive = await this.isModuleActiveForEtablissement(mod.code, etablissementId);
            moduleActiveMap.set(mod.code, isActive);
        }

        // Récupérer les feature flags pour cet établissement
        const flags = await this.featureFlagRepository.find({
            where: { etablissementId },
        });

        // Vérifier chaque flag
        for (const flag of flags) {
            const moduleName = flag.flagName.replace('module_', '');
            const moduleActive = moduleActiveMap.get(moduleName);

            if (moduleActive === false && flag.enabled) {
                issues.push({
                    type: 'module_disabled_but_flags_active',
                    severity: 'error',
                    message: `Le module "${moduleName}" est désactivé mais le feature flag "${flag.flagName}" est actif`,
                    key: flag.flagName,
                    currentValue: flag.enabled,
                    expectedValue: false,
                    etablissementId,
                });
            }
        }

        return issues;
    }

    /**
     * Vérifie si un module est actif pour un établissement
     */
    private async isModuleActiveForEtablissement(moduleCode: string, etablissementId: string): Promise<boolean> {
        const param = await this.parametreRepository.findOne({
            where: {
                cle: `modules.${moduleCode}.actif`,
                etablissementId,
            },
        });

        if (param) {
            return JSON.parse(param.valeur) === true;
        }

        // Fallback vers le paramètre global
        const globalParam = await this.parametreRepository.findOne({
            where: {
                cle: `modules.${moduleCode}.actif`,
                etablissementId: null as any,
            },
        });

        if (globalParam) {
            return JSON.parse(globalParam.valeur) === true;
        }

        // Fallback vers le catalogue
        const module = await this.catalogueRepository.findOne({
            where: { code: moduleCode },
            select: ['actifParDefaut'],
        });

        return module?.actifParDefaut ?? false;
    }
}

// Singleton export
export const configConsistencyService = new ConfigConsistencyService();
