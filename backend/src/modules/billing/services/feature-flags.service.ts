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

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { FeatureFlagTenant } from '../entities';
import { PlanAbonnement, AbonnementClient, StatutAbonnement } from '../entities';

export class FeatureFlagService {
    private flagRepo: Repository<FeatureFlagTenant>;
    private abonnementRepo: Repository<AbonnementClient>;
    private planRepo: Repository<PlanAbonnement>;

    // Cache en mémoire (TTL 60 secondes — harmonisé v10)
    private cache: Map<string, { value: boolean; expiresAt: number }> = new Map();
    private readonly CACHE_TTL = 60 * 1000; // 60 secondes (harmonisé avec ConfigurationService)

    constructor() {
        this.flagRepo = AppDataSource.getRepository(FeatureFlagTenant);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.planRepo = AppDataSource.getRepository(PlanAbonnement);
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

        // 2. Vérifier les flags du plan d'abonnement
        const abonnement = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: StatutAbonnement.ACTIF,
            },
            relations: ['plan'],
        });

        if (abonnement?.plan?.featureFlags) {
            const planFlag = abonnement.plan.featureFlags[flagName];
            if (planFlag !== undefined) {
                this.setCache(cacheKey, planFlag);
                return planFlag;
            }
        }

        // 3. Vérifier les modules inclus du plan
        if (abonnement?.plan?.modulesInclus) {
            // Les modules inclus activent automatiquement les flags associés
            // Ex: si 'transport' est dans modulesInclus, alors 'module_transport' = true
            const moduleFlag = flagName.replace('module_', '');
            if (abonnement.plan.modulesInclus.includes(moduleFlag)) {
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

        // Récupérer l'abonnement et le plan
        const abonnement = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: StatutAbonnement.ACTIF,
            },
            relations: ['plan'],
        });

        // Flags du plan
        if (abonnement?.plan?.featureFlags) {
            Object.assign(result, abonnement.plan.featureFlags);
        }

        // Modules inclus
        if (abonnement?.plan?.modulesInclus) {
            for (const module of abonnement.plan.modulesInclus) {
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
}

export default FeatureFlagService;
