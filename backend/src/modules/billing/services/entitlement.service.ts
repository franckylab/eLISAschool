/**
 * ==================================
 * eLISAschool - EntitlementService (Source unique de vérité)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Service centralisé de contrôle d'accès aux modules.
 * Remplace les 3 registres divergents (ModuleRegistryService, ModuleResolutionService
 * cascade propre, ConfigurationService cascade propre).
 *
 * Cascade de résolution :
 *   1. Module CRITIQUE → toujours accessible (bypass total)
 *   2. Abonnement ACTIF vérifié (sinon → blocage)
 *   3. Plan (modulesInclus) → activation
 *   4. Override groupe (ModulesGroupe)
 *   5. Supplément souscrit (AbonnementModule) → activation
 *   6. Catalogue défaut (actifParDefaut)
 *
 * Cache Redis TTL 60s + in-memory fallback + Pub/Sub cross-instance.
 *
 * Refonte SaaS — Unification Modules (migration 200)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ModuleCatalogue, CategorieModule } from '../entities/module-catalogue.entity';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { AbonnementModule } from '../entities/abonnement-module.entity';
import { ModulesGroupe } from '../entities/modules-groupe.entity';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';

// =============================================
// TYPES
// =============================================

export type EntitlementSource = 'critique' | 'plan' | 'groupe' | 'supplement' | 'catalogue' | 'override';

export type EntitlementRaison =
    | 'OK'
    | 'CRITIQUE'
    | 'ABONNEMENT_INACTIF'
    | 'ABONNEMENT_EXPIRE'
    | 'ABONNEMENT_SUSPENDU'
    | 'PLAN_INSUFFICIENT'
    | 'MODULE_DESACTIVE'
    | 'OVERRIDE_DESACTIVE';

export interface EntitlementResult {
    /** Le module est-il accessible ? */
    accessible: boolean;
    /** Le module est-il visible dans le catalogue (même si verrouillé) ? */
    visible: boolean;
    /** Raison du blocage (ou OK/CRITIQUE si accessible) */
    raison: EntitlementRaison;
    /** Message explicatif pour le frontend */
    message?: string;
    /** Source de la résolution */
    source: EntitlementSource;
    /** Code du plan minimal requis (si applicable) */
    planMinimalRequis?: string;
    /** Slug du plan actuel de l'établissement (si applicable) */
    planActuel?: string;
}

export interface EntitlementBatchResult {
    code: string;
    nom: string;
    categorie: CategorieModule;
    entitlement: EntitlementResult;
}

// =============================================
// CONSTANTES CACHE
// =============================================

const CACHE_TTL_MS = 60 * 1000; // 60 secondes
const CACHE_TTL_SEC = 60;
const CACHE_PREFIX = 'entitlement';
const CACHE_BATCH_PREFIX = 'entitlement:batch';
const PUBSUB_CHANNEL = 'entitlement:invalidate';

/** Modules critiques — toujours accessibles, contournent tout gating */
const MODULES_CRITIQUES_BYPASS = new Set([
    'auth', 'utilisateurs', 'configuration', 'notifications',
]);

// =============================================
// CACHE
// =============================================

interface CacheEntree {
    valeur: EntitlementResult;
    expiry: number;
}

interface BatchCacheEntree {
    valeur: EntitlementBatchResult[];
    expiry: number;
}

// =============================================
// SERVICE
// =============================================

export class EntitlementService {
    private catalogueRepo: Repository<ModuleCatalogue>;
    private abonnementRepo: Repository<AbonnementClient>;
    private abonnementModuleRepo: Repository<AbonnementModule>;
    private modulesGroupeRepo: Repository<ModulesGroupe>;
    private groupeLienRepo: Repository<GroupeEtablissementLien>;

    /** Cache in-memory (fallback si Redis indisponible) */
    private cache = new Map<string, CacheEntree>();
    private batchCache = new Map<string, BatchCacheEntree>();
    private redisAvailable = true;

    constructor() {
        this.catalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.abonnementModuleRepo = AppDataSource.getRepository(AbonnementModule);
        this.modulesGroupeRepo = AppDataSource.getRepository(ModulesGroupe);
        this.groupeLienRepo = AppDataSource.getRepository(GroupeEtablissementLien);

        this.initPubSub();
    }

    /** Pub/Sub — invalidation cross-instance */
    private initPubSub(): void {
        try {
            redisService.subscribe(PUBSUB_CHANNEL, (message: { etablissementId?: string }) => {
                const { etablissementId } = message;
                if (etablissementId) {
                    this.cache.delete(etablissementId);
                    this.batchCache.delete(etablissementId);
                } else {
                    this.cache.clear();
                    this.batchCache.clear();
                }
                logger.debug(`[Entitlement] Invalidation cross-instance${etablissementId ? ` pour ${etablissementId}` : ' (global)'}`);
            });
        } catch {
            logger.warn('[Entitlement] Pub/Sub init échoué (fonctionnel en mode single-instance)');
        }
    }

    /** Invalider le cache (local + Redis + cross-instance) */
    async invalidate(etablissementId?: string): Promise<void> {
        if (etablissementId) {
            this.cache.delete(etablissementId);
            this.batchCache.delete(etablissementId);
        } else {
            this.cache.clear();
            this.batchCache.clear();
        }

        try {
            if (etablissementId) {
                await redisService.del(`${CACHE_PREFIX}:${etablissementId}`);
                await redisService.delByPattern(`${CACHE_BATCH_PREFIX}:*`);
            } else {
                await redisService.delByPattern(`${CACHE_PREFIX}:*`);
                await redisService.delByPattern(`${CACHE_BATCH_PREFIX}:*`);
            }
        } catch {
            this.redisAvailable = false;
        }

        try {
            await redisService.publish(PUBSUB_CHANNEL, { etablissementId });
        } catch {
            // Silencieux
        }
    }

    // =============================================
    // CHECK INDIVIDUEL
    // =============================================

    /**
     * Vérifie l'entitlement d'un module pour un établissement.
     * Source unique de vérité pour le gating des modules.
     */
    async check(etablissementId: string, moduleCode: string): Promise<EntitlementResult> {
        // 0. Module critique bypass (toujours accessible)
        if (MODULES_CRITIQUES_BYPASS.has(moduleCode)) {
            return {
                accessible: true,
                visible: true,
                raison: 'CRITIQUE',
                source: 'critique',
            };
        }

        // 1. Vérifier si le module existe dans le catalogue
        const catalogueModule = await this.catalogueRepo.findOne({
            where: { code: moduleCode, estActif: true },
        });

        if (!catalogueModule) {
            return {
                accessible: false,
                visible: false,
                raison: 'MODULE_DESACTIVE',
                message: `Module "${moduleCode}" non trouvé ou désactivé`,
                source: 'catalogue',
            };
        }

        // Module CRITIQUE (catégorie) → toujours accessible
        if (catalogueModule.categorie === CategorieModule.CRITIQUE) {
            return {
                accessible: true,
                visible: true,
                raison: 'CRITIQUE',
                source: 'critique',
            };
        }

        // 2. Vérifier l'abonnement actif
        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId, statut: StatutAbonnement.ACTIF },
            relations: ['plan'],
        });

        if (!abonnement) {
            // Pas d'abonnement actif → vérifier si le module est actif par défaut
            if (catalogueModule.actifParDefaut) {
                return {
                    accessible: true,
                    visible: true,
                    raison: 'OK',
                    source: 'catalogue',
                };
            }
            return {
                accessible: false,
                visible: true,
                raison: 'ABONNEMENT_INACTIF',
                message: 'Un abonnement actif est requis pour accéder à ce module',
                source: 'catalogue',
                planMinimalRequis: catalogueModule.planMinimal || undefined,
            };
        }

        // Abonnement expiré ou suspendu
        if (abonnement.statut === StatutAbonnement.EXPIRE) {
            return {
                accessible: false,
                visible: true,
                raison: 'ABONNEMENT_EXPIRE',
                message: 'Votre abonnement a expiré. Renouvelez pour accéder aux modules premium.',
                source: 'catalogue',
                planActuel: abonnement.plan?.slug,
            };
        }
        if (abonnement.statut === StatutAbonnement.SUSPENDU) {
            return {
                accessible: false,
                visible: true,
                raison: 'ABONNEMENT_SUSPENDU',
                message: 'Votre abonnement est suspendu. Contactez le support.',
                source: 'catalogue',
                planActuel: abonnement.plan?.slug,
            };
        }

        // 3. Vérifier si le plan inclut le module
        const planInclus = new Set<string>(abonnement.plan?.modulesInclus || []);
        if (planInclus.has(moduleCode)) {
            return {
                accessible: true,
                visible: true,
                raison: 'OK',
                source: 'plan',
                planActuel: abonnement.plan?.slug,
            };
        }

        // 4. Vérifier l'override groupe
        const groupeLien = await this.groupeLienRepo.findOne({
            where: { etablissementId },
        });

        if (groupeLien?.groupeId) {
            const modulesGroupe = await this.modulesGroupeRepo.find({
                where: { groupeEtablissementId: groupeLien.groupeId },
            });

            for (const mg of modulesGroupe) {
                if (mg.module?.code === moduleCode) {
                    if (mg.actif) {
                        return {
                            accessible: true,
                            visible: true,
                            raison: 'OK',
                            source: 'groupe',
                            planActuel: abonnement.plan?.slug,
                        };
                    } else {
                        return {
                            accessible: false,
                            visible: true,
                            raison: 'OVERRIDE_DESACTIVE',
                            message: 'Module désactivé au niveau du groupe',
                            source: 'groupe',
                            planActuel: abonnement.plan?.slug,
                        };
                    }
                }
            }
        }

        // 5. Vérifier les suppléments souscrits
        const supplements = await this.abonnementModuleRepo.find({
            where: { actif: true, etablissementId },
            relations: ['moduleOptionnel'],
        });

        for (const sup of supplements) {
            if (sup.moduleOptionnel?.slug === moduleCode) {
                return {
                    accessible: true,
                    visible: true,
                    raison: 'OK',
                    source: 'supplement',
                    planActuel: abonnement.plan?.slug,
                };
            }
        }

        // 6. Vérifier le plan minimal requis
        if (catalogueModule.planMinimal) {
            const planRangs: Record<string, number> = {
                'gratuit': 0, 'starter': 1, 'standard': 2, 'pro': 3, 'enterprise': 4,
            };
            const planActuelRang = planRangs[abonnement.plan?.slug || 'gratuit'] ?? 0;
            const planRequisRang = planRangs[catalogueModule.planMinimal] ?? 0;

            if (planActuelRang < planRequisRang) {
                return {
                    accessible: false,
                    visible: true,
                    raison: 'PLAN_INSUFFICIENT',
                    message: `Plan "${catalogueModule.planMinimal}" ou supérieur requis. Plan actuel : "${abonnement.plan?.nom || 'N/A'}"`,
                    source: 'catalogue',
                    planMinimalRequis: catalogueModule.planMinimal,
                    planActuel: abonnement.plan?.slug,
                };
            }
        }

        // 7. Défaut catalogue (actifParDefaut)
        if (catalogueModule.actifParDefaut) {
            return {
                accessible: true,
                visible: true,
                raison: 'OK',
                source: 'catalogue',
                planActuel: abonnement.plan?.slug,
            };
        }

        // 8. Module non accessible
        return {
            accessible: false,
            visible: true,
            raison: 'MODULE_DESACTIVE',
            message: catalogueModule.estSouscriptible
                ? 'Module disponible en supplément. Contactez-nous pour y accéder.'
                : 'Module non disponible pour votre plan actuel.',
            source: 'catalogue',
            planMinimalRequis: catalogueModule.planMinimal || undefined,
            planActuel: abonnement.plan?.slug,
        };
    }

    // =============================================
    // CHECK BATCH (tous les modules d'un établissement)
    // =============================================

    /**
     * Vérifie l'entitlement de tous les modules pour un établissement.
     * Résultat enrichi avec les données du catalogue.
     */
    async checkAll(etablissementId: string): Promise<EntitlementBatchResult[]> {
        // Cache Redis
        const cacheKey = `${CACHE_BATCH_PREFIX}:${etablissementId}`;
        if (this.redisAvailable) {
            try {
                const cached = await redisService.getJSON<EntitlementBatchResult[]>(cacheKey);
                if (cached) return cached;
            } catch {
                this.redisAvailable = false;
            }
        }

        // Cache in-memory
        const memCache = this.batchCache.get(etablissementId);
        if (memCache && Date.now() < memCache.expiry) return memCache.valeur;

        // Résolution
        const catalogue = await this.catalogueRepo.find({
            where: { estActif: true },
            order: { ordre: 'ASC' },
        });

        const results: EntitlementBatchResult[] = [];
        for (const module of catalogue) {
            const entitlement = await this.check(etablissementId, module.code);
            results.push({
                code: module.code,
                nom: module.nom,
                categorie: module.categorie,
                entitlement,
            });
        }

        // Stocker cache
        if (this.redisAvailable) {
            try {
                await redisService.setJSON(cacheKey, results, CACHE_TTL_SEC);
            } catch {
                this.redisAvailable = false;
            }
        }
        this.batchCache.set(etablissementId, {
            valeur: results,
            expiry: Date.now() + CACHE_TTL_MS,
        });

        return results;
    }

    // =============================================
    // HELPERS
    // =============================================

    /**
     * Vérifie rapidement si un module est accessible (boolean).
     */
    async isAccessible(etablissementId: string, moduleCode: string): Promise<boolean> {
        const result = await this.check(etablissementId, moduleCode);
        return result.accessible;
    }

    /**
     * Récupère le statut d'abonnement d'un établissement.
     */
    async getStatutAbonnement(etablissementId: string): Promise<{
        actif: boolean;
        statut: StatutAbonnement | 'AUCUN';
        planSlug?: string;
        planNom?: string;
    }> {
        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId },
            relations: ['plan'],
            order: { createdAt: 'DESC' },
        });

        if (!abonnement) {
            return { actif: false, statut: 'AUCUN' };
        }

        return {
            actif: abonnement.statut === StatutAbonnement.ACTIF,
            statut: abonnement.statut,
            planSlug: abonnement.plan?.slug,
            planNom: abonnement.plan?.nom,
        };
    }
}

// =============================================
// SINGLETON
// =============================================

export const entitlementService = new EntitlementService();
export default EntitlementService;
