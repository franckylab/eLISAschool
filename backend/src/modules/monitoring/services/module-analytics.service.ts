/**
 * ==================================
 * eLISAschool - Module Analytics Service
 * ==================================
 * Refonte SaaS — Fusion P6.1
 *
 * Tracking d'utilisation des modules par établissement.
 * Détecte modules sous-utilisés (optimisation plan) et
 * sur-utilisés (upsell potentiel).
 *
 * Données collectées :
 *   - Dernier accès par module/établissement
 *   - Fréquence d'utilisation (requêtes/jour)
 *   - Taux d'activation vs modules disponibles
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ModuleCatalogue } from '@modules/billing/entities/module-catalogue.entity';
import { entitlementService } from '@modules/billing/services/entitlement.service';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';

// =============================================
// TYPES
// =============================================

export interface ModuleUsageStats {
    code: string;
    nom: string;
    categorie: string;
    totalAccess: number;
    dernierAcces: Date | null;
    accesJour: number;
    accesSemaine: number;
    accesMois: number;
    tauxActivation: number; // Pourcentage d'établissements utilisant ce module
}

export interface EtablissementModuleUsage {
    code: string;
    nom: string;
    categorie: string;
    accessible: boolean;
    dernierAcces: Date | null;
    accesJour: number;
    accesSemaine: number;
    statut: 'actif' | 'inactif' | 'sous-utilise';
}

export interface GlobalModuleAnalytics {
    modules: ModuleUsageStats[];
    totalModules: number;
    modulesActifs: number;
    modulesSousUtilises: number;
    topModules: ModuleUsageStats[];
    bottomModules: ModuleUsageStats[];
}

// =============================================
// CONSTANTES
// =============================================

const ANALYTICS_PREFIX = 'analytics:modules';
const ANALYTICS_TTL = 300; // 5 minutes

/** Seuil de sous-utilisation : moins de 3 accès/semaine */
const SOUS_UTILISATION_SEUIL = 3;

// =============================================
// SERVICE
// =============================================

export class ModuleAnalyticsService {
    private catalogueRepo: Repository<ModuleCatalogue>;
    private redisAvailable = true;

    constructor() {
        this.catalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
    }

    /**
     * Enregistre un accès à un module (appelé depuis le middleware).
     * Fire-and-forget — ne bloque pas la requête.
     */
    async trackAccess(etablissementId: string, moduleCode: string): Promise<void> {
        try {
            const now = new Date().toISOString();
            const today = now.split('T')[0];

            // Redis : stocker via JSON (pas de hash disponible)
            if (this.redisAvailable) {
                const key = `${ANALYTICS_PREFIX}:${etablissementId}:${moduleCode}`;
                const existing = await redisService.getJSON<Record<string, any>>(key).catch(() => null);
                const data = existing || {};
                data.dernierAcces = now;
                data[`jour:${today}`] = (data[`jour:${today}`] || 0) + 1;
                data.totalAccess = (data.totalAccess || 0) + 1;
                await redisService.setJSON(key, data).catch(() => { this.redisAvailable = false; });
            }
        } catch (err) {
            logger.debug(`[ModuleAnalytics] Track échoué (non bloquant): ${moduleCode}`);
        }
    }

    /**
     * Analytics globales des modules (SUPER_ADMIN).
     */
    async getGlobalAnalytics(): Promise<GlobalModuleAnalytics> {
        // Cache Redis
        if (this.redisAvailable) {
            try {
                const cached = await redisService.getJSON<GlobalModuleAnalytics>(`${ANALYTICS_PREFIX}:global`);
                if (cached) return cached;
            } catch { this.redisAvailable = false; }
        }

        const catalogue = await this.catalogueRepo.find({
            where: { estActif: true },
            order: { ordre: 'ASC' },
        });

        // Pour chaque module, agréger les stats
        const modules: ModuleUsageStats[] = await Promise.all(
            catalogue.map(async (m) => {
                const stats = await this.getModuleStats(m.code);
                return {
                    code: m.code,
                    nom: m.nom,
                    categorie: m.categorie,
                    ...stats,
                };
            })
        );

        const topModules = [...modules].sort((a, b) => b.accesMois - a.accesMois).slice(0, 5);
        const bottomModules = [...modules].sort((a, b) => a.accesMois - b.accesMois).slice(0, 5);
        const modulesSousUtilises = modules.filter((m) => m.accesSemaine < SOUS_UTILISATION_SEUIL).length;

        const result: GlobalModuleAnalytics = {
            modules,
            totalModules: modules.length,
            modulesActifs: modules.filter((m) => m.accesJour > 0).length,
            modulesSousUtilises,
            topModules,
            bottomModules,
        };

        // Cache
        if (this.redisAvailable) {
            try {
                await redisService.setJSON(`${ANALYTICS_PREFIX}:global`, result, ANALYTICS_TTL);
            } catch { this.redisAvailable = false; }
        }

        return result;
    }

    /**
     * Usage des modules pour un établissement spécifique.
     */
    async getEtablissementUsage(etablissementId: string): Promise<EtablissementModuleUsage[]> {
        const entitlements = await entitlementService.checkAll(etablissementId);

        return Promise.all(
            entitlements.map(async (e) => {
                const key = `${ANALYTICS_PREFIX}:${etablissementId}:${e.code}`;
                let dernierAcces: Date | null = null;
                let accesJour = 0;
                let accesSemaine = 0;

                if (this.redisAvailable) {
                    try {
                        const data = await redisService.getJSON<Record<string, any>>(key);
                        if (data) {
                            dernierAcces = data.dernierAcces ? new Date(data.dernierAcces) : null;
                            const today = new Date().toISOString().split('T')[0];
                            accesJour = data[`jour:${today}`] || 0;

                            // Somme des 7 derniers jours
                            for (let i = 0; i < 7; i++) {
                                const d = new Date();
                                d.setDate(d.getDate() - i);
                                const dayKey = `jour:${d.toISOString().split('T')[0]}`;
                                accesSemaine += (data[dayKey] || 0);
                            }
                        }
                    } catch { this.redisAvailable = false; }
                }

                const statut = !e.entitlement.accessible
                    ? 'inactif' as const
                    : accesSemaine < SOUS_UTILISATION_SEUIL
                        ? 'sous-utilise' as const
                        : 'actif' as const;

                return {
                    code: e.code,
                    nom: e.nom,
                    categorie: e.categorie,
                    accessible: e.entitlement.accessible,
                    dernierAcces,
                    accesJour,
                    accesSemaine,
                    statut,
                };
            })
        );
    }

    /**
     * Détail d'usage pour un module spécifique.
     */
    async getModuleUsageDetail(moduleCode: string): Promise<any> {
        const module = await this.catalogueRepo.findOne({ where: { code: moduleCode, estActif: true } });
        if (!module) return null;

        const stats = await this.getModuleStats(moduleCode);

        return {
            code: module.code,
            nom: module.nom,
            categorie: module.categorie,
            ...stats,
        };
    }

    // =============================================
    // HELPERS
    // =============================================

    private async getModuleStats(code: string): Promise<{
        totalAccess: number;
        dernierAcces: Date | null;
        accesJour: number;
        accesSemaine: number;
        accesMois: number;
        tauxActivation: number;
    }> {
        // Pour les stats globales d'un module, on agrégerait depuis toutes les clés
        // Pour l'instant, retourne des valeurs par défaut (le tracking est nouveau)
        return {
            totalAccess: 0,
            dernierAcces: null,
            accesJour: 0,
            accesSemaine: 0,
            accesMois: 0,
            tauxActivation: 0,
        };
    }
}

export const moduleAnalyticsService = new ModuleAnalyticsService();
