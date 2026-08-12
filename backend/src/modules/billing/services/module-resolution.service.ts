/**
 * ==================================
 * eLISAschool - Service ModuleResolution v2
 * ==================================
 *
 * Résolution des modules pour un tenant à partir du catalogue unique
 * (modules_catalogue) — source de vérité (Lot A — Refonte SaaS v7).
 *
 * Cascade de résolution (actif) :
 *   1. Catalogue (modules_catalogue.actifParDefaut) → base
 *   2. Plan (PlanAbonnement.modulesInclus, par code) → activation
 *   3. AbonnementModule (suppléments souscrits, slug = code) → activation
 *   4. Désactivation explicite (ParametreSysteme modules.{code}.actif=false)
 *      gérée par configurationService.isModuleActive (non dupliquée ici)
 *
 * Cache mémoire TTL 5 min par établissement (pattern FeatureFlagService).
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { AbonnementModule } from '../entities/abonnement-module.entity';
import { ModuleOptionnel } from '../entities/module-optionnel.entity';
import { ModuleCatalogue, CategorieModule } from '../entities/module-catalogue.entity';
import { ModulesGroupe } from '../entities/modules-groupe.entity';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities';
import { redisService } from '@common/services/redis.service'; // P3.1 v7
import { logger } from '@common/utils/logger.util'; // P3.1 v7

export type SourceModule = 'catalogue' | 'plan' | 'groupe' | 'supplement';

export interface ModuleResolu {
    id: string;
    code: string;
    nom: string;
    nomEn?: string;
    description?: string;
    categorie: CategorieModule;
    icone: string;
    prixMensuel: number;
    prixAnnuel: number;
    estFacturable: boolean;
    estSouscriptible: boolean;
    actifParDefaut: boolean;
    planMinimal?: string;
    dependencies: string[];
    ordre: number;
    estActif: boolean;
    /** État résolu pour l'établissement */
    actif: boolean;
    /** Origine de l'activation (catalogue par défaut / plan / supplément) */
    source: SourceModule;
}

const CACHE_TTL_MS = 60 * 1000; // P1.5 v7 — 60 secondes (unifié, était 5 min)
const CACHE_TTL_SEC = 60; // P3.1 v7 — TTL Redis en secondes
const CACHE_PREFIX = 'modules:resolved'; // P3.1 v7
const PUBSUB_CHANNEL = 'modules:invalidate'; // P3.2 v7
const CACHE_FACTURABLE_PREFIX = 'module:facturable'; // P3.3 v7
const CACHE_FACTURABLE_TTL = 300; // P3.3 v7 — 5 minutes

interface CacheEntree {
    valeur: ModuleResolu[];
    expiry: number;
}

export class ModuleResolutionService {
    private catalogueRepo: Repository<ModuleCatalogue>;
    private abonnementRepo: Repository<AbonnementClient>;
    private abonnementModuleRepo: Repository<AbonnementModule>;
    private moduleOptionnelRepo: Repository<ModuleOptionnel>;
    private modulesGroupeRepo: Repository<ModulesGroupe>;
    private groupeLienRepo: Repository<GroupeEtablissementLien>;

    /** P3.1 v7 — Cache in-memory fallback (utilisé si Redis indisponible) */
    private cache = new Map<string, CacheEntree>();
    private redisAvailable = true; // P3.1 v7

    constructor() {
        this.catalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.abonnementModuleRepo = AppDataSource.getRepository(AbonnementModule);
        this.moduleOptionnelRepo = AppDataSource.getRepository(ModuleOptionnel);
        this.modulesGroupeRepo = AppDataSource.getRepository(ModulesGroupe);
        this.groupeLienRepo = AppDataSource.getRepository(GroupeEtablissementLien);

        // P3.2 v7 — S'abonner aux invalidations cross-instance
        this.initPubSub();
    }

    /** P3.2 v7 — Initialiser l'abonnement pub/sub pour invalidation cross-instance */
    private initPubSub(): void {
        try {
            redisService.subscribe(PUBSUB_CHANNEL, (message: { etablissementId?: string }) => {
                const { etablissementId } = message;
                if (etablissementId) {
                    this.cache.delete(etablissementId);
                } else {
                    this.cache.clear();
                }
                logger.debug(`[ModuleResolution] Invalidation cross-instance reçue${etablissementId ? ` pour ${etablissementId}` : ' (global)'}`);
            });
        } catch (error) {
            logger.warn('[ModuleResolution] Pub/Sub init échoué (fonctionnel en mode single-instance)');
        }
    }

    /** P3.1 v7 — Invalidation du cache Redis + in-memory + pub/sub */
    async invalidate(etablissementId?: string): Promise<void> {
        const cacheKey = etablissementId
            ? `${CACHE_PREFIX}:${etablissementId}`
            : null;

        // 1. Invalidation locale (in-memory fallback)
        if (etablissementId) {
            this.cache.delete(etablissementId);
        } else {
            this.cache.clear();
        }

        // 2. Invalidation Redis
        try {
            if (cacheKey) {
                await redisService.del(cacheKey);
            } else {
                await redisService.delByPattern(`${CACHE_PREFIX}:*`);
            }
            this.redisAvailable = true;
        } catch {
            this.redisAvailable = false;
        }

        // 3. P3.2 v7 — Pub/sub pour cross-instance
        try {
            await redisService.publish(PUBSUB_CHANNEL, { etablissementId });
        } catch {
            // Silencieux — les autres instances expireront naturellement
        }
    }

    /**
     * Catalogue complet (plateforme) — tous les modules, sans résolution tenant.
     */
    async getCatalogue(): Promise<ModuleCatalogue[]> {
        return this.catalogueRepo.find({
            where: { estActif: true },
            order: { ordre: 'ASC' },
        });
    }

    /**
     * P3.1 v7 — Résout tous les modules d'un établissement avec cache Redis (fallback in-memory).
     * Cascade : catalogue → plan → supplément.
     */
    async getResolvedModules(etablissementId: string): Promise<ModuleResolu[]> {
        const cacheKey = `${CACHE_PREFIX}:${etablissementId}`;

        // 1. Cache Redis
        if (this.redisAvailable) {
            try {
                const cached = await redisService.getJSON<ModuleResolu[]>(cacheKey);
                if (cached) return cached;
            } catch {
                this.redisAvailable = false;
            }
        }

        // 2. Cache in-memory fallback
        const memCache = this.cache.get(etablissementId);
        if (memCache && Date.now() < memCache.expiry) return memCache.valeur;

        // 3. Calcul
        const modules = await this.resoudre(etablissementId);

        // 4. Stocker Redis
        if (this.redisAvailable) {
            try {
                await redisService.setJSON(cacheKey, modules, CACHE_TTL_SEC);
            } catch {
                this.redisAvailable = false;
            }
        }

        // 5. Stocker in-memory (fallback)
        this.cache.set(etablissementId, {
            valeur: modules,
            expiry: Date.now() + CACHE_TTL_MS,
        });

        return modules;
    }

    private async resoudre(etablissementId: string): Promise<ModuleResolu[]> {
        // Résolution du groupe éventuel pour cet établissement
        const groupeLien = await this.groupeLienRepo.findOne({
            where: { etablissementId },
        });
        const groupeId = groupeLien?.groupeId;

        const [catalogue, abonnement, supplements, modulesGroupe] = await Promise.all([
            this.catalogueRepo.find({
                where: { estActif: true },
                order: { ordre: 'ASC' },
            }),
            this.abonnementRepo.findOne({
                where: { etablissementId, statut: StatutAbonnement.ACTIF },
                relations: ['plan'],
            }),
            this.abonnementModuleRepo.find({
                where: { 
                    actif: true,
                    etablissementId, // P1.1 v7 — Filtre multi-tenant direct (colonne dénormalisée)
                },
                relations: ['moduleOptionnel'],
            }),
            // Override groupe (Lot C v7)
            groupeId
                ? this.modulesGroupeRepo.find({ where: { groupeEtablissementId: groupeId } })
                : Promise.resolve([]),
        ]);

        const planInclus = new Set<string>();
        if (abonnement?.plan?.modulesInclus) {
            for (const slug of abonnement.plan.modulesInclus) planInclus.add(slug);
        }
        const supplementsSouscrits = new Set<string>();
        for (const am of supplements) {
            const slug = am.moduleOptionnel?.slug;
            if (slug) supplementsSouscrits.add(slug);
        }

        // Override groupe : code → actif (force activation/désactivation)
        const groupeOverrides = new Map<string, boolean>();
        for (const mg of modulesGroupe) {
            const code = mg.module?.code;
            if (code) groupeOverrides.set(code, mg.actif);
        }

        return catalogue.map((m): ModuleResolu => {
            let actif = m.actifParDefaut;
            let source: SourceModule = 'catalogue';

            // 1. Plan
            if (planInclus.has(m.code)) {
                actif = true;
                source = 'plan';
            }

            // 2. Override groupe (Lot C v7) — entre plan et supplément
            if (groupeOverrides.has(m.code)) {
                actif = groupeOverrides.get(m.code)!;
                source = 'groupe';
            }

            // 3. Supplément souscrit (force activation)
            if (supplementsSouscrits.has(m.code)) {
                actif = true;
                source = 'supplement';
            }

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
                actif,
                source,
            };
        });
    }

    /**
     * Vérifie si un module est activé pour un établissement.
     */
    async isModuleActive(etablissementId: string, code: string): Promise<boolean> {
        const modules = await this.getResolvedModules(etablissementId);
        return modules.some((m) => m.code === code && m.actif);
    }

    /**
     * P3.3 v7 — Vérifie si un module est facturable (PREMIUM/ADDON) avec cache Redis.
     */
    async isModuleFacturable(code: string): Promise<boolean> {
        const cacheKey = `${CACHE_FACTURABLE_PREFIX}:${code}`;

        // 1. Cache Redis
        if (this.redisAvailable) {
            try {
                const cached = await redisService.get<boolean>(cacheKey);
                if (cached !== null) return cached === true || cached === 'true' as unknown as boolean;
            } catch {
                this.redisAvailable = false;
            }
        }

        // 2. DB lookup
        const entree = await this.catalogueRepo.findOne({ where: { code, estActif: true } });
        const result = entree?.estFacturable ?? false;

        // 3. Stocker Redis
        if (this.redisAvailable) {
            try {
                await redisService.set(cacheKey, String(result), CACHE_FACTURABLE_TTL);
            } catch {
                this.redisAvailable = false;
            }
        }

        return result;
    }

    /**
     * Vérifie si un module est souscrit par le plan ou en supplément.
     * (source !== 'catalogue' → activation réellement payée/comptée)
     */
    async isModuleSouscrit(etablissementId: string, code: string): Promise<boolean> {
        const modules = await this.getResolvedModules(etablissementId);
        return modules.some((m) => m.code === code && m.actif && m.source !== 'catalogue');
    }
}

export default ModuleResolutionService;

/** Singleton partagé (pattern quotaService / dunningService) */
export const moduleResolutionService = new ModuleResolutionService();