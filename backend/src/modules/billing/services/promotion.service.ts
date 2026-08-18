/**
 * ==================================
 * eLISAschool - PromotionService (Refonte v4.0)
 * ==================================
 *
 * Moteur de promotions en cascade 5 phases :
 *   Phase 1 — PLAN   : remise sur base + élèves sup. (plafond 40%)
 *   Phase 2 — PACK   : remise sur packs quota (pas de plafond)
 *   Phase 3 — QUOTA  : remise sur ressource quota spécifique (paliers volume)
 *   Phase 4 — MODULE : remise sur modules sup. (pas de plafond)
 *   Phase 5 — GRATUITE : modules offerts N mois (0 F)
 *
 * Chaque phase est indépendante. Les conditions JSONB (plansRequis,
 * packsRequis, nombreElevesMin, etc.) sont évaluées par scope.
 *
 * Remplace le RemiseService (migration 215).
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    Promotion,
    TypePromotion,
    ScopePromotion,
    DureeApplicationPromotion,
    ConditionsPromotion,
    ConfigPromotion,
    PalierVolume,
    TypeAutoPromotion,
} from '../entities/promotion.entity';
import { BundlePromotion, TypeRemiseBundle } from '../entities/bundle-promotion.entity';
import { PromotionUtilisee } from '../entities/promotion-utilisee.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

// =============================================
// TYPES PUBLICS
// =============================================

    /** Contexte complet pour l'application des promotions */
    export interface ContextePromotion {
    planId?: string;
    etablissementId?: string;
    cycleCode?: string;
    numeroCycle?: number;
    codeCoupon?: string;
    nombreEleves?: number;
    dateDebutAbonnement?: Date;
    dateFinAbonnement?: Date;
    /** IDs des packs déjà souscrits (pour cross-sell pack→pack) */
    packsSouscritsIds?: string[];
    /** IDs des modules déjà souscrits */
    modulesSouscritsIds?: string[];
    /** Montants individuels des packs (packId → montant) pour calcul bundle */
    packMontants?: Record<string, number>;
    /** Ressources des packs souscrits (packId → ressource) pour filtrage cibleRessource */
    packRessources?: Record<string, string>;
    /** Quantité de la ressource ciblée (pour paliers volume scope=QUOTA) */
    quantiteRessource?: number;
    /** Montant des modules (module Id → montant) pour calcul gratuité */
    moduleMontants?: Record<string, number>;
    /** Premier abonnement (pour auto-promo NOUVEAU_CLIENT) */
    estPremierAbonnement?: boolean;
    /** Plan précédent (pour auto-promo UPGRADE) */
    planPrecedentId?: string;
}

/** Résultat d'application d'une promotion sur une ligne */
export interface LignePromotionResult {
    promotionId: string;
    code: string;
    type: TypePromotion;
    scope: ScopePromotion;
    valeur: number;
    montantDeduit: number;
    /** Nombre de mois de gratuité (si type=GRATUITE) */
    moisGratuite?: number;
}

/** Résultat complet de la cascade */
export interface ResultatCascadePromotions {
    /** Total après toutes les promotions */
    montantFinal: number;
    /** Total avant promotions */
    montantAvantPromotions: number;
    /** Détail par scope */
    plan: { montantAvant: number; montantApres: number; promotions: LignePromotionResult[] };
    packs: { montantAvant: number; montantApres: number; promotions: LignePromotionResult[] };
    /** Quota (scope=QUOTA) — déduction sur ressource spécifique */
    quota: { montantAvant: number; montantApres: number; promotions: LignePromotionResult[] };
    modules: { montantAvant: number; montantApres: number; promotions: LignePromotionResult[] };
    gratuités: LignePromotionResult[];
    /** Toutes les promotions appliquées (aplati) */
    toutesPromotions: LignePromotionResult[];
}

// =============================================
// SERVICE
// =============================================

export class PromotionService {
    private promoRepo: Repository<Promotion>;
    private bundleRepo: Repository<BundlePromotion>;

    /** Plafond de déduction sur le PLAN uniquement (40%) */
    private static readonly PLAFOND_PLAN_POURCENT = 40;

    constructor() {
        this.promoRepo = AppDataSource.getRepository(Promotion);
        this.bundleRepo = AppDataSource.getRepository(BundlePromotion);
    }

    // =============================================
    // CRUD PROMOTIONS
    // =============================================

    async create(dto: Partial<Promotion>): Promise<Promotion> {
        if (!dto.code || !dto.nom) {
            throw new AppError('Le code et le nom de la promotion sont obligatoires', 400, 'VALIDATION_ERROR');
        }
        const existante = await this.promoRepo.findOne({ where: { code: dto.code } });
        if (existante) {
            throw new AppError(`Une promotion avec le code "${dto.code}" existe déjà`, 409, 'PROMOTION_EXISTS');
        }
        if (dto.typePromotion === TypePromotion.POURCENTAGE && (dto.valeur! <= 0 || dto.valeur! > 100)) {
            throw new AppError('Une promotion en pourcentage doit être comprise entre 0 et 100', 400, 'VALIDATION_ERROR');
        }
        const promotion = this.promoRepo.create(dto);
        const saved = await this.promoRepo.save(promotion);
        logger.info(`[Promotions] Promotion créée : ${saved.code} (${saved.scope}/${saved.typePromotion} ${saved.valeur})`);
        return saved;
    }

    async findAll(filters?: { scope?: ScopePromotion | string; actif?: boolean; page?: number; limit?: number }): Promise<{
        data: Promotion[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }> {
        const where: Record<string, unknown> = {};
        if (filters?.scope) where.scope = filters.scope;
        if (filters?.actif !== undefined) where.actif = filters.actif;

        const page = Math.max(1, filters?.page || 1);
        const limit = Math.min(100, Math.max(1, filters?.limit || 50));
        const skip = (page - 1) * limit;

        const [data, total] = await this.promoRepo.findAndCount({
            where,
            order: { scope: 'ASC', priorite: 'DESC', createdAt: 'DESC' },
            take: limit,
            skip,
        });

        return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string): Promise<Promotion> {
        const promo = await this.promoRepo.findOne({ where: { id } });
        if (!promo) throw new AppError('Promotion introuvable', 404, 'NOT_FOUND');
        return promo;
    }

    async update(id: string, dto: Partial<Promotion>): Promise<Promotion> {
        const promo = await this.findOne(id);
        Object.assign(promo, dto);
        return this.promoRepo.save(promo);
    }

    async delete(id: string): Promise<void> {
        const promo = await this.findOne(id);
        await this.promoRepo.remove(promo);
        logger.info(`[Promotions] Promotion supprimée : ${promo.code}`);
    }

    /**
     * Duplique une promotion existante avec un nouveau code unique.
     * Copie tous les champs sauf : id, code, utilisations, createdAt, updatedAt.
     * Le code est suffixé par '_COPY' + timestamp court.
     */
    async dupliquer(id: string): Promise<Promotion> {
        const original = await this.findOne(id);

        // Générer un code unique
        const suffix = `_${Date.now().toString(36).toUpperCase().slice(-4)}`;
        let nouveauCode = `${original.code}${suffix}`;
        if (nouveauCode.length > 50) {
            nouveauCode = nouveauCode.substring(0, 46) + suffix;
        }

        // Vérifier l'unicité
        let existante = await this.promoRepo.findOne({ where: { code: nouveauCode } });
        let tentatives = 0;
        while (existante && tentatives < 5) {
            tentatives++;
            nouveauCode = `${original.code}${suffix}_${tentatives}`;
            existante = await this.promoRepo.findOne({ where: { code: nouveauCode } });
        }
        if (existante) {
            throw new AppError('Impossible de générer un code unique pour la duplication', 500, 'DUPLICATE_FAILED');
        }

        const copie = this.promoRepo.create({
            ...original,
            id: undefined,
            code: nouveauCode,
            nom: `${original.nom} (copie)`,
            utilisations: 0,
            createdAt: undefined,
            updatedAt: undefined,
        });

        const saved = await this.promoRepo.save(copie);
        logger.info(`[Promotions] Promotion dupliquée : ${original.code} → ${saved.code}`);
        return saved;
    }

    // =============================================
    // CRUD BUNDLES
    // =============================================

    async createBundle(dto: Partial<BundlePromotion>): Promise<BundlePromotion> {
        if (!dto.code || !dto.nom || !dto.packIds || dto.packIds.length < 2) {
            throw new AppError('Code, nom et minimum 2 packs sont obligatoires pour un bundle', 400, 'VALIDATION_ERROR');
        }
        const existant = await this.bundleRepo.findOne({ where: { code: dto.code } });
        if (existant) {
            throw new AppError(`Un bundle avec le code "${dto.code}" existe déjà`, 409, 'BUNDLE_EXISTS');
        }
        const bundle = this.bundleRepo.create(dto);
        const saved = await this.bundleRepo.save(bundle);
        logger.info(`[Promotions] Bundle créé : ${saved.code} (${saved.packIds.length} packs, -${saved.valeur})`);
        return saved;
    }

    async findAllBundles(filters?: { actif?: boolean }): Promise<BundlePromotion[]> {
        const where: Record<string, unknown> = {};
        if (filters?.actif !== undefined) where.actif = filters.actif;
        return this.bundleRepo.find({ where, order: { priorite: 'DESC' } });
    }

    async findOneBundle(id: string): Promise<BundlePromotion> {
        const bundle = await this.bundleRepo.findOne({ where: { id } });
        if (!bundle) throw new AppError('Bundle introuvable', 404, 'NOT_FOUND');
        return bundle;
    }

    async updateBundle(id: string, dto: Partial<BundlePromotion>): Promise<BundlePromotion> {
        const bundle = await this.findOneBundle(id);
        Object.assign(bundle, dto);
        return this.bundleRepo.save(bundle);
    }

    async deleteBundle(id: string): Promise<void> {
        const bundle = await this.findOneBundle(id);
        await this.bundleRepo.remove(bundle);
        logger.info(`[Promotions] Bundle supprimé : ${bundle.code}`);
    }

    // =============================================
    // MOTEUR EN CASCADE (5 PHASES)
    // =============================================

    /**
     * Applique les promotions en cascade sur les 3 composantes de la facture.
     *
     * @param montantPlan    Montant du plan (base + élèves sup. × coefCycle)
     * @param montantPacks   Montant total des packs souscrits
     * @param montantModules Montant total des modules supplémentaires
     * @param ctx            Contexte complet (plan, packs souscrits, etc.)
     */
    async appliquerCascade(
        montantPlan: number,
        montantPacks: number,
        montantModules: number,
        ctx: ContextePromotion,
    ): Promise<ResultatCascadePromotions> {
        const toutesPromos = await this.promoRepo.find({ where: { actif: true } });
        const tousBundles = await this.bundleRepo.find({ where: { actif: true } });

        const resultat: ResultatCascadePromotions = {
            montantFinal: 0,
            montantAvantPromotions: montantPlan + montantPacks + montantModules,
            plan: { montantAvant: montantPlan, montantApres: montantPlan, promotions: [] },
            packs: { montantAvant: montantPacks, montantApres: montantPacks, promotions: [] },
            quota: { montantAvant: 0, montantApres: 0, promotions: [] },
            modules: { montantAvant: montantModules, montantApres: montantModules, promotions: [] },
            gratuités: [],
            toutesPromotions: [],
        };

        // ─── PHASE 1 : PLAN (plafond 40%) ───
        const promosPlan = toutesPromos.filter((p) => p.scope === ScopePromotion.PLAN);
        const validesPlan = promosPlan
            .filter((p) => this.estValide(p, ctx))
            .sort((a, b) => (b.priorite ?? 0) - (a.priorite ?? 0));

        let totalPlan = montantPlan;
        const deductionMaxPlan = montantPlan * (PromotionService.PLAFOND_PLAN_POURCENT / 100);
        let totalDeduitPlan = 0;

        for (const promo of validesPlan) {
            if (ctx.codeCoupon && promo.codeCoupon && promo.codeCoupon !== ctx.codeCoupon) continue;
            if (totalDeduitPlan >= deductionMaxPlan) break;

            if (!promo.cumulable && resultat.plan.promotions.length > 0) continue;
            if (!promo.cumulable && resultat.plan.promotions.length === 0) {
                // Exclusive : appliquée seule
                const deduit = this.écréter(
                    this.calculerDeduction(promo, totalPlan, ctx),
                    totalDeduitPlan,
                    deductionMaxPlan,
                );
                if (deduit <= 0) break;
                totalPlan -= deduit;
                totalDeduitPlan += deduit;
                resultat.plan.promotions.push(this.toLigneResult(promo, deduit));
                break;
            }

            const deduit = this.écréter(
                this.calculerDeduction(promo, totalPlan, ctx),
                totalDeduitPlan,
                deductionMaxPlan,
            );
            if (deduit <= 0) continue;
            totalPlan -= deduit;
            totalDeduitPlan += deduit;
            resultat.plan.promotions.push(this.toLigneResult(promo, deduit));
        }
        resultat.plan.montantApres = Math.max(0, Math.round(totalPlan * 100) / 100);

        // ─── PHASE 2 : PACKS (pas de plafond) ───
        const promosPack = toutesPromos.filter((p) => p.scope === ScopePromotion.PACK);
        const validesPack = promosPack
            .filter((p) => this.estValide(p, ctx))
            .sort((a, b) => (b.priorite ?? 0) - (a.priorite ?? 0));

        let totalPacks = montantPacks;

        for (const promo of validesPack) {
            if (ctx.codeCoupon && promo.codeCoupon && promo.codeCoupon !== ctx.codeCoupon) continue;
            const deduit = this.calculerDeduction(promo, totalPacks, ctx);
            if (deduit <= 0) continue;
            totalPacks -= deduit;
            resultat.packs.promotions.push(this.toLigneResult(promo, deduit));
        }

        // Bundles : vérifier si tous les packs du bundle sont souscrits
        for (const bundle of tousBundles) {
            if (!this.estBundleValide(bundle, ctx)) continue;
            const totalPacksBundle = this.calculerTotalPacksBundle(bundle, montantPacks, ctx);
            if (totalPacksBundle <= 0) continue;
            const deduit = bundle.typeRemise === TypeRemiseBundle.POURCENTAGE
                ? Math.round(totalPacksBundle * (Number(bundle.valeur) / 100) * 100) / 100
                : Math.min(Number(bundle.valeur), totalPacksBundle);
            if (deduit <= 0) continue;
            totalPacks -= deduit;
            resultat.packs.promotions.push({
                promotionId: bundle.id,
                code: bundle.code,
                type: TypePromotion.POURCENTAGE,
                scope: ScopePromotion.BUNDLE,
                valeur: Number(bundle.valeur),
                montantDeduit: deduit,
            });
        }
        resultat.packs.montantApres = Math.max(0, Math.round(totalPacks * 100) / 100);

        // ─── PHASE 2.5 : QUOTA (scope=QUOTA, déduction sur ressource spécifique) ───
        const promosQuota = toutesPromos.filter((p) => p.scope === ScopePromotion.QUOTA);
        const validesQuota = promosQuota
            .filter((p) => this.estValide(p, ctx))
            .sort((a, b) => (b.priorite ?? 0) - (a.priorite ?? 0));

        // Le montant quota est la somme des coûts de la ressource ciblée
        // (fourni par le contexte via quantiteRessource × prix unitaire, ou via moduleMontants)
        const montantQuotaTotal = ctx.quantiteRessource
            ? ctx.quantiteRessource // Le montant est déjà calculé par le facturation service
            : 0;
        resultat.quota.montantAvant = montantQuotaTotal;
        let totalQuota = montantQuotaTotal;

        for (const promo of validesQuota) {
            if (ctx.codeCoupon && promo.codeCoupon && promo.codeCoupon !== ctx.codeCoupon) continue;
            // Vérifier que la ressource ciblée correspond (si quotaRessource configuré)
            if (promo.config?.quotaRessource && ctx.quantiteRessource === undefined) {
                continue; // Pas de quantité fournie pour cette ressource → skip
            }
            const deduit = this.calculerDeduction(promo, totalQuota, ctx);
            if (deduit <= 0) continue;
            totalQuota -= deduit;
            resultat.quota.promotions.push(this.toLigneResult(promo, deduit));
        }
        resultat.quota.montantApres = Math.max(0, Math.round(totalQuota * 100) / 100);

        // ─── PHASE 3 : MODULES (pas de plafond) ───
        const promosModule = toutesPromos.filter(
            (p) => p.scope === ScopePromotion.MODULE && p.typePromotion !== TypePromotion.GRATUITE,
        );
        const validesModule = promosModule
            .filter((p) => this.estValide(p, ctx))
            .sort((a, b) => (b.priorite ?? 0) - (a.priorite ?? 0));

        let totalModules = montantModules;

        for (const promo of validesModule) {
            if (ctx.codeCoupon && promo.codeCoupon && promo.codeCoupon !== ctx.codeCoupon) continue;
            const deduit = this.calculerDeduction(promo, totalModules, ctx);
            if (deduit <= 0) continue;
            totalModules -= deduit;
            resultat.modules.promotions.push(this.toLigneResult(promo, deduit));
        }
        resultat.modules.montantApres = Math.max(0, Math.round(totalModules * 100) / 100);

        // ─── PHASE 4 : GRATUITÉS (modules à 0 F) ───
        const gratuités = toutesPromos.filter(
            (p) => p.scope === ScopePromotion.MODULE && p.typePromotion === TypePromotion.GRATUITE,
        );
        const validesGratuites = gratuités
            .filter((p) => this.estValide(p, ctx))
            .sort((a, b) => (b.priorite ?? 0) - (a.priorite ?? 0));

        for (const grat of validesGratuites) {
            const dureeMois = grat.conditions?.dureeGratuiteMois ?? 1;
            // Vérifier si on est encore dans la période de gratuité
            if (ctx.dateDebutAbonnement) {
                const moisEcoules = this.calculerAncienneteMois(ctx.dateDebutAbonnement, new Date());
                // La gratuité s'applique uniquement pendant les N premiers mois
                if (grat.dureeApplication === DureeApplicationPromotion.N_MOIS_GRATUIT && moisEcoules >= dureeMois) {
                    continue;
                }
            }
            resultat.gratuités.push({
                promotionId: grat.id,
                code: grat.code,
                type: TypePromotion.GRATUITE,
                scope: ScopePromotion.MODULE,
                valeur: 100,
                montantDeduit: 0,
                moisGratuite: dureeMois,
            });
        }

        // ─── TOTAL ───
        resultat.montantFinal = Math.round(
            (resultat.plan.montantApres + resultat.packs.montantApres + resultat.quota.montantApres + resultat.modules.montantApres) * 100,
        ) / 100;

        resultat.toutesPromotions = [
            ...resultat.plan.promotions,
            ...resultat.packs.promotions,
            ...resultat.quota.promotions,
            ...resultat.modules.promotions,
            ...resultat.gratuités,
        ];

        return resultat;
    }

    /**
     * Applique les promotions sur un montant unique (API simplifiée,
     * compatible avec l'ancien RemiseService.appliquer()).
     * Utilisé pour les simulations et previews.
     */
    async appliquer(montant: number, ctx: ContextePromotion): Promise<{
        montantFinal: number;
        montantAvantRemise: number;
        remisesAppliquees: LignePromotionResult[];
    }> {
        const cascade = await this.appliquerCascade(montant, 0, 0, ctx);
        return {
            montantFinal: cascade.plan.montantApres,
            montantAvantRemise: montant,
            remisesAppliquees: cascade.plan.promotions,
        };
    }

    /** Incrémente le compteur d'utilisations + trace chaque utilisation */
    async enregistrerUtilisation(
        promotionIds: string[],
        contexte?: {
            etablissementId?: string;
            factureId?: string;
            remises?: Array<{ remiseId: string; code: string; scope?: string; montantDeduit: number }>;
        }
    ): Promise<void> {
        // 1. Incrémenter le compteur sur la promotion
        for (const id of promotionIds) {
            await this.promoRepo.increment({ id }, 'utilisations', 1);
        }

        // 2. Traçabilité par établissement (R3)
        if (contexte?.etablissementId && contexte?.remises?.length) {
            const trackingRepo = AppDataSource.getRepository(PromotionUtilisee);
            const records = contexte.remises.map((r) =>
                trackingRepo.create({
                    promotionId: r.remiseId,
                    etablissementId: contexte.etablissementId!,
                    factureId: contexte.factureId,
                    codePromotion: r.code,
                    scope: r.scope ?? 'PLAN',
                    montantDeduit: r.montantDeduit,
                })
            );
            await trackingRepo.save(records);
        }
    }

    async enregistrerUtilisationBundle(
        bundleIds: string[],
        contexte?: {
            etablissementId?: string;
            factureId?: string;
            bundles?: Array<{ bundleId: string; code: string; montantDeduit: number }>;
        }
    ): Promise<void> {
        // 1. Incrémenter le compteur sur le bundle
        for (const id of bundleIds) {
            await this.bundleRepo.increment({ id }, 'utilisations', 1);
        }

        // 2. BUG-3 FIX : Traçabilité PromotionUtilisee pour les bundles (comme les promos)
        if (contexte?.etablissementId && contexte?.bundles?.length) {
            const trackingRepo = AppDataSource.getRepository(PromotionUtilisee);
            const records = contexte.bundles.map((b) =>
                trackingRepo.create({
                    promotionId: b.bundleId,
                    etablissementId: contexte.etablissementId!,
                    factureId: contexte.factureId,
                    codePromotion: b.code,
                    scope: 'BUNDLE',
                    montantDeduit: b.montantDeduit,
                })
            );
            await trackingRepo.save(records);
        }
    }

    // =============================================
    // STATISTIQUES D'UTILISATION
    // =============================================

    /**
     * Statistiques d'utilisation des promotions (paginé + agrégation).
     * Délègue depuis le controller pour respecter le pattern service.
     */
    async getUsageStats(options: {
        page?: number;
        limit?: number;
        scope?: string;
        etablissementId?: string;
    }): Promise<{
        historique: PromotionUtilisee[];
        parPromotion: Array<{ code: string; scope: string; nbUtilisations: string; montantTotalDeduit: string }>;
        resume: { totalDeduit: number; totalUtilisations: number; nbPromotionsDistinctes: number };
        pagination: { page: number; limit: number; total: number; totalPages: number };
    }> {
        const trackingRepo = AppDataSource.getRepository(PromotionUtilisee);
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const offset = (page - 1) * limit;

        // Filtres dynamiques
        const where: Record<string, unknown> = {};
        if (options.scope) where.scope = options.scope;
        if (options.etablissementId) where.etablissementId = options.etablissementId;

        // Historique paginé
        const [historique, total] = await trackingRepo.findAndCount({
            where,
            order: { dateUtilisation: 'DESC' },
            take: limit,
            skip: offset,
        });

        // Agrégation par promotion (code + scope)
        const qb = trackingRepo
            .createQueryBuilder('pu')
            .select('pu.codePromotion', 'code')
            .addSelect('pu.scope', 'scope')
            .addSelect('COUNT(*)', 'nbUtilisations')
            .addSelect('SUM(pu."montantDeduit")', 'montantTotalDeduit');

        if (options.etablissementId) {
            qb.where('pu."etablissementId" = :etabId', { etabId: options.etablissementId });
        }
        if (options.scope) {
            qb.andWhere('pu.scope = :scope', { scope: options.scope });
        }

        const parPromotion = await qb
            .groupBy('pu.codePromotion')
            .addGroupBy('pu.scope')
            .orderBy('SUM(pu."montantDeduit")', 'DESC')
            .getRawMany();

        // Résumé global
        const resumeQb = trackingRepo.createQueryBuilder('pu');
        if (options.etablissementId) {
            resumeQb.where('pu."etablissementId" = :etabId', { etabId: options.etablissementId });
        }
        const resume = await resumeQb
            .select('COALESCE(SUM(pu."montantDeduit"), 0)', 'totalDeduit')
            .addSelect('COUNT(*)', 'totalUtilisations')
            .addSelect('COUNT(DISTINCT pu."promotionId")', 'nbPromotionsDistinctes')
            .getRawOne();

        return {
            historique,
            parPromotion,
            resume: {
                totalDeduit: Number(resume?.totalDeduit ?? 0),
                totalUtilisations: Number(resume?.totalUtilisations ?? 0),
                nbPromotionsDistinctes: Number(resume?.nbPromotionsDistinctes ?? 0),
            },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    /**
     * Génère un CSV des statistiques d'utilisation des promotions.
     * Retourne une string CSV (UTF-8 avec BOM pour Excel).
     */
    async genererExportCSV(options?: {
        scope?: string;
        etablissementId?: string;
    }): Promise<string> {
        const trackingRepo = AppDataSource.getRepository(PromotionUtilisee);

        const where: Record<string, unknown> = {};
        if (options?.scope) where.scope = options.scope;
        if (options?.etablissementId) where.etablissementId = options.etablissementId;

        const records = await trackingRepo.find({
            where,
            order: { dateUtilisation: 'DESC' },
            take: 5000, // Limite de sécurité
        });

        // BOM UTF-8 pour Excel
        const BOM = '\uFEFF';
        const header = 'Date;Code Promotion;Scope;Établissement;Facture;Montant Déduit\n';
        const rows = records.map((r) =>
            [
                new Date(r.dateUtilisation).toLocaleDateString('fr-FR'),
                r.codePromotion ?? '',
                r.scope ?? '',
                r.etablissementId ?? '',
                r.factureId ?? '',
                Number(r.montantDeduit).toFixed(0),
            ].join(';')
        ).join('\n');

        return BOM + header + rows;
    }

    /**
     * Exporte la configuration des promotions en CSV.
     * Colonnes : code, nom, scope, type, valeur, duree, statut, dates, priorite, coupon.
     */
    async exporterPromotionsCSV(options?: {
        scope?: string;
        actif?: boolean;
    }): Promise<string> {
        const where: Record<string, unknown> = {};
        if (options?.scope) where.scope = options.scope;
        if (options?.actif !== undefined) where.actif = options.actif;

        const promotions = await this.promoRepo.find({
            where,
            order: { priorite: 'DESC', code: 'ASC' },
            take: 5000,
        });

        const BOM = '\uFEFF';
        const header = 'Code;Nom;Scope;Type;Valeur;Durée;Statut;Date début;Date fin;Priorité;Coupon;Cumulable\n';
        const rows = promotions.map((p) =>
            [
                p.code,
                p.nom,
                p.scope,
                p.typePromotion,
                p.valeur,
                p.dureeApplication,
                p.actif ? 'ACTIF' : 'INACTIF',
                p.dateDebut ? new Date(p.dateDebut).toISOString().slice(0, 10) : '',
                p.dateFin ? new Date(p.dateFin).toISOString().slice(0, 10) : '',
                p.priorite,
                p.codeCoupon ?? '',
                p.cumulable ? 'OUI' : 'NON',
            ].join(';')
        ).join('\n');

        return BOM + header + rows;
    }

    /**
     * Importe des promotions depuis un CSV.
     * Format attendu : Code;Nom;Scope;Type;Valeur;Durée;Priorité;Coupon;Cumulable
     * Upsert par code unique. Retourne le nombre de créations/mises à jour.
     */
    async importerPromotionsCSV(csvContent: string): Promise<{
        created: number;
        updated: number;
        errors: Array<{ ligne: number; code: string; erreur: string }>;
    }> {
        const lines = csvContent
            .replace(/^\uFEFF/, '') // BOM
            .split(/\r?\n/)
            .filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
            throw new AppError('CSV vide ou sans données (header + lignes requises)', 400, 'CSV_EMPTY');
        }

        // Sécurité : max 1000 lignes (header + 999 promotions)
        const MAX_CSV_LINES = 1000;
        if (lines.length > MAX_CSV_LINES) {
            throw new AppError(
                `CSV trop volumineux (${lines.length} lignes). Maximum autorisé : ${MAX_CSV_LINES} lignes`,
                413,
                'CSV_TOO_MANY_LINES'
            );
        }

        // Parser le header pour valider les colonnes
        const headerLine = lines[0].toLowerCase();
        const requiredCols = ['code', 'nom', 'scope', 'type', 'valeur'];
        for (const col of requiredCols) {
            if (!headerLine.includes(col)) {
                throw new AppError(`Colonne manquante : "${col}". Header attendu : Code;Nom;Scope;Type;Valeur;...`, 400, 'CSV_HEADER_INVALID');
            }
        }

        let created = 0;
        let updated = 0;
        const errors: Array<{ ligne: number; code: string; erreur: string }> = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(';').map((c) => c.trim());
            const [code, nom, scope, type, valeurStr, duree, statut, dateDebut, dateFin, prioriteStr, coupon, cumulable] = cols;

            if (!code || !nom) {
                errors.push({ ligne: i + 1, code: code || '(vide)', erreur: 'Code et nom obligatoires' });
                continue;
            }

            // Valider le scope
            const validScopes = Object.values(ScopePromotion);
            if (!validScopes.includes(scope as ScopePromotion)) {
                errors.push({ ligne: i + 1, code, erreur: `Scope invalide: ${scope}. Attendu: ${validScopes.join(', ')}` });
                continue;
            }

            // Valider le type
            const validTypes = Object.values(TypePromotion);
            if (!validTypes.includes(type as TypePromotion)) {
                errors.push({ ligne: i + 1, code, erreur: `Type invalide: ${type}. Attendu: ${validTypes.join(', ')}` });
                continue;
            }

            const valeur = parseFloat(valeurStr);
            if (isNaN(valeur) || valeur < 0) {
                errors.push({ ligne: i + 1, code, erreur: `Valeur invalide: ${valeurStr}` });
                continue;
            }

            try {
                const existing = await this.promoRepo.findOne({ where: { code } });
                const data: Partial<Promotion> = {
                    code,
                    nom,
                    scope: scope as ScopePromotion,
                    typePromotion: type as TypePromotion,
                    valeur,
                    dureeApplication: (duree as DureeApplicationPromotion) || DureeApplicationPromotion.PERMANENTE,
                    actif: statut?.toUpperCase() !== 'INACTIF',
                    priorite: parseInt(prioriteStr) || 0,
                    codeCoupon: coupon || undefined,
                    cumulable: cumulable?.toUpperCase() === 'OUI',
                    dateDebut: dateDebut ? new Date(dateDebut) : new Date(),
                    dateFin: dateFin ? new Date(dateFin) : undefined,
                };

                if (existing) {
                    Object.assign(existing, data);
                    await this.promoRepo.save(existing);
                    updated++;
                } else {
                    const promo = this.promoRepo.create(data);
                    await this.promoRepo.save(promo);
                    created++;
                }
            } catch (err: any) {
                errors.push({ ligne: i + 1, code, erreur: err.message?.slice(0, 100) || 'Erreur inconnue' });
            }
        }

        logger.info(`[Promotions] Import CSV terminé : ${created} créées, ${updated} mises à jour, ${errors.length} erreurs`);
        return { created, updated, errors };
    }

    /**
     * Analytics avancées pour le dashboard plateforme.
     * Retourne : répartition par scope, évolution mensuelle (6 mois),
     * top 5 promotions, répartition auto-promotions, taux d'activité.
     */
    async getAnalytics(etablissementId?: string): Promise<{
        repartitionScope: Array<{ scope: string; montantDeduit: number; nbUtilisations: number; pourcentage: number }>;
        evolutionMensuelle: Array<{ mois: string; montantDeduit: number; nbUtilisations: number }>;
        topPromotions: Array<{ code: string; nom: string; scope: string; montantDeduit: number; nbUtilisations: number }>;
        repartitionAutoPromo: Array<{ type: string; nbPromotions: number }>;
        tauxActivite: { promotionsActives: number; promotionsUtilisees30j: number; tauxActivation: number };
    }> {
        const trackingRepo = AppDataSource.getRepository(PromotionUtilisee);
        const promoRepo = this.promoRepo;

        const whereBuilder = (base: string) => {
            if (etablissementId) {
                return `${base} AND pu."etablissementId" = :etabId`;
            }
            return base;
        };

        // 1. Répartition par scope
        const repartitionScope = await trackingRepo
            .createQueryBuilder('pu')
            .select('pu.scope', 'scope')
            .addSelect('COALESCE(SUM(pu."montantDeduit"), 0)', 'montantDeduit')
            .addSelect('COUNT(*)', 'nbUtilisations')
            .where(whereBuilder('1=1'))
            .setParameter('etabId', etablissementId)
            .groupBy('pu.scope')
            .orderBy('COALESCE(SUM(pu."montantDeduit"), 0)', 'DESC')
            .getRawMany();

        const totalGeneral = repartitionScope.reduce((s, r) => s + Number(r.montantDeduit), 0);
        const repartitionScopeFormatted = repartitionScope.map((r) => ({
            scope: r.scope,
            montantDeduit: Number(r.montantDeduit),
            nbUtilisations: Number(r.nbUtilisations),
            pourcentage: totalGeneral > 0 ? Math.round((Number(r.montantDeduit) / totalGeneral) * 100) : 0,
        }));

        // 2. Évolution mensuelle (6 derniers mois)
        const evolutionMensuelle = await trackingRepo
            .createQueryBuilder('pu')
            .select(`TO_CHAR(DATE_TRUNC('month', pu."dateUtilisation"), 'YYYY-MM')`, 'mois')
            .addSelect('COALESCE(SUM(pu."montantDeduit"), 0)', 'montantDeduit')
            .addSelect('COUNT(*)', 'nbUtilisations')
            .where(whereBuilder(`pu."dateUtilisation" >= NOW() - INTERVAL '6 months'`))
            .setParameter('etabId', etablissementId)
            .groupBy(`DATE_TRUNC('month', pu."dateUtilisation")`)
            .orderBy(`DATE_TRUNC('month', pu."dateUtilisation")`, 'ASC')
            .getRawMany();

        const evolutionFormatted = evolutionMensuelle.map((r) => ({
            mois: r.mois,
            montantDeduit: Number(r.montantDeduit),
            nbUtilisations: Number(r.nbUtilisations),
        }));

        // 3. Top 5 promotions par montant déduit
        const topPromotions = await trackingRepo
            .createQueryBuilder('pu')
            .select('pu.codePromotion', 'code')
            .addSelect('pu.scope', 'scope')
            .addSelect('COALESCE(SUM(pu."montantDeduit"), 0)', 'montantDeduit')
            .addSelect('COUNT(*)', 'nbUtilisations')
            .where(whereBuilder('1=1'))
            .setParameter('etabId', etablissementId)
            .groupBy('pu.codePromotion')
            .addGroupBy('pu.scope')
            .orderBy('COALESCE(SUM(pu."montantDeduit"), 0)', 'DESC')
            .limit(5)
            .getRawMany();

        // Enrichir avec les noms depuis la table promotions
        const codes = topPromotions.map((r) => r.code);
        let nomsMap: Record<string, string> = {};
        if (codes.length > 0) {
            const promos = await promoRepo
                .createQueryBuilder('p')
                .select(['p.code', 'p.nom'])
                .where('p.code IN (:...codes)', { codes })
                .getMany();
            nomsMap = Object.fromEntries(promos.map((p) => [p.code, p.nom]));
        }

        const topPromotionsFormatted = topPromotions.map((r) => ({
            code: r.code,
            nom: nomsMap[r.code] ?? r.code,
            scope: r.scope,
            montantDeduit: Number(r.montantDeduit),
            nbUtilisations: Number(r.nbUtilisations),
        }));

        // 4. Répartition auto-promotions (par type dans config)
        const repartitionAutoPromo = await promoRepo
            .createQueryBuilder('p')
            .select("p.config->>'typeAutomatique'", 'type')
            .addSelect('COUNT(*)', 'nbPromotions')
            .where("p.config->>'typeAutomatique' IS NOT NULL")
            .andWhere("p.config->>'typeAutomatique' != 'MANUELLE'")
            .groupBy("p.config->>'typeAutomatique'")
            .orderBy('COUNT(*)', 'DESC')
            .getRawMany();

        const repartitionAutoPromoFormatted = repartitionAutoPromo.map((r) => ({
            type: r.type,
            nbPromotions: Number(r.nbPromotions),
        }));

        // 5. Taux d'activité (promotions actives vs utilisées dans les 30 derniers jours)
        const promotionsActives = await promoRepo.count({ where: { actif: true } });
        const used30jResult = await trackingRepo
            .createQueryBuilder('pu')
            .select('COUNT(DISTINCT pu."promotionId")', 'nb')
            .where(whereBuilder(`pu."dateUtilisation" >= NOW() - INTERVAL '30 days'`))
            .setParameter('etabId', etablissementId)
            .getRawOne();
        const promotionsUtilisees30j = Number(used30jResult?.nb ?? 0);
        const tauxActivation = promotionsActives > 0
            ? Math.round((promotionsUtilisees30j / promotionsActives) * 100)
            : 0;

        return {
            repartitionScope: repartitionScopeFormatted,
            evolutionMensuelle: evolutionFormatted,
            topPromotions: topPromotionsFormatted,
            repartitionAutoPromo: repartitionAutoPromoFormatted,
            tauxActivite: { promotionsActives, promotionsUtilisees30j, tauxActivation },
        };
    }

    // =============================================
    // PROMOTIONS ÉLIGIBLES
    // =============================================

    /**
     * Active les promotions programmées dont la dateProgrammation est atteinte.
     *
     * @deprecated Le cron job `cronExpirationPromotions` (cron-jobs.ts L845)
     * gère déjà l'activation via QueryBuilder direct. Cette méthode reste
     * disponible pour appel manuel/service mais n'est plus utilisée par le cron.
     *
     * Retourne le nombre de promotions activées.
     */
    async activerPromotionsProgrammees(): Promise<number> {
        const now = new Date();
        const programmees = await this.promoRepo.find({
            where: {
                estProgrammee: true,
                actif: false,
            },
        });

        let nbActivees = 0;
        for (const promo of programmees) {
            if (promo.dateProgrammation && promo.dateProgrammation <= now) {
                promo.actif = true;
                promo.estProgrammee = false;
                await this.promoRepo.save(promo);
                nbActivees++;
                logger.info(`[Promotions] Promotion programmée activée : ${promo.code}`);
            }
        }

        if (nbActivees > 0) {
            logger.info(`[Promotions] ${nbActivees} promotion(s) programmée(s) activée(s)`);
        }
        return nbActivees;
    }

    /**
     * Recherche une promotion par son code coupon (recherche directe DB).
     * Retourne null si aucun coupon ne correspond.
     */
    async trouverParCoupon(codeCoupon: string): Promise<Promotion | null> {
        return this.promoRepo.findOne({
            where: {
                codeCoupon: codeCoupon.toUpperCase(),
                actif: true,
            },
        });
    }

    /**
     * Retourne les promotions actives et éligibles pour un contexte donné.
     * Utilisé par le billing controller (détail abonnement) et le
     * promotions controller (endpoint client /eligibles).
     */
    async trouverPromotionsEligibles(ctx: ContextePromotion): Promise<Promotion[]> {
        const toutesPromos = await this.promoRepo.find({ where: { actif: true } });
        return toutesPromos.filter((p) => this.estValide(p, ctx));
    }

    /**
     * Retourne les bundles actifs et éligibles pour un contexte donné.
     */
    async trouverBundlesEligibles(ctx: ContextePromotion): Promise<BundlePromotion[]> {
        const tousBundles = await this.bundleRepo.find({ where: { actif: true } });
        return tousBundles.filter((b) => this.estBundleValide(b, ctx));
    }

    // =============================================
    // MÉTHODES PRIVÉES
    // =============================================

    /** Une promotion est-elle valide pour ce contexte ? */
    estValide(promo: Promotion, ctx: ContextePromotion): boolean {
        // Sécurité : contexte par défaut si undefined/null
        const c = ctx ?? {};

        if (!promo.actif) return false;

        // ─── PLANIFICATION : promotions programmées non encore activées ───
        if (promo.estProgrammee && promo.dateProgrammation && new Date(promo.dateProgrammation) > new Date()) {
            return false;
        }

        const now = new Date();
        if (promo.dateDebut && now < new Date(promo.dateDebut)) return false;
        if (promo.dateFin && now > new Date(promo.dateFin)) return false;

        // Max utilisations
        if (promo.maxUtilisations !== null && promo.maxUtilisations !== undefined && promo.utilisations >= promo.maxUtilisations) {
            return false;
        }

        // ─── BUG-1 FIX : Filtrage par cibleId (cible spécifique) ───
        // Si cibleId est défini, la promotion ne s'applique qu'à cette cible précise
        if (promo.cibleId) {
            switch (promo.scope) {
                case ScopePromotion.PLAN:
                    if (c.planId && c.planId !== promo.cibleId) return false;
                    break;
                case ScopePromotion.PACK:
                    // cibleId = packId spécifique — vérifier qu'il est souscrit
                    if (c.packsSouscritsIds?.length && !c.packsSouscritsIds.includes(promo.cibleId)) return false;
                    break;
                case ScopePromotion.MODULE:
                    if (c.modulesSouscritsIds?.length && !c.modulesSouscritsIds.includes(promo.cibleId)) return false;
                    break;
            }
        }

        const cond = promo.conditions ?? {};

        // Condition nombre d'élèves
        if (cond.nombreElevesMin !== undefined && cond.nombreElevesMin !== null) {
            if ((c.nombreEleves ?? 0) < cond.nombreElevesMin) return false;
        }

        // Condition ancienneté
        if (cond.ancienneteMois !== undefined && cond.ancienneteMois !== null) {
            if (!c.dateDebutAbonnement) return false;
            const mois = this.calculerAncienneteMois(c.dateDebutAbonnement, now);
            if (mois < cond.ancienneteMois) return false;
        }

        // Condition plans requis (cross-sell)
        if (cond.plansRequis && cond.plansRequis.length > 0) {
            if (!c.planId || !cond.plansRequis.includes(c.planId)) return false;
        }

        // Condition packs requis (cross-sell pack→pack)
        if (cond.packsRequis && cond.packsRequis.length > 0) {
            const souscrits = c.packsSouscritsIds ?? [];
            const tousPrésents = cond.packsRequis.every((id) => souscrits.includes(id));
            if (!tousPrésents) return false;
        }

        // Condition modules requis
        if (cond.modulesRequis && cond.modulesRequis.length > 0) {
            const souscrits = c.modulesSouscritsIds ?? [];
            const tousPrésents = cond.modulesRequis.every((id) => souscrits.includes(id));
            if (!tousPrésents) return false;
        }

        // ─── BUG-2 FIX : Condition ressource cible (scope=PACK) ───
        // Si cibleRessource est défini, vérifier qu'au moins un pack souscrit
        // correspond à cette ressource. Le contexte doit contenir packRessources
        // (map packId → ressource) pour une vérification précise.
        if (promo.cibleRessource && promo.scope === ScopePromotion.PACK) {
            const packRessources = c.packRessources ?? {};
            const souscrits = c.packsSouscritsIds ?? [];
            // Si le contexte a des ressources de packs, vérifier le match
            if (Object.keys(packRessources).length > 0) {
                const matchRessource = souscrits.some(
                    (packId) => packRessources[packId] === promo.cibleRessource
                );
                if (!matchRessource) return false;
            }
            // Sinon (contexte sans ressources) + cibleId non défini → on laisse passer
            // (la promo s'applique à tous les packs de cette ressource)
        }

        // Durée d'application
        const numeroCycle = ctx.numeroCycle ?? 0;
        if (promo.dureeApplication === DureeApplicationPromotion.PREMIERE_FACTURE && numeroCycle > 0) return false;
        if (promo.dureeApplication === DureeApplicationPromotion.N_CYCLES) {
            const nbCycles = cond.nbCycles ?? promo.conditions?.nbCycles ?? 0;
            if (numeroCycle >= nbCycles) return false;
        }

        // ─── AUTO-PROMOTIONS : évaluation des déclencheurs ───
        const config = promo.config as ConfigPromotion | undefined;
        const typeAuto = config?.typeAutomatique;
        if (typeAuto && typeAuto !== TypeAutoPromotion.MANUELLE) {
            if (!this.evaluerDeclencheur(typeAuto, config?.declencheur ?? {}, ctx)) return false;
        }

        return true;
    }

    /**
     * Évalue si un déclencheur automatique est satisfait pour le contexte donné.
     */
    private evaluerDeclencheur(
        type: TypeAutoPromotion,
        declencheur: Record<string, unknown>,
        ctx: ContextePromotion,
    ): boolean {
        const c = ctx ?? {};
        switch (type) {
            case TypeAutoPromotion.NOUVEAU_CLIENT:
                return c.estPremierAbonnement === true;

            case TypeAutoPromotion.FIDELITE: {
                const moisMin = (declencheur.moisAnciennete as number) ?? 12;
                if (!c.dateDebutAbonnement) return false;
                return this.calculerAncienneteMois(c.dateDebutAbonnement, new Date()) >= moisMin;
            }

            case TypeAutoPromotion.UPGRADE:
                return !!c.planPrecedentId && c.planPrecedentId !== c.planId;

            case TypeAutoPromotion.CROSS_SELL:
                // Cross-sell : au moins 1 pack ou module déjà souscrit
                return (c.packsSouscritsIds?.length ?? 0) > 0 || (c.modulesSouscritsIds?.length ?? 0) > 0;

            case TypeAutoPromotion.FREE_TRIAL: {
                // Free trial : vérifier qu'on est dans la période d'essai
                const dureeMois = (declencheur.dureeMois as number) ?? 1;
                if (!c.dateDebutAbonnement) return false;
                return this.calculerAncienneteMois(c.dateDebutAbonnement, new Date()) < dureeMois;
            }

            case TypeAutoPromotion.MANUELLE:
            default:
                return true;
        }
    }

    /** Un bundle est-il applicable ? */
    estBundleValide(bundle: BundlePromotion, ctx: ContextePromotion): boolean {
        const c = ctx ?? {};
        if (!bundle.actif) return false;
        const now = new Date();
        if (bundle.dateDebut && now < new Date(bundle.dateDebut)) return false;
        if (bundle.dateFin && now > new Date(bundle.dateFin)) return false;
        if (bundle.maxUtilisations !== null && bundle.maxUtilisations !== undefined && bundle.utilisations >= bundle.maxUtilisations) {
            return false;
        }
        // Code coupon
        if (bundle.codeCoupon && c.codeCoupon !== bundle.codeCoupon) return false;
        // Vérifier que tous les packs du bundle sont souscrits
        const souscrits = c.packsSouscritsIds ?? [];
        return bundle.packIds.every((id) => souscrits.includes(id));
    }

    /** Calcule le total des packs concernés par un bundle */
    private calculerTotalPacksBundle(bundle: BundlePromotion, _montantTotalPacks: number, ctx: ContextePromotion): number {
        const c = ctx ?? {};
        const packMontants = c.packMontants ?? {};
        const souscrits = c.packsSouscritsIds ?? [];
        // Sommer uniquement les montants des packs du bundle effectivement souscrits
        let total = 0;
        for (const packId of bundle.packIds) {
            if (souscrits.includes(packId) && packMontants[packId]) {
                total += packMontants[packId];
            }
        }
        // Fallback : si aucun montant individuel, utiliser le montant total prorata
        if (total === 0 && souscrits.length > 0) {
            const nbPacksBundle = bundle.packIds.filter((id) => souscrits.includes(id)).length;
            if (nbPacksBundle > 0) {
                total = (_montantTotalPacks / souscrits.length) * nbPacksBundle;
            }
        }
        return Math.round(total * 100) / 100;
    }

    /** Calcule la déduction d'une promotion sur un montant (avec paliers volume si configurés) */
    private calculerDeduction(promo: Promotion, montant: number, ctx?: ContextePromotion): number {
        const config = promo.config as ConfigPromotion | undefined;
        const paliers = config?.paliersVolume;

        // Si paliers de volume configurés, utiliser le palier correspondant
        if (paliers && paliers.length > 0 && ctx) {
            const quantite = ctx.quantiteRessource ?? ctx.nombreEleves ?? 0;
            const palierActif = paliers.find((p) => quantite >= p.min && (p.max === null || quantite <= p.max));
            if (palierActif) {
                if (promo.typePromotion === TypePromotion.POURCENTAGE) {
                    return Math.round(montant * (palierActif.valeur / 100) * 100) / 100;
                }
                return Math.min(palierActif.valeur, montant);
            }
            // Aucun palier atteint → pas de déduction
            return 0;
        }

        const valeur = Number(promo.valeur);
        if (promo.typePromotion === TypePromotion.POURCENTAGE) {
            return Math.round(montant * (valeur / 100) * 100) / 100;
        }
        if (promo.typePromotion === TypePromotion.GRATUITE) {
            return montant; // 100% = gratuit total
        }
        return Math.min(valeur, montant);
    }

    /** Écrête la déduction pour respecter le plafond */
    private écréter(deduit: number, totalDeduit: number, deductionMax: number): number {
        if (totalDeduit + deduit > deductionMax) {
            return Math.round((deductionMax - totalDeduit) * 100) / 100;
        }
        return deduit;
    }

    /** Convertit une promotion en résultat de ligne */
    private toLigneResult(promo: Promotion, montantDeduit: number): LignePromotionResult {
        return {
            promotionId: promo.id,
            code: promo.code,
            type: promo.typePromotion,
            scope: promo.scope,
            valeur: Number(promo.valeur),
            montantDeduit,
        };
    }

    /** Calcule l'ancienneté en mois révolus */
    private calculerAncienneteMois(dateDebut: Date, dateReference: Date): number {
        const years = dateReference.getFullYear() - dateDebut.getFullYear();
        const months = dateReference.getMonth() - dateDebut.getMonth();
        let totalMois = years * 12 + months;
        if (dateReference.getDate() < dateDebut.getDate()) {
            totalMois--;
        }
        return Math.max(0, totalMois);
    }
}

export const promotionService = new PromotionService();
export default PromotionService;
