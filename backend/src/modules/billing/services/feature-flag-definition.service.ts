/**
 * ==================================
 * eLISAschool - Service FeatureFlagDefinition
 * ==================================
 * Gestion du registre centralisé des feature flags.
 * CRUD des définitions + métadonnées + expiration.
 * 
 * Migration 210 — Refonte Feature Flags
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository, LessThan, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { FeatureFlagDefinition, CategorieFlag, TypeFlag } from '../entities/feature-flag-definition.entity';
import { FeatureFlagHistory, ActionFeatureFlag } from '../entities/feature-flag-history.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

// =============================================
// Types DTO
// =============================================

export interface CreerDefinitionDto {
    cle: string;
    label: string;
    description?: string;
    categorie?: CategorieFlag;
    type?: TypeFlag;
    valeurDefaut?: boolean;
    planMinimal?: string;
    rolloutPercentage?: number;
    segments?: Array<{ champ: string; operateur: string; valeur: string }>;
    estSysteme?: boolean;
    expiresAt?: Date;
}

export interface ModifierDefinitionDto {
    label?: string;
    description?: string;
    categorie?: CategorieFlag;
    type?: TypeFlag;
    valeurDefaut?: boolean;
    planMinimal?: string;
    rolloutPercentage?: number;
    segments?: Array<{ champ: string; operateur: string; valeur: string }>;
    estActif?: boolean;
    expiresAt?: Date;
}

export interface DefinitionAvecMetadata {
    id: string;
    cle: string;
    label: string;
    description: string | null;
    categorie: CategorieFlag;
    type: TypeFlag;
    valeurDefaut: boolean;
    planMinimal: string | null;
    rolloutPercentage: number;
    segments: Array<{ champ: string; operateur: string; valeur: string }>;
    estSysteme: boolean;
    estActif: boolean;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    // Métadonnées calculées
    nombreOverrides?: number;
    pourcentageActif?: number;
}

// =============================================
// Service
// =============================================

export class FeatureFlagDefinitionService {
    private definitionRepo: Repository<FeatureFlagDefinition>;
    private historyRepo: Repository<FeatureFlagHistory>;

    // Cache en mémoire (TTL 60 secondes)
    private cache: Map<string, { value: any; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 60 * 1000;

    constructor() {
        this.definitionRepo = AppDataSource.getRepository(FeatureFlagDefinition);
        this.historyRepo = AppDataSource.getRepository(FeatureFlagHistory);
    }

    /**
     * Liste toutes les définitions de feature flags.
     */
    async findAllDefinitions(): Promise<FeatureFlagDefinition[]> {
        const cacheKey = 'all_definitions';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.value;
        }

        const definitions = await this.definitionRepo.find({
            order: { categorie: 'ASC', cle: 'ASC' },
        });

        this.cache.set(cacheKey, { value: definitions, timestamp: Date.now() });
        return definitions;
    }

    /**
     * Trouve une définition par sa clé unique.
     */
    async findDefinitionByCle(cle: string): Promise<FeatureFlagDefinition | null> {
        const cacheKey = `definition:${cle}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.value;
        }

        const definition = await this.definitionRepo.findOne({
            where: { cle },
        });

        if (definition) {
            this.cache.set(cacheKey, { value: definition, timestamp: Date.now() });
        }
        return definition;
    }

    /**
     * Trouve une définition par son ID.
     */
    async findDefinitionById(id: string): Promise<FeatureFlagDefinition> {
        const definition = await this.definitionRepo.findOne({ where: { id } });
        if (!definition) {
            throw new AppError(`Feature flag '${id}' introuvable`, 404, 'FEATURE_FLAG_NOT_FOUND');
        }
        return definition;
    }

    /**
     * Crée une nouvelle définition de feature flag.
     */
    async createDefinition(dto: CreerDefinitionDto, modifiePar?: string): Promise<FeatureFlagDefinition> {
        // Vérifier l'unicité de la clé
        const existing = await this.definitionRepo.findOne({ where: { cle: dto.cle } });
        if (existing) {
            throw new AppError(`Le feature flag '${dto.cle}' existe déjà`, 409, 'FEATURE_FLAG_EXISTS');
        }

        const definition = this.definitionRepo.create({
            cle: dto.cle.toLowerCase().replace(/\s+/g, '_'),
            label: dto.label,
            description: dto.description,
            categorie: dto.categorie || CategorieFlag.GENERAL,
            type: dto.type || TypeFlag.RELEASE,
            valeurDefaut: dto.valeurDefaut ?? false,
            planMinimal: dto.planMinimal,
            rolloutPercentage: dto.rolloutPercentage ?? 100,
            segments: dto.segments || [],
            estSysteme: dto.estSysteme ?? false,
            estActif: true,
            expiresAt: dto.expiresAt,
        });

        const saved = await this.definitionRepo.save(definition);

        // Log dans l'historique
        await this.logHistory({
            flagDefinitionId: saved.id,
            action: ActionFeatureFlag.CREATE,
            nouvelleValeur: JSON.stringify(saved),
            modifiePar,
            commentaire: `Création du feature flag '${saved.cle}'`,
        });

        this.invalidateCache();
        logger.info(`[FeatureFlags] Définition créée : ${saved.cle} (${saved.label})`);

        return saved;
    }

    /**
     * Met à jour une définition existante.
     */
    async updateDefinition(id: string, dto: ModifierDefinitionDto, modifiePar?: string): Promise<FeatureFlagDefinition> {
        const definition = await this.findDefinitionById(id);
        const ancienneValeur = JSON.stringify(definition);

        // Détecter les changements significatifs pour l'historique
        const changements: string[] = [];
        if (dto.rolloutPercentage !== undefined && dto.rolloutPercentage !== definition.rolloutPercentage) {
            changements.push(`rollout: ${definition.rolloutPercentage}% → ${dto.rolloutPercentage}%`);
        }
        if (dto.estActif !== undefined && dto.estActif !== definition.estActif) {
            changements.push(`actif: ${definition.estActif} → ${dto.estActif}`);
        }

        Object.assign(definition, dto);
        const saved = await this.definitionRepo.save(definition);

        // Log dans l'historique
        const action = changements.some(c => c.includes('rollout'))
            ? ActionFeatureFlag.ROLLOUT_CHANGE
            : changements.some(c => c.includes('actif'))
                ? ActionFeatureFlag.SEGMENT_CHANGE
                : ActionFeatureFlag.SEGMENT_CHANGE;

        await this.logHistory({
            flagDefinitionId: saved.id,
            action,
            ancienneValeur,
            nouvelleValeur: JSON.stringify(saved),
            modifiePar,
            commentaire: changements.length > 0 ? changements.join(', ') : 'Modification définition',
        });

        this.invalidateCache();
        logger.info(`[FeatureFlags] Définition modifiée : ${saved.cle}`);

        return saved;
    }

    /**
     * Supprime une définition (sauf si estSysteme = true).
     */
    async deleteDefinition(id: string, modifiePar?: string): Promise<void> {
        const definition = await this.findDefinitionById(id);

        if (definition.estSysteme) {
            throw new AppError(
                `Le feature flag '${definition.cle}' est un flag système et ne peut pas être supprimé`,
                403,
                'FEATURE_FLAG_SYSTEME'
            );
        }

        // Log avant suppression
        await this.logHistory({
            flagDefinitionId: definition.id,
            action: ActionFeatureFlag.DELETE,
            ancienneValeur: JSON.stringify(definition),
            modifiePar,
            commentaire: `Suppression du feature flag '${definition.cle}'`,
        });

        await this.definitionRepo.remove(definition);
        this.invalidateCache();
        logger.info(`[FeatureFlags] Définition supprimée : ${definition.cle}`);
    }

    /**
     * Retourne les flags groupés par catégorie.
     */
    async getFlagsByCategorie(): Promise<Record<string, FeatureFlagDefinition[]>> {
        const definitions = await this.findAllDefinitions();
        const grouped: Record<string, FeatureFlagDefinition[]> = {};

        for (const def of definitions) {
            if (!grouped[def.categorie]) {
                grouped[def.categorie] = [];
            }
            grouped[def.categorie].push(def);
        }

        return grouped;
    }

    /**
     * Détecte les flags expirés (pour cron job).
     */
    async findExpiredFlags(): Promise<FeatureFlagDefinition[]> {
        return this.definitionRepo.find({
            where: {
                estActif: true,
                expiresAt: LessThan(new Date()),
            },
        });
    }

    /**
     * Détecte les flags sans définition (orphelins dans feature_flags_tenant).
     */
    async findOrphanFlags(): Promise<Array<{ flagName: string; count: number }>> {
        const definitions = await this.definitionRepo.find({ select: ['cle'] });
        const knownCles = new Set(definitions.map(d => d.cle));

        // Requêter les flags distinct dans feature_flags_tenant
        const orphanResults = await this.definitionRepo.manager.query(`
            SELECT DISTINCT fft."flagName", COUNT(*) as count
            FROM feature_flags_tenant fft
            WHERE fft."flagName" NOT IN (
                SELECT cle FROM feature_flag_definitions WHERE est_actif = true
            )
            AND fft."flagName" NOT LIKE 'module_%'
            GROUP BY fft."flagName"
            ORDER BY count DESC
        `);

        return orphanResults.map((r: any) => ({
            flagName: r.flagName,
            count: parseInt(r.count, 10),
        }));
    }

    /**
     * Log une entrée dans l'historique.
     */
    async logHistory(params: {
        flagDefinitionId?: string;
        etablissementId?: string;
        action: ActionFeatureFlag;
        ancienneValeur?: string;
        nouvelleValeur?: string;
        modifiePar?: string;
        commentaire?: string;
    }): Promise<FeatureFlagHistory> {
        const entry = this.historyRepo.create(params);
        return this.historyRepo.save(entry);
    }

    /**
     * Récupère l'historique paginé.
     */
    async getHistory(params: {
        page?: number;
        limit?: number;
        flagDefinitionId?: string;
        etablissementId?: string;
        action?: ActionFeatureFlag;
    }): Promise<{ data: FeatureFlagHistory[]; total: number }> {
        const { page = 1, limit = 50, flagDefinitionId, etablissementId, action } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (flagDefinitionId) where.flagDefinitionId = flagDefinitionId;
        if (etablissementId) where.etablissementId = etablissementId;
        if (action) where.action = action;

        const [data, total] = await this.historyRepo.findAndCount({
            where,
            relations: ['flagDefinition'],
            order: { createdAt: 'DESC' },
            take: Math.min(limit, 200),
            skip,
        });

        return { data, total };
    }

    /**
     * Invalide le cache.
     */
    invalidateCache(): void {
        this.cache.clear();
    }
}

// Singleton
export const featureFlagDefinitionService = new FeatureFlagDefinitionService();
