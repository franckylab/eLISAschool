/**
 * ==================================
 * eLISAschool - Service Feature Flags
 * ==================================
 * 
 * Résolution des feature flags avec cascade :
 * plan (défaut) → override tenant → override global
 * 
 * Phase 4.4 — Refonte SaaS
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { FeatureFlagTenant } from '../entities';
import { PlanAbonnement, AbonnementClient, StatutAbonnement } from '../entities';
import { FeatureFlagDefinition } from '../entities/feature-flag-definition.entity';
import { FeatureFlagHistory, ActionFeatureFlag } from '../entities/feature-flag-history.entity';

export class FeatureFlagService {
    private flagRepo: Repository<FeatureFlagTenant>;
    private abonnementRepo: Repository<AbonnementClient>;
    private planRepo: Repository<PlanAbonnement>;
    private definitionRepo: Repository<FeatureFlagDefinition>;
    private historyRepo: Repository<FeatureFlagHistory>;

    // Cache en mémoire (TTL 60 secondes — harmonisé v10)
    private cache: Map<string, { value: boolean; expiresAt: number }> = new Map();
    private readonly CACHE_TTL = 60 * 1000; // 60 secondes (harmonisé avec ConfigurationService)

    constructor() {
        this.flagRepo = AppDataSource.getRepository(FeatureFlagTenant);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.planRepo = AppDataSource.getRepository(PlanAbonnement);
        this.definitionRepo = AppDataSource.getRepository(FeatureFlagDefinition);
        this.historyRepo = AppDataSource.getRepository(FeatureFlagHistory);
    }

    /**
     * Vérifie si un feature flag est activé pour un établissement.
     * 
     * Cascade de résolution :
     * 1. Override tenant (FeatureFlagTenant) — priorité maximale
     * 2. Flags du plan d'abonnement (PlanAbonnement.featureFlags)
     * 3. Défaut: false
     */
    async isEnabled(flagName: string, etablissementId: string): Promise<boolean> {
        const cacheKey = `${etablissementId}:${flagName}`;

        // Vérifier le cache
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value;
        }

        // 1. Vérifier l'override tenant
        const override = await this.flagRepo.findOne({
            where: { etablissementId, flagName },
        });

        if (override) {
            this.setCache(cacheKey, override.enabled);
            return override.enabled;
        }

        // 2. Vérifier les flags du plan d'abonnement (I4 v3 : ACTIF + ESSAI)
        const abonnement = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]),
            },
            relations: ['plan'],
        });

        if (abonnement?.plan?.entitlements?.fonctionnalites) {
            // Refonte v3 : fonctionnalités listées dans entitlements JSONB
            if (abonnement.plan.entitlements.fonctionnalites.includes(flagName)) {
                this.setCache(cacheKey, true);
                return true;
            }
        }

        // 3. Vérifier les modules inclus du plan
        if (abonnement?.plan?.entitlements?.modules) {
            // Les modules inclus activent automatiquement les flags associés
            // Ex: si 'transport' est dans entitlements.modules, alors 'module_transport' = true
            const moduleFlag = flagName.replace('module_', '');
            if (abonnement.plan.entitlements.modules.includes(moduleFlag)) {
                this.setCache(cacheKey, true);
                return true;
            }
        }

        // Défaut: désactivé
        this.setCache(cacheKey, false);
        return false;
    }

    /**
     * Récupère tous les feature flags pour un établissement.
     */
    async getAllFlags(etablissementId: string): Promise<Record<string, boolean>> {
        const result: Record<string, boolean> = {};

        // Récupérer l'abonnement et le plan (I4 v3 : ACTIF + ESSAI)
        const abonnement = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]),
            },
            relations: ['plan'],
        });

        // Flags du plan (Refonte v3 : entitlements.fonctionnalites)
        if (abonnement?.plan?.entitlements?.fonctionnalites) {
            for (const cle of abonnement.plan.entitlements.fonctionnalites) {
                result[cle] = true;
            }
        }

        // Modules inclus (Refonte v3 : entitlements.modules)
        if (abonnement?.plan?.entitlements?.modules) {
            for (const module of abonnement.plan.entitlements.modules) {
                result[`module_${module}`] = true;
            }
        }

        // Overrides tenant (priorité maximale)
        const overrides = await this.flagRepo.find({
            where: { etablissementId },
        });

        for (const override of overrides) {
            result[override.flagName] = override.enabled;
        }

        return result;
    }

    /**
     * Toggle un feature flag pour un établissement spécifique.
     */
    async toggleFlag(
        flagName: string,
        etablissementId: string,
        enabled: boolean,
        modifiePar?: string
    ): Promise<FeatureFlagTenant> {
        let flag = await this.flagRepo.findOne({
            where: { etablissementId, flagName },
        });

        if (flag) {
            flag.enabled = enabled;
            flag.source = 'MANUAL';
            flag.modifiePar = modifiePar;
        } else {
            flag = this.flagRepo.create({
                etablissementId,
                flagName,
                enabled,
                source: 'MANUAL',
                modifiePar,
            });
        }

        const saved = await this.flagRepo.save(flag);

        // Invalider le cache
        this.cache.delete(`${etablissementId}:${flagName}`);

        logger.info(
            `[FeatureFlags] Toggle — Flag: ${flagName} → ${enabled ? 'ON' : 'OFF'} ` +
            `pour établissement ${etablissementId}`
        );

        return saved;
    }

    /**
     * Supprime un override tenant (revient au défaut du plan).
     */
    async resetFlag(flagName: string, etablissementId: string): Promise<void> {
        await this.flagRepo.delete({ etablissementId, flagName });
        this.cache.delete(`${etablissementId}:${flagName}`);
    }

    /**
     * Invalide tout le cache pour un établissement.
     */
    invalidateCache(etablissementId: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${etablissementId}:`)) {
                this.cache.delete(key);
            }
        }
    }

    private setCache(key: string, value: boolean): void {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.CACHE_TTL,
        });
    }

    // =============================================
    // Méthodes enrichies — Migration 210
    // =============================================

    /**
     * Vérifie si un flag est activé avec prise en compte du rollout progressif.
     * Si le flag a un rolloutPercentage < 100, vérifie si l'établissement est dans le pourcentage.
     */
    async isEnabledWithRollout(flagName: string, etablissementId: string): Promise<boolean> {
        // 1. Vérifier d'abord si le flag est activé normalement
        const enabled = await this.isEnabled(flagName, etablissementId);
        if (!enabled) return false;

        // 2. Vérifier le rollout percentage
        const definition = await this.definitionRepo.findOne({ where: { cle: flagName } });
        if (!definition || definition.rolloutPercentage >= 100) {
            return true; // Pas de restriction de rollout
        }

        if (definition.rolloutPercentage <= 0) {
            return false; // Rollout à 0% = désactivé pour tous
        }

        // 3. Vérifier si l'établissement est dans le pourcentage (hash stable)
        return this.isEtablissementInRollout(etablissementId, definition.rolloutPercentage);
    }

    /**
     * Calcule si un établissement est dans le pourcentage de rollout.
     * Utilise un hash stable sur l'UUID pour une assignation déterministe.
     */
    private isEtablissementInRollout(etablissementId: string, percentage: number): boolean {
        const hash = this.simpleHash(etablissementId);
        return (hash % 100) < percentage;
    }

    /**
     * Hash simple et stable pour un UUID.
     * Retourne un entier positif.
     */
    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Récupère tous les flags avec leurs métadonnées pour un établissement.
     * Combine les définitions avec les valeurs résolues.
     */
    async getAllFlagsWithMetadata(etablissementId: string): Promise<Array<{
        name: string;
        label: string;
        description: string | null;
        categorie: string;
        type: string;
        enabled: boolean;
        source: 'plan' | 'tenant_override' | 'default' | 'definition';
        planMinimal: string | null;
        rolloutPercentage: number;
        estSysteme: boolean;
        expiresAt: Date | null;
    }>> {
        // 1. Récupérer les définitions actives
        const definitions = await this.definitionRepo.find({
            where: { estActif: true },
            order: { categorie: 'ASC', cle: 'ASC' },
        });

        // 2. Récupérer les valeurs résolues
        const resolvedFlags = await this.getAllFlags(etablissementId);

        // 3. Récupérer les overrides tenant pour déterminer la source
        const overrides = await this.flagRepo.find({ where: { etablissementId } });
        const overrideMap = new Map(overrides.map(o => [o.flagName, o]));

        // 4. Combiner les données
        const result = definitions.map(def => {
            const enabled = resolvedFlags[def.cle] ?? def.valeurDefaut;
            const hasOverride = overrideMap.has(def.cle);

            let source: 'plan' | 'tenant_override' | 'default' | 'definition';
            if (hasOverride) {
                source = 'tenant_override';
            } else if (def.cle.startsWith('module_') || resolvedFlags[def.cle] !== undefined) {
                source = 'plan';
            } else {
                source = 'definition';
            }

            return {
                name: def.cle,
                label: def.label,
                description: def.description ?? null,
                categorie: def.categorie as string,
                type: def.type as string,
                enabled,
                source,
                planMinimal: def.planMinimal ?? null,
                rolloutPercentage: def.rolloutPercentage,
                estSysteme: def.estSysteme,
                expiresAt: def.expiresAt ?? null,
            };
        });

        return result;
    }

    /**
     * Log une entrée dans l'historique des feature flags.
     */
    async logHistory(params: {
        flagDefinitionId?: string;
        etablissementId?: string;
        action: ActionFeatureFlag;
        ancienneValeur?: string;
        nouvelleValeur?: string;
        modifiePar?: string;
        commentaire?: string;
    }): Promise<void> {
        const entry = this.historyRepo.create(params);
        await this.historyRepo.save(entry);
    }

    /**
     * Évalue les règles de segments pour un flag et un établissement.
     * Retourne true si l'établissement correspond à au moins une règle.
     */
    async evaluateSegments(flagName: string, etablissementId: string): Promise<boolean> {
        const definition = await this.definitionRepo.findOne({ where: { cle: flagName } });
        if (!definition || !definition.segments || definition.segments.length === 0) {
            return true; // Pas de segments = accessible à tous
        }

        // Récupérer les infos de l'établissement pour évaluer les règles
        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId, statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]) },
            relations: ['plan'],
        });

        const contexte = {
            planSlug: abonnement?.plan?.slug || '',
            planRank: abonnement?.plan?.ordre || 0,
            etablissementId,
        };

        // Évaluer chaque règle (OR entre les règles)
        for (const rule of definition.segments) {
            if (this.evaluateRule(rule, contexte)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Évalue une règle de segment contre un contexte.
     */
    private evaluateRule(
        rule: { champ: string; operateur: string; valeur: string },
        contexte: { planSlug: string; planRank: number; etablissementId: string }
    ): boolean {
        const { champ, operateur, valeur } = rule;
        const contextValue = contexte[champ as keyof typeof contexte];

        if (contextValue === undefined) return false;

        switch (operateur) {
            case 'eq':
                return String(contextValue) === valeur;
            case 'neq':
                return String(contextValue) !== valeur;
            case 'gte':
                return Number(contextValue) >= Number(valeur);
            case 'lte':
                return Number(contextValue) <= Number(valeur);
            case 'in':
                return valeur.split(',').map(v => v.trim()).includes(String(contextValue));
            default:
                return false;
        }
    }
}

export default FeatureFlagService;
