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
 *   1. Module BASE → toujours accessible (bypass total)
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

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ModuleCatalogue, CategorieModule } from '../entities/module-catalogue.entity';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { AbonnementModule } from '../entities/abonnement-module.entity';
import { ModulesGroupe } from '../entities/modules-groupe.entity';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import { FeatureFlagService } from './feature-flags.service';
import { FeatureFlagDefinition } from '../entities/feature-flag-definition.entity';

// =============================================
// TYPES
// =============================================

export type EntitlementSource = 'base' | 'essai' | 'plan' | 'groupe' | 'supplement' | 'catalogue' | 'override';

export type EntitlementRaison =
    | 'OK'
    | 'BASE'
    | 'ESSAI_ACTIF'
    | 'ABONNEMENT_INACTIF'
    | 'ABONNEMENT_EXPIRE'
    | 'ABONNEMENT_SUSPENDU'
    | 'DEGRADATION_LECTURE_SEULE'
    | 'DEGRADATION_VERROUILLE'
    | 'DEGRADATION_ARCHIVE'
    | 'PLAN_INSUFFICIENT'
    | 'MODULE_DESACTIVE'
    | 'OVERRIDE_DESACTIVE';

export interface EntitlementResult {
    /** Le module est-il accessible ? */
    accessible: boolean;
    /** Le module est-il visible dans le catalogue (même si verrouillé) ? */
    visible: boolean;
    /** Raison du blocage (ou OK/BASE si accessible) */
    raison: EntitlementRaison;
    /** Message explicatif pour le frontend */
    message?: string;
    /** Source de la résolution */
    source: EntitlementSource;
    /** Code du plan minimal requis (si applicable) */
    planMinimalRequis?: string;
    /** Slug du plan actuel de l'établissement (si applicable) */
    planActuel?: string;
    /** Mode lecture seule (dégradation J0-J15) — accessible pour GET, bloqué pour POST/PUT/DELETE */
    lectureSeule?: boolean;
}

export interface EntitlementBatchResult {
    code: string;
    nom: string;
    icone: string;
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

/** Durée période d'essai : 14 jours */
const ESSAI_DUREE_JOURS = 14;

/** Phases de dégradation gracieuse (en jours après dateExpirationReelle) */
const DEGRADATION_PHASES = {
    /** J0–J15 : lecture seule (GET OK, POST/PUT/DELETE bloqués) */
    LECTURE_SEULE_JOURS: 15,
    /** J15–J30 : modules verrouillés + message upsell */
    VERROUILLE_JOURS: 30,
    /** J30+ : données archivées */
};

/** Modules de base — toujours accessibles, contournent tout gating */
const MODULES_BASE_BYPASS = new Set([
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
    private definitionRepo: Repository<FeatureFlagDefinition>;
    private featureFlagService: FeatureFlagService;

    /** Cache in-memory (fallback si Redis indisponible) */
    private cache = new Map<string, CacheEntree>();
    private batchCache = new Map<string, BatchCacheEntree>();
    private redisAvailable = true;

    /** P1.3 — Dernier statut cache (HIT/MISS/STALE) pour header X-Cache-Status */
    private _lastCacheStatus: 'HIT' | 'MISS' | 'STALE' = 'MISS';

    /** Accesseur du dernier statut cache (utilisé par les controllers pour X-Cache-Status) */
    get lastCacheStatus(): 'HIT' | 'MISS' | 'STALE' {
        return this._lastCacheStatus;
    }

    constructor() {
        this.catalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.abonnementModuleRepo = AppDataSource.getRepository(AbonnementModule);
        this.modulesGroupeRepo = AppDataSource.getRepository(ModulesGroupe);
        this.groupeLienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
        this.definitionRepo = AppDataSource.getRepository(FeatureFlagDefinition);
        this.featureFlagService = new FeatureFlagService();

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

    /** Invalider le cache — invalidation SYNCHRONE in-memory + Redis async (fire-and-forget) */
    invalidate(etablissementId?: string): void {
        // 1. Invalidation SYNCHRONE du cache in-memory (garanti immédiat)
        if (etablissementId) {
            this.cache.delete(etablissementId);
            this.batchCache.delete(etablissementId);
        } else {
            this.cache.clear();
            this.batchCache.clear();
        }

        // 2. Invalidation Redis async (fire-and-forget)
        this.invalidateRedisAsync(etablissementId);
    }

    /** Invalidation Redis asynchrone + Pub/Sub cross-instance */
    private async invalidateRedisAsync(etablissementId?: string): Promise<void> {
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
     *
     * Cascade :
     *   0. Module BASE (code) → bypass total
     *   0.5 Période d'essai (statut ESSAI, 14 jours) → tous modules accessibles
     *   1. Catalogue (module existe + catégorie BASE)
     *   2. Abonnement (ACTIF ou ESSAI) + dégradation gracieuse
     *   3. Plan (modulesInclus)
     *   4. Override groupe
     *   5. Supplément souscrit
     *   6. Plan minimal requis
     *   7. Défaut catalogue (actifParDefaut)
     */
    async check(etablissementId: string, moduleCode: string): Promise<EntitlementResult> {
        // 0. Module base bypass (toujours accessible)
        if (MODULES_BASE_BYPASS.has(moduleCode)) {
            return {
                accessible: true,
                visible: true,
                raison: 'BASE',
                source: 'base',
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

        // Module BASE (catégorie) → toujours accessible
        if (catalogueModule.categorie === CategorieModule.BASE) {
            return {
                accessible: true,
                visible: true,
                raison: 'BASE',
                source: 'base',
            };
        }

        // 2. Vérifier l'abonnement (ACTIF ou ESSAI)
        const abonnement = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]),
            },
            relations: ['plan'],
        });

        // --- P1.1 — Période d'essai automatique (14 jours) ---
        if (abonnement?.statut === StatutAbonnement.ESSAI) {
            const now = new Date();
            if (abonnement.periodeEssaiFin && now < abonnement.periodeEssaiFin) {
                // En période d'essai → tous modules accessibles
                return {
                    accessible: true,
                    visible: true,
                    raison: 'ESSAI_ACTIF',
                    message: `Période d'essai active (jusqu'au ${abonnement.periodeEssaiFin.toLocaleDateString('fr-FR')})`,
                    source: 'essai',
                    planActuel: abonnement.plan?.slug,
                };
            }
            // Essai expiré → traiter comme expiré
            return {
                accessible: false,
                visible: true,
                raison: 'ABONNEMENT_EXPIRE',
                message: 'Votre période d\'essai est terminée. Souscrivez à un plan pour continuer.',
                source: 'catalogue',
                planActuel: abonnement.plan?.slug,
            };
        }

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

        // --- P1.2 — Dégradation gracieuse (30 jours) ---
        if (abonnement.statut === StatutAbonnement.EXPIRE && abonnement.dateExpirationReelle) {
            const joursDepuisExpiration = Math.floor(
                (Date.now() - new Date(abonnement.dateExpirationReelle).getTime()) / (1000 * 60 * 60 * 24),
            );

            if (joursDepuisExpiration <= DEGRADATION_PHASES.LECTURE_SEULE_JOURS) {
                // J0–J15 : lecture seule (accessible pour GET, bloqué pour mutations)
                return {
                    accessible: true,
                    visible: true,
                    raison: 'DEGRADATION_LECTURE_SEULE',
                    message: `Mode lecture seule (${joursDepuisExpiration}/15 jours). Renouvelez pour retrouver l'accès complet.`,
                    source: 'catalogue',
                    planActuel: abonnement.plan?.slug,
                    lectureSeule: true,
                };
            }
            if (joursDepuisExpiration <= DEGRADATION_PHASES.VERROUILLE_JOURS) {
                // J15–J30 : modules verrouillés + message upsell
                return {
                    accessible: false,
                    visible: true,
                    raison: 'DEGRADATION_VERROUILLE',
                    message: `Accès verrouillé depuis ${joursDepuisExpiration} jours. Renouvelez avant J30 pour éviter l'archivage.`,
                    source: 'catalogue',
                    planActuel: abonnement.plan?.slug,
                };
            }
            // J30+ : données archivées
            return {
                accessible: false,
                visible: false,
                raison: 'DEGRADATION_ARCHIVE',
                message: 'Vos données ont été archivées. Contactez le support pour restaurer.',
                source: 'catalogue',
                planActuel: abonnement.plan?.slug,
            };
        }

        // Abonnement expiré (sans dateExpirationReelle) ou suspendu
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
     * Optimisé P3.2 : charge toutes les données en une seule requête batch (évite N+1).
     */
    async checkAll(etablissementId: string): Promise<EntitlementBatchResult[]> {
        // Cache Redis
        const cacheKey = `${CACHE_BATCH_PREFIX}:${etablissementId}`;
        if (this.redisAvailable) {
            try {
                const cached = await redisService.getJSON<EntitlementBatchResult[]>(cacheKey);
                if (cached) {
                    this._lastCacheStatus = 'HIT';
                    return cached;
                }
            } catch {
                this.redisAvailable = false;
            }
        }

        // Cache in-memory
        const memCache = this.batchCache.get(etablissementId);
        if (memCache && Date.now() < memCache.expiry) {
            this._lastCacheStatus = 'HIT';
            return memCache.valeur;
        }

        // Vérifier si le cache in-memory est expiré (STALE)
        if (memCache && Date.now() >= memCache.expiry) {
            this._lastCacheStatus = 'STALE';
        } else {
            this._lastCacheStatus = 'MISS';
        }

        // P3.2 — Précharger toutes les données en parallèle (1 requête chacune)
        const [catalogue, abonnement, groupeLien, supplements, modulesGroupe] = await Promise.all([
            this.catalogueRepo.find({ where: { estActif: true }, order: { ordre: 'ASC' } }),
            this.abonnementRepo.findOne({
                where: { etablissementId, statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]) },
                relations: ['plan'],
            }),
            this.groupeLienRepo.findOne({ where: { etablissementId } }),
            this.abonnementModuleRepo.find({
                where: { actif: true, etablissementId },
                relations: ['moduleOptionnel'],
            }),
            null as any, // modulesGroupe chargé conditionnellement ci-dessous
        ]);

        // Charger les modules groupe seulement si l'établissement appartient à un groupe
        let modulesGroupeData: ModulesGroupe[] = [];
        if (groupeLien?.groupeId) {
            modulesGroupeData = await this.modulesGroupeRepo.find({
                where: { groupeEtablissementId: groupeLien.groupeId },
            });
        }

        // Construire les sets de résolution une seule fois
        const planInclus = new Set<string>(abonnement?.plan?.modulesInclus || []);
        const supplementsSouscrits = new Set<string>();
        for (const sup of supplements) {
            if (sup.moduleOptionnel?.slug) supplementsSouscrits.add(sup.moduleOptionnel.slug);
        }
        const groupeOverrides = new Map<string, boolean>();
        for (const mg of modulesGroupeData) {
            if (mg.module?.code) groupeOverrides.set(mg.module.code, mg.actif);
        }

        // Résoudre chaque module en mémoire (pas de requête DB supplémentaire)
        const results: EntitlementBatchResult[] = catalogue.map((module) => {
            const entitlement = this.resolveInMemory(
                module, etablissementId, abonnement, planInclus,
                groupeOverrides, supplementsSouscrits,
            );
            return {
                code: module.code,
                nom: module.nom,
                icone: module.icone || '',
                categorie: module.categorie,
                entitlement,
            };
        });

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

    /**
     * Résolution en mémoire pour un module (utilisé par checkAll batch).
     * Pas de requête DB — utilise les données préchargées.
     */
    private resolveInMemory(
        module: ModuleCatalogue,
        etablissementId: string,
        abonnement: AbonnementClient | null,
        planInclus: Set<string>,
        groupeOverrides: Map<string, boolean>,
        supplementsSouscrits: Set<string>,
    ): EntitlementResult {
        // 0. Module base bypass
        if (MODULES_BASE_BYPASS.has(module.code)) {
            return { accessible: true, visible: true, raison: 'BASE', source: 'base' };
        }

        // Module BASE (catégorie)
        if (module.categorie === CategorieModule.BASE) {
            return { accessible: true, visible: true, raison: 'BASE', source: 'base' };
        }

        // Période d'essai
        if (abonnement?.statut === StatutAbonnement.ESSAI) {
            const now = new Date();
            if (abonnement.periodeEssaiFin && now < abonnement.periodeEssaiFin) {
                return {
                    accessible: true, visible: true, raison: 'ESSAI_ACTIF',
                    message: `Période d'essai active (jusqu'au ${abonnement.periodeEssaiFin.toLocaleDateString('fr-FR')})`,
                    source: 'essai', planActuel: abonnement.plan?.slug,
                };
            }
            return {
                accessible: false, visible: true, raison: 'ABONNEMENT_EXPIRE',
                message: 'Votre période d\'essai est terminée. Souscrivez à un plan pour continuer.',
                source: 'catalogue', planActuel: abonnement.plan?.slug,
            };
        }

        if (!abonnement) {
            if (module.actifParDefaut) {
                return { accessible: true, visible: true, raison: 'OK', source: 'catalogue' };
            }
            return {
                accessible: false, visible: true, raison: 'ABONNEMENT_INACTIF',
                message: 'Un abonnement actif est requis pour accéder à ce module',
                source: 'catalogue', planMinimalRequis: module.planMinimal || undefined,
            };
        }

        // Dégradation gracieuse
        if (abonnement.statut === StatutAbonnement.EXPIRE && abonnement.dateExpirationReelle) {
            const jours = Math.floor((Date.now() - new Date(abonnement.dateExpirationReelle).getTime()) / (1000 * 60 * 60 * 24));
            if (jours <= DEGRADATION_PHASES.LECTURE_SEULE_JOURS) {
                return {
                    accessible: true, visible: true, raison: 'DEGRADATION_LECTURE_SEULE',
                    message: `Mode lecture seule (${jours}/15 jours). Renouvelez pour retrouver l'accès complet.`,
                    source: 'catalogue', planActuel: abonnement.plan?.slug, lectureSeule: true,
                };
            }
            if (jours <= DEGRADATION_PHASES.VERROUILLE_JOURS) {
                return {
                    accessible: false, visible: true, raison: 'DEGRADATION_VERROUILLE',
                    message: `Accès verrouillé depuis ${jours} jours. Renouvelez avant J30 pour éviter l'archivage.`,
                    source: 'catalogue', planActuel: abonnement.plan?.slug,
                };
            }
            return {
                accessible: false, visible: false, raison: 'DEGRADATION_ARCHIVE',
                message: 'Vos données ont été archivées. Contactez le support pour restaurer.',
                source: 'catalogue', planActuel: abonnement.plan?.slug,
            };
        }

        if (abonnement.statut === StatutAbonnement.EXPIRE) {
            return {
                accessible: false, visible: true, raison: 'ABONNEMENT_EXPIRE',
                message: 'Votre abonnement a expiré. Renouvelez pour accéder aux modules premium.',
                source: 'catalogue', planActuel: abonnement.plan?.slug,
            };
        }
        if (abonnement.statut === StatutAbonnement.SUSPENDU) {
            return {
                accessible: false, visible: true, raison: 'ABONNEMENT_SUSPENDU',
                message: 'Votre abonnement est suspendu. Contactez le support.',
                source: 'catalogue', planActuel: abonnement.plan?.slug,
            };
        }

        // Plan
        if (planInclus.has(module.code)) {
            return { accessible: true, visible: true, raison: 'OK', source: 'plan', planActuel: abonnement.plan?.slug };
        }

        // Override groupe
        if (groupeOverrides.has(module.code)) {
            if (groupeOverrides.get(module.code)!) {
                return { accessible: true, visible: true, raison: 'OK', source: 'groupe', planActuel: abonnement.plan?.slug };
            }
            return {
                accessible: false, visible: true, raison: 'OVERRIDE_DESACTIVE',
                message: 'Module désactivé au niveau du groupe',
                source: 'groupe', planActuel: abonnement.plan?.slug,
            };
        }

        // Supplément
        if (supplementsSouscrits.has(module.code)) {
            return { accessible: true, visible: true, raison: 'OK', source: 'supplement', planActuel: abonnement.plan?.slug };
        }

        // Plan minimal
        if (module.planMinimal) {
            const planRangs: Record<string, number> = { 'gratuit': 0, 'starter': 1, 'standard': 2, 'pro': 3, 'enterprise': 4 };
            const rangActuel = planRangs[abonnement.plan?.slug || 'gratuit'] ?? 0;
            const rangRequis = planRangs[module.planMinimal] ?? 0;
            if (rangActuel < rangRequis) {
                return {
                    accessible: false, visible: true, raison: 'PLAN_INSUFFICIENT',
                    message: `Plan "${module.planMinimal}" ou supérieur requis. Plan actuel : "${abonnement.plan?.nom || 'N/A'}"`,
                    source: 'catalogue', planMinimalRequis: module.planMinimal, planActuel: abonnement.plan?.slug,
                };
            }
        }

        // Défaut catalogue
        if (module.actifParDefaut) {
            return { accessible: true, visible: true, raison: 'OK', source: 'catalogue', planActuel: abonnement.plan?.slug };
        }

        // Non accessible
        return {
            accessible: false, visible: true, raison: 'MODULE_DESACTIVE',
            message: module.estSouscriptible
                ? 'Module disponible en supplément. Contactez-nous pour y accéder.'
                : 'Module non disponible pour votre plan actuel.',
            source: 'catalogue', planMinimalRequis: module.planMinimal || undefined, planActuel: abonnement.plan?.slug,
        };
    }

    // =============================================
    // CATALOGUE (transféré depuis ModuleResolutionService)
    // =============================================

    /**
     * Catalogue complet des modules actifs (plateforme).
     * Transféré depuis ModuleResolutionService (fusion P0.1).
     */
    async getCatalogue(): Promise<ModuleCatalogue[]> {
        return this.catalogueRepo.find({
            where: { estActif: true },
            order: { ordre: 'ASC' },
        });
    }

    /**
     * Vérifie si un module est facturable (PREMIUM/ADDON).
     * Transféré depuis ModuleResolutionService (fusion P0.1).
     */
    async isModuleFacturable(code: string): Promise<boolean> {
        const entree = await this.catalogueRepo.findOne({ where: { code, estActif: true } });
        return entree?.estFacturable ?? false;
    }

    /**
     * Vérifie si un module est réellement souscrit (source !== 'catalogue').
     * Un module actifParDefaut n'est pas "souscrit" — il est offert par défaut.
     * Transféré depuis ModuleResolutionService (fusion P0.1).
     */
    async isModuleSouscrit(etablissementId: string, code: string): Promise<boolean> {
        const result = await this.check(etablissementId, code);
        return result.accessible && result.source !== 'catalogue' && result.source !== 'base';
    }

    /**
     * Résout tous les modules d'un établissement avec les données complètes du catalogue.
     * Enrichit checkAll() avec les métadonnées catalogue (prix, description, etc.).
     * Remplace moduleResolutionService.getResolvedModules() (fusion P0.1).
     */
    async getResolvedModules(etablissementId: string): Promise<any[]> {
        const [catalogue, entitlements] = await Promise.all([
            this.catalogueRepo.find({ where: { estActif: true }, order: { ordre: 'ASC' } }),
            this.checkAll(etablissementId),
        ]);

        const entitlementMap = new Map(entitlements.map((e) => [e.code, e.entitlement]));

        return catalogue.map((m) => {
            const ent = entitlementMap.get(m.code);
            return {
                id: m.id,
                code: m.code,
                nom: m.nom,
                nomEn: m.nomEn,
                description: m.description,
                categorie: m.categorie,
                icone: m.icone,
                prixMensuel: m.prixMensuel,
                prixAnnuel: m.prixAnnuel,
                estFacturable: m.estFacturable,
                estSouscriptible: m.estSouscriptible,
                actifParDefaut: m.actifParDefaut,
                planMinimal: m.planMinimal,
                dependencies: m.dependencies,
                ordre: m.ordre,
                estActif: m.estActif,
                actif: ent?.accessible ?? m.actifParDefaut,
                source: ent?.source || 'catalogue',
                entitlement: ent,
            };
        });
    }

    // =============================================
    // CHECK CAPABILITY (unification modules + feature flags)
    // =============================================

    /**
     * Point d'entrée unifié pour vérifier une capacité (module OU feature flag).
     * 
     * - Si `capability` correspond à un code module du catalogue → utilise check()
     * - Si `capability` correspond à une clé de feature flag → résolution via FeatureFlagService
     * - Retourne un EntitlementResult dans les deux cas
     * 
     * Migration 210 — Refonte Feature Flags (R1 unification)
     */
    async checkCapability(etablissementId: string, capability: string): Promise<EntitlementResult> {
        // 1. Vérifier si c'est un module du catalogue
        const moduleInCatalogue = await this.catalogueRepo.findOne({
            where: { code: capability },
            select: ['code'],
        });

        if (moduleInCatalogue) {
            return this.check(etablissementId, capability);
        }

        // 2. Vérifier si c'est un feature flag défini
        const definition = await this.definitionRepo.findOne({
            where: { cle: capability },
        });

        if (definition) {
            // Vérifier le flag via FeatureFlagService (avec rollout + segments)
            const enabled = await this.featureFlagService.isEnabledWithRollout(capability, etablissementId);

            if (enabled) {
                return {
                    accessible: true,
                    visible: true,
                    raison: 'OK',
                    source: 'plan',
                    message: `Feature flag '${definition.label}' activé`,
                };
            }

            // Flag désactivé — déterminer la raison
            if (!definition.estActif) {
                return {
                    accessible: false,
                    visible: true,
                    raison: 'MODULE_DESACTIVE',
                    message: `Feature flag '${definition.label}' désactivé au niveau plateforme`,
                    source: 'catalogue',
                };
            }

            // Vérifier le plan minimal
            if (definition.planMinimal) {
                const abonnement = await this.abonnementRepo.findOne({
                    where: { etablissementId, statut: StatutAbonnement.ACTIF },
                    relations: ['plan'],
                });
                const planRangs: Record<string, number> = {
                    'gratuit': 0, 'starter': 1, 'standard': 2, 'pro': 3, 'enterprise': 4,
                };
                const planActuelRang = planRangs[abonnement?.plan?.slug || 'gratuit'] ?? 0;
                const planRequisRang = planRangs[definition.planMinimal] ?? 0;

                if (planActuelRang < planRequisRang) {
                    return {
                        accessible: false,
                        visible: true,
                        raison: 'PLAN_INSUFFICIENT',
                        message: `Plan "${definition.planMinimal}" ou supérieur requis pour '${definition.label}'`,
                        source: 'catalogue',
                        planMinimalRequis: definition.planMinimal,
                        planActuel: abonnement?.plan?.slug,
                    };
                }
            }

            return {
                accessible: false,
                visible: true,
                raison: 'MODULE_DESACTIVE',
                message: `Feature flag '${definition.label}' non activé pour cet établissement`,
                source: 'catalogue',
                planMinimalRequis: definition.planMinimal || undefined,
            };
        }

        // 3. Ni module ni flag connu → inaccessible
        return {
            accessible: false,
            visible: false,
            raison: 'MODULE_DESACTIVE',
            message: `Capacité '${capability}' non reconnue`,
            source: 'catalogue',
        };
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
