/**
 * ==================================
 * eLISAschool - EntitlementService v3 (Source unique de vérité)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Moteur plan-centrique de contrôle d'accès (Refonte v3, migration 213).
 * Invariant : TOUT tenant possède au moins un plan actif ; aucun accès
 * sans abonnement (faille actifParDefaut fermée — ex-problème P9).
 *
 * Cascade 4 questions déterministes :
 *   Q1. Module critique (modules_catalogue.estCritique) → bypass total
 *   Q2. Abonnement ACTIF / ESSAI ? (EXPIRE → phases de la stratégie)
 *   Q3. Inclus par le plan (plan.entitlements.modules) ?
 *   Q4. Override ou souscription (groupe, supplément AbonnementModule) ?
 *   Sinon → PLAN_INSUFFICIENT / MODULE_DESACTIVE
 *
 * Corrections v3 :
 *   - P1 : EXPIRE réellement chargé (dégradation plus code mort)
 *   - P2 : rangs lus depuis plans_abonnement.rang (plus de hardcode ×3)
 *   - P10 : bypass critique piloté par la donnée estCritique
 *
 * Cache Redis TTL 60s + in-memory fallback + Pub/Sub cross-instance.
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ModuleCatalogue } from '../entities/module-catalogue.entity';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { PlanAbonnement } from '../entities/plan-abonnement.entity';
import { AbonnementModule } from '../entities/abonnement-module.entity';
import { ModulesGroupe } from '../entities/modules-groupe.entity';
import { StrategieExpiration, ComportementPhase } from '../entities/strategie-expiration.entity';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import { FeatureFlagService } from './feature-flags.service';
import { FeatureFlagDefinition } from '../entities/feature-flag-definition.entity';

// =============================================
// TYPES
// =============================================

export type EntitlementSource = 'critique' | 'essai' | 'plan' | 'groupe' | 'supplement' | 'catalogue' | 'override';

export type EntitlementRaison =
    | 'OK'
    | 'CRITIQUE'
    | 'ESSAI_ACTIF'
    | 'AUCUN_PLAN'
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
    /** Mode lecture seule (phase de dégradation) — GET OK, mutations bloquées */
    lectureSeule?: boolean;
}

export interface EntitlementBatchResult {
    code: string;
    nom: string;
    icone: string;
    categorie: string;
    entitlement: EntitlementResult;
}

/** Résultat de résolution d'expiration d'abonnement */
export interface ResolutionExpiration {
    phase: 'ACTIVE' | 'LECTURE_SEULE' | 'VERROUILLE' | 'ARCHIVE';
    joursDepuisExpiration: number;
    nomPhase?: string;
}

// =============================================
// CONSTANTES CACHE
// =============================================

const CACHE_TTL_MS = 60 * 1000; // 60 secondes
const CACHE_TTL_SEC = 60;
const CACHE_PREFIX = 'entitlement';
const CACHE_BATCH_PREFIX = 'entitlement:batch';
const PUBSUB_CHANNEL = 'entitlement:invalidate';

/** Phases de dégradation par défaut si aucune stratégie en base */
const PHASES_FALLBACK = [
    { nom: 'LECTURE_SEULE', jours: 15, comportement: ComportementPhase.READ_ONLY },
    { nom: 'VERROUILLE', jours: 15, comportement: ComportementPhase.LOCKED },
    { nom: 'ARCHIVE', jours: null, comportement: ComportementPhase.ARCHIVED },
];

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
    private planRepo: Repository<PlanAbonnement>;
    private abonnementModuleRepo: Repository<AbonnementModule>;
    private modulesGroupeRepo: Repository<ModulesGroupe>;
    private groupeLienRepo: Repository<GroupeEtablissementLien>;
    private strategieRepo: Repository<StrategieExpiration>;
    private definitionRepo: Repository<FeatureFlagDefinition>;
    private featureFlagService: FeatureFlagService;

    /** Cache in-memory (fallback si Redis indisponible) */
    private cache = new Map<string, CacheEntree>();
    private batchCache = new Map<string, BatchCacheEntree>();
    private redisAvailable = true;

    /** Cache des métadonnées plateforme (rangs plans, stratégies) — TTL 60s */
    private rangsPlansCache: { valeur: Map<string, number>; expiry: number } | null = null;
    private strategiesCache: { valeur: StrategieExpiration[]; expiry: number } | null = null;

    /** P1.3 — Dernier statut cache (HIT/MISS/STALE) pour header X-Cache-Status */
    private _lastCacheStatus: 'HIT' | 'MISS' | 'STALE' = 'MISS';

    /** Accesseur du dernier statut cache (utilisé par les controllers pour X-Cache-Status) */
    get lastCacheStatus(): 'HIT' | 'MISS' | 'STALE' {
        return this._lastCacheStatus;
    }

    constructor() {
        this.catalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.planRepo = AppDataSource.getRepository(PlanAbonnement);
        this.abonnementModuleRepo = AppDataSource.getRepository(AbonnementModule);
        this.modulesGroupeRepo = AppDataSource.getRepository(ModulesGroupe);
        this.groupeLienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
        this.strategieRepo = AppDataSource.getRepository(StrategieExpiration);
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
                    this.rangsPlansCache = null;
                    this.strategiesCache = null;
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
            this.rangsPlansCache = null;
            this.strategiesCache = null;
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
    // MÉTADONNÉES PLATEFORME (rangs, stratégies)
    // =============================================

    /** Rangs des plans — lus depuis la donnée (ex-P2 : plus de hardcode) */
    private async getRangsPlans(): Promise<Map<string, number>> {
        if (this.rangsPlansCache && Date.now() < this.rangsPlansCache.expiry) {
            return this.rangsPlansCache.valeur;
        }
        const plans = await this.planRepo.find({ select: ['slug', 'rang'] });
        const map = new Map<string, number>();
        for (const plan of plans) {
            map.set(plan.slug, plan.rang ?? 0);
        }
        this.rangsPlansCache = { valeur: map, expiry: Date.now() + CACHE_TTL_MS };
        return map;
    }

    /** Stratégies d'expiration — cache 60s */
    private async getStrategies(): Promise<StrategieExpiration[]> {
        if (this.strategiesCache && Date.now() < this.strategiesCache.expiry) {
            return this.strategiesCache.valeur;
        }
        const strategies = await this.strategieRepo.find({ where: { actif: true } });
        this.strategiesCache = { valeur: strategies, expiry: Date.now() + CACHE_TTL_MS };
        return strategies;
    }

    /**
     * Résout la phase d'expiration d'un abonnement selon la stratégie applicable.
     * Stratégie : celle du plan de l'abonnement, sinon estDefaut, sinon fallback 15/15/archive.
     */
    async resoudrePhaseExpiration(abonnement: AbonnementClient): Promise<ResolutionExpiration> {
        if (!abonnement.dateExpirationReelle) {
            return { phase: 'ARCHIVE', joursDepuisExpiration: Number.MAX_SAFE_INTEGER };
        }

        const joursDepuisExpiration = Math.floor(
            (Date.now() - new Date(abonnement.dateExpirationReelle).getTime()) / (1000 * 60 * 60 * 24),
        );

        const strategies = await this.getStrategies();
        const planSlug = abonnement.plan?.slug;
        const strategie =
            strategies.find((s) => s.planSlug === planSlug) ||
            strategies.find((s) => s.estDefaut) ||
            null;

        const phases = strategie?.phases?.length ? strategie.phases : PHASES_FALLBACK;

        let cumul = 0;
        for (const phase of phases) {
            const dureePhase = phase.jours ?? Number.MAX_SAFE_INTEGER;
            if (joursDepuisExpiration < cumul + dureePhase) {
                switch (phase.comportement) {
                    case ComportementPhase.READ_ONLY:
                        return { phase: 'LECTURE_SEULE', joursDepuisExpiration, nomPhase: phase.nom };
                    case ComportementPhase.LOCKED:
                        return { phase: 'VERROUILLE', joursDepuisExpiration, nomPhase: phase.nom };
                    default:
                        return { phase: 'ARCHIVE', joursDepuisExpiration, nomPhase: phase.nom };
                }
            }
            cumul += dureePhase === Number.MAX_SAFE_INTEGER ? 0 : dureePhase;
            if (phase.jours === null || phase.jours === undefined) break;
        }

        return { phase: 'ARCHIVE', joursDepuisExpiration };
    }

    // =============================================
    // CHECK INDIVIDUEL — cascade 4 questions
    // =============================================

    /**
     * Vérifie l'entitlement d'un module pour un établissement.
     * Source unique de vérité pour le gating des modules.
     */
    async check(etablissementId: string, moduleCode: string): Promise<EntitlementResult> {
        // Q0. Le module existe-t-il dans le catalogue ?
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

        // Q1. Module critique (donnée estCritique, ex-bypass hardcodé P10)
        if (catalogueModule.estCritique) {
            return {
                accessible: true,
                visible: true,
                raison: 'CRITIQUE',
                source: 'critique',
            };
        }

        // Q2. Abonnement — ACTIF/ESSAI/EXPIRE chargés (fix P1 : EXPIRE réellement traité)
        const abonnement = await this.getAbonnementCourant(etablissementId);

        if (!abonnement) {
            // Invariant v3 : aucun accès sans plan (faille actifParDefaut fermée)
            return {
                accessible: false,
                visible: true,
                raison: 'AUCUN_PLAN',
                message: 'Un plan d\'abonnement actif est requis pour accéder à eLISAschool',
                source: 'catalogue',
                planMinimalRequis: catalogueModule.planMinimal || undefined,
            };
        }

        // Période d'essai active → tous modules inclus accessibles
        if (abonnement.statut === StatutAbonnement.ESSAI) {
            const now = new Date();
            if (abonnement.periodeEssaiFin && now < abonnement.periodeEssaiFin) {
                return {
                    accessible: true,
                    visible: true,
                    raison: 'ESSAI_ACTIF',
                    message: `Période d'essai active (jusqu'au ${abonnement.periodeEssaiFin.toLocaleDateString('fr-FR')})`,
                    source: 'essai',
                    planActuel: abonnement.plan?.slug,
                };
            }
            // Essai terminé → bascule sur la phase d'expiration de la stratégie
        }

        // EXPIRE (ou essai terminé) → phases de dégradation configurables
        if (abonnement.statut === StatutAbonnement.EXPIRE || abonnement.statut === StatutAbonnement.ESSAI) {
            const resolution = await this.resoudrePhaseExpiration(abonnement);
            if (resolution.phase === 'LECTURE_SEULE') {
                return {
                    accessible: true,
                    visible: true,
                    raison: 'DEGRADATION_LECTURE_SEULE',
                    message: `Mode lecture seule (J${resolution.joursDepuisExpiration}). Renouvelez pour retrouver l'accès complet.`,
                    source: 'catalogue',
                    planActuel: abonnement.plan?.slug,
                    lectureSeule: true,
                };
            }
            if (resolution.phase === 'VERROUILLE') {
                return {
                    accessible: false,
                    visible: true,
                    raison: 'DEGRADATION_VERROUILLE',
                    message: `Accès verrouillé depuis ${resolution.joursDepuisExpiration} jours. Renouvelez votre abonnement.`,
                    source: 'catalogue',
                    planActuel: abonnement.plan?.slug,
                };
            }
            return {
                accessible: false,
                visible: false,
                raison: 'DEGRADATION_ARCHIVE',
                message: 'Vos données ont été archivées. Contactez le support pour restaurer.',
                source: 'catalogue',
                planActuel: abonnement.plan?.slug,
            };
        }

        if (abonnement.statut === StatutAbonnement.SUSPENDU || abonnement.statut === StatutAbonnement.ANNULE) {
            return {
                accessible: false,
                visible: true,
                raison: 'ABONNEMENT_SUSPENDU',
                message: 'Votre abonnement est suspendu. Contactez le support.',
                source: 'catalogue',
                planActuel: abonnement.plan?.slug,
            };
        }

        // Q3. Inclus par le plan ?
        const modulesInclus = abonnement.plan?.entitlements?.modules || [];
        if (modulesInclus.includes(moduleCode)) {
            return {
                accessible: true,
                visible: true,
                raison: 'OK',
                source: 'plan',
                planActuel: abonnement.plan?.slug,
            };
        }

        // Q4. Override groupe
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

        // Q4b. Supplément souscrit (AbonnementModule)
        const supplements = await this.abonnementModuleRepo.find({
            where: { actif: true, etablissementId },
            relations: ['module'],
        });

        for (const sup of supplements) {
            if (sup.module?.code === moduleCode) {
                return {
                    accessible: true,
                    visible: true,
                    raison: 'OK',
                    source: 'supplement',
                    planActuel: abonnement.plan?.slug,
                };
            }
        }

        // Plan minimal requis — rangs lus depuis la donnée
        if (catalogueModule.planMinimal) {
            const rangsPlans = await this.getRangsPlans();
            const planActuelRang = rangsPlans.get(abonnement.plan?.slug || '') ?? -1;
            const planRequisRang = rangsPlans.get(catalogueModule.planMinimal) ?? 0;

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

        // Non inclus → proposer la souscription
        return {
            accessible: false,
            visible: true,
            raison: 'MODULE_DESACTIVE',
            message: catalogueModule.estSouscriptible
                ? 'Module disponible en supplément depuis le marché.'
                : 'Module non inclus dans votre plan actuel.',
            source: 'catalogue',
            planMinimalRequis: catalogueModule.planMinimal || undefined,
            planActuel: abonnement.plan?.slug,
        };
    }

    /** Abonnement courant du tenant — ACTIF/ESSAI en priorité, sinon EXPIRE (le plus récent) */
    private async getAbonnementCourant(etablissementId: string): Promise<AbonnementClient | null> {
        const abonnements = await this.abonnementRepo.find({
            where: {
                etablissementId,
                statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI, StatutAbonnement.EXPIRE, StatutAbonnement.SUSPENDU, StatutAbonnement.ANNULE]),
            },
            relations: ['plan'],
            order: { createdAt: 'DESC' },
        });

        if (!abonnements.length) return null;

        return (
            abonnements.find((a) => a.statut === StatutAbonnement.ACTIF) ||
            abonnements.find((a) => a.statut === StatutAbonnement.ESSAI) ||
            abonnements[0]
        );
    }

    /**
     * Invariant v3 : le tenant possède-t-il un plan actif (ACTIF ou ESSAI en cours) ?
     * Utilisé par le middleware requirePlanActif.
     */
    async hasPlanActif(etablissementId: string): Promise<boolean> {
        const abonnement = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]),
            },
        });
        if (!abonnement) return false;
        if (abonnement.statut === StatutAbonnement.ESSAI) {
            return Boolean(abonnement.periodeEssaiFin && new Date() < abonnement.periodeEssaiFin);
        }
        return true;
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

        this._lastCacheStatus = memCache ? 'STALE' : 'MISS';

        // Précharger toutes les données en parallèle (1 requête chacune)
        const [catalogue, abonnement, groupeLien, supplements] = await Promise.all([
            this.catalogueRepo.find({ where: { estActif: true }, order: { ordre: 'ASC' } }),
            this.getAbonnementCourant(etablissementId),
            this.groupeLienRepo.findOne({ where: { etablissementId } }),
            this.abonnementModuleRepo.find({
                where: { actif: true, etablissementId },
                relations: ['module'],
            }),
        ]);

        let modulesGroupeData: ModulesGroupe[] = [];
        if (groupeLien?.groupeId) {
            modulesGroupeData = await this.modulesGroupeRepo.find({
                where: { groupeEtablissementId: groupeLien.groupeId },
            });
        }

        const planInclus = new Set<string>(abonnement?.plan?.entitlements?.modules || []);
        const supplementsSouscrits = new Set<string>();
        for (const sup of supplements) {
            if (sup.module?.code) supplementsSouscrits.add(sup.module.code);
        }
        const groupeOverrides = new Map<string, boolean>();
        for (const mg of modulesGroupeData) {
            if (mg.module?.code) groupeOverrides.set(mg.module.code, mg.actif);
        }

        // Phase d'expiration résolue une seule fois pour le batch
        const resolutionExpiration =
            abonnement && (abonnement.statut === StatutAbonnement.EXPIRE || abonnement.statut === StatutAbonnement.ESSAI)
                ? await this.resoudrePhaseExpiration(abonnement)
                : null;

        const results: EntitlementBatchResult[] = catalogue.map((module) => {
            const entitlement = this.resolveInMemory(
                module, abonnement, planInclus,
                groupeOverrides, supplementsSouscrits, resolutionExpiration,
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

    /** Résolution batch pour une liste de codes (endpoint /entitlement/resolve) */
    async resolveBatch(etablissementId: string, codes: string[]): Promise<EntitlementBatchResult[]> {
        const tous = await this.checkAll(etablissementId);
        const wanted = new Set(codes);
        return tous.filter((r) => wanted.has(r.code));
    }

    /**
     * Résolution en mémoire pour un module (utilisé par checkAll batch).
     * Pas de requête DB — utilise les données préchargées.
     */
    private resolveInMemory(
        module: ModuleCatalogue,
        abonnement: AbonnementClient | null,
        planInclus: Set<string>,
        groupeOverrides: Map<string, boolean>,
        supplementsSouscrits: Set<string>,
        resolutionExpiration: ResolutionExpiration | null,
    ): EntitlementResult {
        // Q1. Module critique
        if (module.estCritique) {
            return { accessible: true, visible: true, raison: 'CRITIQUE', source: 'critique' };
        }

        // Q2. Abonnement requis
        if (!abonnement) {
            return {
                accessible: false, visible: true, raison: 'AUCUN_PLAN',
                message: 'Un plan d\'abonnement actif est requis pour accéder à eLISAschool',
                source: 'catalogue', planMinimalRequis: module.planMinimal || undefined,
            };
        }

        // Essai actif
        if (abonnement.statut === StatutAbonnement.ESSAI) {
            const now = new Date();
            if (abonnement.periodeEssaiFin && now < abonnement.periodeEssaiFin) {
                return {
                    accessible: true, visible: true, raison: 'ESSAI_ACTIF',
                    message: `Période d'essai active (jusqu'au ${abonnement.periodeEssaiFin.toLocaleDateString('fr-FR')})`,
                    source: 'essai', planActuel: abonnement.plan?.slug,
                };
            }
        }

        // Dégradation gracieuse (EXPIRE ou essai terminé) — phases configurables
        if ((abonnement.statut === StatutAbonnement.EXPIRE || abonnement.statut === StatutAbonnement.ESSAI) && resolutionExpiration) {
            if (resolutionExpiration.phase === 'LECTURE_SEULE') {
                return {
                    accessible: true, visible: true, raison: 'DEGRADATION_LECTURE_SEULE',
                    message: `Mode lecture seule (J${resolutionExpiration.joursDepuisExpiration}). Renouvelez votre abonnement.`,
                    source: 'catalogue', planActuel: abonnement.plan?.slug, lectureSeule: true,
                };
            }
            if (resolutionExpiration.phase === 'VERROUILLE') {
                return {
                    accessible: false, visible: true, raison: 'DEGRADATION_VERROUILLE',
                    message: `Accès verrouillé depuis ${resolutionExpiration.joursDepuisExpiration} jours. Renouvelez votre abonnement.`,
                    source: 'catalogue', planActuel: abonnement.plan?.slug,
                };
            }
            return {
                accessible: false, visible: false, raison: 'DEGRADATION_ARCHIVE',
                message: 'Vos données ont été archivées. Contactez le support pour restaurer.',
                source: 'catalogue', planActuel: abonnement.plan?.slug,
            };
        }

        if (abonnement.statut === StatutAbonnement.SUSPENDU || abonnement.statut === StatutAbonnement.ANNULE) {
            return {
                accessible: false, visible: true, raison: 'ABONNEMENT_SUSPENDU',
                message: 'Votre abonnement est suspendu. Contactez le support.',
                source: 'catalogue', planActuel: abonnement.plan?.slug,
            };
        }

        // Q3. Plan
        if (planInclus.has(module.code)) {
            return { accessible: true, visible: true, raison: 'OK', source: 'plan', planActuel: abonnement.plan?.slug };
        }

        // Q4. Override groupe
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

        // Q4b. Supplément
        if (supplementsSouscrits.has(module.code)) {
            return { accessible: true, visible: true, raison: 'OK', source: 'supplement', planActuel: abonnement.plan?.slug };
        }

        // Non inclus
        return {
            accessible: false, visible: true, raison: 'MODULE_DESACTIVE',
            message: module.estSouscriptible
                ? 'Module disponible en supplément depuis le marché.'
                : 'Module non inclus dans votre plan actuel.',
            source: 'catalogue', planMinimalRequis: module.planMinimal || undefined, planActuel: abonnement.plan?.slug,
        };
    }

    // =============================================
    // CATALOGUE
    // =============================================

    /** Catalogue complet des modules actifs (plateforme) */
    async getCatalogue(): Promise<ModuleCatalogue[]> {
        return this.catalogueRepo.find({
            where: { estActif: true },
            order: { ordre: 'ASC' },
        });
    }

    /** Vérifie si un module est facturable (PAYANT) */
    async isModuleFacturable(code: string): Promise<boolean> {
        const entree = await this.catalogueRepo.findOne({ where: { code, estActif: true } });
        return entree?.estFacturable ?? false;
    }

    /**
     * Vérifie si un module est réellement souscrit via un plan ou un supplément.
     */
    async isModuleSouscrit(etablissementId: string, code: string): Promise<boolean> {
        const result = await this.check(etablissementId, code);
        return result.accessible && result.source !== 'catalogue' && result.source !== 'critique';
    }

    /**
     * Résout tous les modules d'un établissement avec les données complètes du catalogue.
     * Enrichit checkAll() avec les métadonnées catalogue (prix, description, etc.).
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
                estCritique: m.estCritique,
                icone: m.icone,
                prixMensuel: m.prixMensuel,
                prixAnnuel: m.prixAnnuel,
                estFacturable: m.estFacturable,
                estSouscriptible: m.estSouscriptible,
                planMinimal: m.planMinimal,
                dependencies: m.dependencies,
                ordre: m.ordre,
                estActif: m.estActif,
                /** Statut marché v3 : inclus par le plan → gratuit pour ce tenant */
                inclusParPlan: ent?.source === 'plan' || ent?.source === 'essai' || false,
                actif: ent?.accessible ?? false,
                source: ent?.source || 'catalogue',
                entitlement: ent,
            };
        });
    }

    // =============================================
    // CHECK CAPABILITY (unification modules + fonctionnalités)
    // =============================================

    /**
     * Point d'entrée unifié pour vérifier une capacité (module OU fonctionnalité).
     *
     * - Si `capability` correspond à un code module du catalogue → utilise check()
     * - Si `capability` correspond à une clé de fonctionnalité (ex-feature flag)
     *   → incluse par plan.entitlements.fonctionnalites + rollout/overrides
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

        // 2. Vérifier si c'est une fonctionnalité définie
        const definition = await this.definitionRepo.findOne({
            where: { cle: capability },
        });

        if (definition) {
            if (!definition.estActif) {
                return {
                    accessible: false,
                    visible: true,
                    raison: 'MODULE_DESACTIVE',
                    message: `Fonctionnalité '${definition.label}' désactivée au niveau plateforme`,
                    source: 'catalogue',
                };
            }

            const abonnement = await this.getAbonnementCourant(etablissementId);
            if (!abonnement) {
                return {
                    accessible: false,
                    visible: true,
                    raison: 'AUCUN_PLAN',
                    message: 'Un plan d\'abonnement actif est requis',
                    source: 'catalogue',
                };
            }

            // Essai actif → fonctionnalités du plan d'essai accessibles
            const essaiActif = abonnement.statut === StatutAbonnement.ESSAI
                && abonnement.periodeEssaiFin && new Date() < abonnement.periodeEssaiFin;

            const inclusesParPlan = abonnement.plan?.entitlements?.fonctionnalites || [];
            const incluseParPlan = inclusesParPlan.includes(capability);

            if ((abonnement.statut === StatutAbonnement.ACTIF || essaiActif) && incluseParPlan) {
                // Rollout + overrides tenant appliqués par le FeatureFlagService
                const enabled = await this.featureFlagService.isEnabledWithRollout(capability, etablissementId);
                if (enabled) {
                    return {
                        accessible: true,
                        visible: true,
                        raison: 'OK',
                        source: 'plan',
                        message: `Fonctionnalité '${definition.label}' activée`,
                        planActuel: abonnement.plan?.slug,
                    };
                }
            }

            return {
                accessible: false,
                visible: true,
                raison: incluseParPlan ? 'MODULE_DESACTIVE' : 'PLAN_INSUFFICIENT',
                message: incluseParPlan
                    ? `Fonctionnalité '${definition.label}' non activée pour cet établissement`
                    : `Fonctionnalité '${definition.label}' non incluse dans votre plan`,
                source: 'catalogue',
                planMinimalRequis: definition.planMinimal || undefined,
                planActuel: abonnement.plan?.slug,
            };
        }

        // 3. Ni module ni fonctionnalité connue → inaccessible
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

    /** Vérifie rapidement si un module est accessible (boolean) */
    async isAccessible(etablissementId: string, moduleCode: string): Promise<boolean> {
        const result = await this.check(etablissementId, moduleCode);
        return result.accessible;
    }

    /** Récupère le statut d'abonnement d'un établissement */
    async getStatutAbonnement(etablissementId: string): Promise<{
        actif: boolean;
        statut: StatutAbonnement | 'AUCUN';
        planSlug?: string;
        planNom?: string;
    }> {
        const abonnement = await this.getAbonnementCourant(etablissementId);

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
