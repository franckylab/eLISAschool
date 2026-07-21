/**
 * ==================================
 * eLISAschool - Service Organisation
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Logique métier pour la gestion de l'organisation :
 * - CRUD Unités, Postes, Hiérarchie
 * - Construction d'arborescence hiérarchique
 * - Gestion des relations de subordination
 * - Statistiques et analyses organisationnelles
 * 
 * Les unités sont rattachées directement à l'établissement.
 */

import { Repository, In, Like } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    UniteOrganisationnelle,
    Poste,
    HierarchiePersonnel,
    TypeUniteOrganisationnelle,
    StatutUnite,
    StatutPoste,
    TypeRelationHierarchique,
} from '../entities';
import {
    CreateUniteOrganisationnelleDto,
    UpdateUniteOrganisationnelleDto,
    CreateHierarchiePersonnelDto,
    UpdateHierarchiePersonnelDto,
    FiltreUnitesDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';
import { configurationOrganisationService } from './configuration.service';

export class OrganisationService {
    private uniteRepo: Repository<UniteOrganisationnelle>;
    private posteRepo: Repository<Poste>;
    private hierarchieRepo: Repository<HierarchiePersonnel>;

    // Configuration du cache
    private readonly CACHE_PREFIX = 'organisation:';
    private CACHE_ARBRESCENCE_TTL = 5 * 60; // 5 minutes (configurable)
    private CACHE_ORGANIGRAMME_TTL = 5 * 60; // 5 minutes (configurable)
    private useRedis = false;

    constructor() {
        this.uniteRepo = AppDataSource.getRepository(UniteOrganisationnelle);
        this.posteRepo = AppDataSource.getRepository(Poste);
        this.hierarchieRepo = AppDataSource.getRepository(HierarchiePersonnel);

        // Vérifier si Redis est disponible (avec retry)
        this.checkRedisAvailability();
        
        // Re-vérifier toutes les 30 secondes
        setInterval(() => this.checkRedisAvailability(), 30000);

        // Charger les configurations dynamiques
        this.chargerConfigurations();
    }

    /**
     * Vérifier la disponibilité de Redis
     */
    private async checkRedisAvailability(): Promise<void> {
        try {
            const available = await redisService.isAvailable();
            if (available && !this.useRedis) {
                this.useRedis = true;
                logger.info('[OrganisationService] ✅ Cache: Redis (distribué)');
            } else if (!available && this.useRedis) {
                this.useRedis = false;
                logger.warn('[OrganisationService] ⚠️  Cache: In-memory (fallback - Redis perdu)');
            }
        } catch (error) {
            // Ignorer les erreurs
        }
    }

    /**
     * Charger les configurations dynamiques
     */
    private async chargerConfigurations(): Promise<void> {
        try {
            const cacheTTL = await configurationOrganisationService.getValeur<number>('organisation.cache_arborescence_ttl');
            if (cacheTTL) {
                this.CACHE_ARBRESCENCE_TTL = cacheTTL;
                this.CACHE_ORGANIGRAMME_TTL = cacheTTL;
                logger.info(`[OrganisationService] TTL cache configuré: ${cacheTTL}s`);
            }
        } catch (error) {
            logger.debug('[OrganisationService] Configuration par défaut utilisée');
        }
    }

    // ==================== UNITÉS ORGANISATIONNELLES ====================

    async createUnite(dto: CreateUniteOrganisationnelleDto): Promise<UniteOrganisationnelle> {
        // Vérifier l'unicité du code au sein de l'établissement
        const existing = await this.uniteRepo.findOne({
            where: {
                code: dto.code,
                etablissementId: dto.etablissementId,
            },
        });

        if (existing) {
            throw new AppError('Une unité avec ce code existe déjà dans cet établissement', 409, 'UNITE_CODE_EXISTS');
        }

        // Si parentId fourni, vérifier qu'il existe
        if (dto.parentId) {
            const parent = await this.uniteRepo.findOne({
                where: { id: dto.parentId, etablissementId: dto.etablissementId },
            });
            if (!parent) {
                throw new AppError('Unité parente non trouvée', 404, 'PARENT_UNITE_NOT_FOUND');
            }
        }

        const unite = this.uniteRepo.create({
            nom: dto.nom,
            description: dto.description,
            type: dto.type as TypeUniteOrganisationnelle,
            code: dto.code,
            etablissementId: dto.etablissementId,
            parentId: dto.parentId,
            ordre: dto.ordre,
            responsableNom: dto.responsableNom,
            responsableId: dto.responsableId,
            localisation: dto.localisation,
            telephone: dto.telephone,
            email: dto.email,
            metadata: dto.metadata,
            statut: StatutUnite.ACTIF,
            actif: true,
        });

        const saved = await this.uniteRepo.save(unite);
        logger.info(`Unité organisationnelle créée: ${saved.nom}`, { uniteId: saved.id });
        return saved;
    }

    async findUnites(filtres: FiltreUnitesDto, etablissementId?: string): Promise<UniteOrganisationnelle[]> {
        const where: any = {};

        if (filtres.etablissementId) {
            where.etablissementId = filtres.etablissementId;
        }

        if (filtres.type) {
            where.type = filtres.type;
        }

        if (filtres.actif !== undefined) {
            where.actif = filtres.actif;
        }

        if (filtres.parentId !== undefined) {
            where.parentId = filtres.parentId;
        }

        // Multi-tenancy: filtrer par etablissementId si fourni
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        return this.uniteRepo.find({
            where,
            relations: ['parent', 'etablissement'],
            order: { ordre: 'ASC', createdAt: 'DESC' },
        });
    }

    // Version paginée
    async findUnitesPaginated(
        filtres: FiltreUnitesDto,
        page: number,
        limit: number,
        etablissementId?: string
    ): Promise<{ data: UniteOrganisationnelle[]; total: number }> {
        const where: any = {};

        if (filtres.etablissementId) {
            where.etablissementId = filtres.etablissementId;
        }
        if (filtres.type) {
            where.type = filtres.type;
        }
        if (filtres.actif !== undefined) {
            where.actif = filtres.actif;
        }
        if (filtres.parentId !== undefined) {
            where.parentId = filtres.parentId;
        }

        // Multi-tenancy
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        const [data, total] = await this.uniteRepo.findAndCount({
            where,
            relations: ['parent'],
            order: { ordre: 'ASC', createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    async findUniteById(id: string, etablissementId?: string): Promise<UniteOrganisationnelle> {
        const where: any = { id };
        
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        const unite = await this.uniteRepo.findOne({
            where,
            relations: ['parent', 'enfants', 'postes'],
        });

        if (!unite) {
            throw new AppError('Unité organisationnelle non trouvée', 404, 'NOT_FOUND');
        }

        return unite;
    }

    async updateUnite(id: string, dto: UpdateUniteOrganisationnelleDto): Promise<UniteOrganisationnelle> {
        const unite = await this.findUniteById(id);
        const ancienEtablissementId = unite.etablissementId;
        
        Object.assign(unite, dto);
        const updated = await this.uniteRepo.save(unite);
        logger.info(`Unité modifiée: ${updated.nom}`, { uniteId: updated.id });
        
        // Invalider le cache
        await this.invalidateArborescenceCache(ancienEtablissementId);
        
        return updated;
    }

    async deleteUnite(id: string): Promise<void> {
        const unite = await this.findUniteById(id);

        // Vérifier qu'il n'y a pas d'enfants
        const enfants = await this.uniteRepo.find({ where: { parentId: id } });
        if (enfants.length > 0) {
            throw new AppError(
                'Impossible de supprimer une unité qui a des enfants. Supprimez d\'abord les unités enfants.',
                400,
                'UNITE_HAS_CHILDREN'
            );
        }

        // Vérifier qu'il n'y a pas de postes
        const postes = await this.posteRepo.find({ where: { uniteOrganisationnelleId: id } });
        if (postes.length > 0) {
            throw new AppError(
                'Impossible de supprimer une unité qui a des postes. Supprimez d\'abord les postes.',
                400,
                'UNITE_HAS_POSTES'
            );
        }

        const etablissementId = unite.etablissementId;
        await this.uniteRepo.remove(unite);
        logger.info(`Unité supprimée: ${unite.nom}`, { uniteId: id });

        // Invalider le cache
        await this.invalidateArborescenceCache(etablissementId);
    }

    async countUnitesActives(etablissementId: string): Promise<number> {
        return this.uniteRepo.count({
            where: { etablissementId, actif: true },
        });
    }

    // ==================== ARBORESCENCE HIÉRARCHIQUE ====================

    async buildArborescence(etablissementId: string): Promise<any[]> {
        // Clé de cache
        const cacheKey = `${this.CACHE_PREFIX}arborescence:${etablissementId}`;

        // Essayer de récupérer depuis le cache Redis
        if (this.useRedis) {
            try {
                const cached = await redisService.getJSON<any[]>(cacheKey);
                if (cached) {
                    logger.debug(`[Organisation] Cache hit: arborescence ${etablissementId}`);
                    return cached;
                }
            } catch (error) {
                logger.warn('[Organisation] Échec lecture cache Redis', error);
            }
        }

        // Cache miss ou Redis non disponible - construire l'arborescence
        const unites = await this.uniteRepo.find({
            where: { etablissementId },
            order: { ordre: 'ASC' },
        });

        // Construire l'arbre
        const unitesMap = new Map<string, any>();
        const racines: any[] = [];

        // Créer un map de toutes les unités
        unites.forEach((unite) => {
            unitesMap.set(unite.id, {
                ...unite,
                enfants: [],
            });
        });

        // Construire la hiérarchie
        unites.forEach((unite) => {
            const node = unitesMap.get(unite.id);
            if (unite.parentId && unitesMap.has(unite.parentId)) {
                const parent = unitesMap.get(unite.parentId);
                parent.enfants.push(node);
            } else {
                racines.push(node);
            }
        });

        // Stocker dans le cache Redis
        if (this.useRedis) {
            try {
                await redisService.setJSON(cacheKey, racines, this.CACHE_ARBRESCENCE_TTL);
                logger.debug(`[Organisation] Cache set: arborescence ${etablissementId} (TTL: ${this.CACHE_ARBRESCENCE_TTL}s)`);
            } catch (error) {
                logger.warn('[Organisation] Échec écriture cache Redis', error);
            }
        }

        return racines;
    }

    /**
     * Invalider le cache d'arborescence pour un établissement
     */
    private async invalidateArborescenceCache(etablissementId: string): Promise<void> {
        const cacheKey = `${this.CACHE_PREFIX}arborescence:${etablissementId}`;
        const organigrammeKey = `${this.CACHE_PREFIX}organigramme:${etablissementId}`;

        if (this.useRedis) {
            try {
                await Promise.all([
                    redisService.del(cacheKey),
                    redisService.del(organigrammeKey),
                ]);
                logger.debug(`[Organisation] Cache invalidé pour établissement ${etablissementId}`);
            } catch (error) {
                logger.warn('[Organisation] Échec invalidation cache', error);
            }
        }
    }

    async getCheminHierarchique(uniteId: string): Promise<UniteOrganisationnelle[]> {
        const unite = await this.uniteRepo.findOne({ where: { id: uniteId } });
        if (!unite) return [];

        // Charger toutes les unités de l'établissement en une seule requête
        const toutesUnites = await this.uniteRepo.find({
            where: { etablissementId: unite.etablissementId },
        });

        // Construire un map pour accès rapide
        const unitesMap = new Map<string, UniteOrganisationnelle>();
        toutesUnites.forEach((u) => unitesMap.set(u.id, u));

        // Construire le chemin en mémoire
        const chemin: UniteOrganisationnelle[] = [];
        let currentId: string | undefined = uniteId;

        while (currentId && unitesMap.has(currentId)) {
            const current: UniteOrganisationnelle = unitesMap.get(currentId)!;
            chemin.unshift(current);
            currentId = current.parentId;
        }

        return chemin;
    }

    // ==================== HIERARCHIE PERSONNEL ====================

    async createHierarchie(dto: CreateHierarchiePersonnelDto): Promise<HierarchiePersonnel> {
        // Vérifier qu'il n'y a pas de cycle hiérarchique
        await this.verifierPasDeCycle(dto.personnelId, dto.superieurId, dto.etablissementId);

        const hierarchie = this.hierarchieRepo.create({
            personnelId: dto.personnelId,
            personnelNom: dto.personnelNom,
            superieurId: dto.superieurId,
            superieurNom: dto.superieurNom,
            typeRelation: dto.typeRelation as any,
            posteId: dto.posteId,
            posteIntitule: dto.posteIntitule,
            uniteOrganisationnelleId: dto.uniteOrganisationnelleId,
            uniteNom: dto.uniteNom,
            etablissementId: dto.etablissementId,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
            commentaire: dto.commentaire,
            metadata: dto.metadata,
            statut: 'ACTIVE' as any,
            actif: true,
        });

        const saved = await this.hierarchieRepo.save(hierarchie);
        logger.info(`Relation hiérarchique créée`, {
            personnelId: saved.personnelId,
            superieurId: saved.superieurId,
        });
        return saved;
    }

    private async verifierPasDeCycle(
        personnelId: string,
        superieurId: string,
        etablissementId: string
    ): Promise<void> {
        // Vérification cycle direct
        if (personnelId === superieurId) {
            throw new AppError(
                'Une personne ne peut pas être son propre supérieur',
                400,
                'HIERARCHIE_CYCLE'
            );
        }

        // Parcours DFS pour détecter cycles indirects (A → B → C → A)
        const visited = new Set<string>();
        const stack = [superieurId];

        while (stack.length > 0) {
            const currentId = stack.pop()!;

            if (currentId === personnelId) {
                throw new AppError(
                    'Cycle hiérarchique détecté : ce supérieur est déjà subordonné (directement ou indirectement) à cette personne',
                    400,
                    'HIERARCHIE_CYCLE'
                );
            }

            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const relations = await this.hierarchieRepo.find({
                where: {
                    personnelId: currentId,
                    etablissementId,
                    actif: true,
                },
                select: ['superieurId'],
            });

            for (const rel of relations) {
                if (rel.superieurId) stack.push(rel.superieurId);
            }
        }
    }

    async findHierarchies(etablissementId: string, personnelId?: string): Promise<HierarchiePersonnel[]> {
        const where: any = { etablissementId, actif: true };

        if (personnelId) {
            where.personnelId = personnelId;
        }

        return this.hierarchieRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    async findSuperieurs(personnelId: string, etablissementId: string): Promise<HierarchiePersonnel[]> {
        return this.hierarchieRepo.find({
            where: {
                personnelId,
                etablissementId,
                actif: true,
            },
            order: { createdAt: 'DESC' },
        });
    }

    async findSubordonnes(superieurId: string, etablissementId: string): Promise<HierarchiePersonnel[]> {
        return this.hierarchieRepo.find({
            where: {
                superieurId,
                etablissementId,
                actif: true,
            },
            order: { createdAt: 'DESC' },
        });
    }

    async updateHierarchie(id: string, dto: UpdateHierarchiePersonnelDto): Promise<HierarchiePersonnel> {
        const hierarchie = await this.hierarchieRepo.findOne({ where: { id } });
        if (!hierarchie) {
            throw new AppError('Relation hiérarchique non trouvée', 404, 'NOT_FOUND');
        }

        if (dto.superieurId && dto.superieurId !== hierarchie.superieurId) {
            await this.verifierPasDeCycle(hierarchie.personnelId!, dto.superieurId, hierarchie.etablissementId!);
        }

        Object.assign(hierarchie, dto);
        const updated = await this.hierarchieRepo.save(hierarchie);
        logger.info(`Relation hiérarchique modifiée`, { hierarchieId: updated.id });
        return updated;
    }

    async deleteHierarchie(id: string): Promise<void> {
        const hierarchie = await this.hierarchieRepo.findOne({ where: { id } });
        if (!hierarchie) {
            throw new AppError('Relation hiérarchique non trouvée', 404, 'NOT_FOUND');
        }

        hierarchie.actif = false;
        await this.hierarchieRepo.save(hierarchie);
        logger.info(`Relation hiérarchique supprimée`, { hierarchieId: id });
    }

    // ==================== STATISTIQUES ET ANALYSES ====================

    async getStatistiquesOrganisation(etablissementId: string): Promise<any> {
        const unites = await this.uniteRepo.find({ where: { etablissementId } });
        const postes = await this.posteRepo.find({
            where: { uniteOrganisationnelleId: In(unites.map((u) => u.id)) },
        });

        const totalPostes = postes.length;
        const postesActifs = postes.filter((p) => p.statut === StatutPoste.ACTIF).length;
        const postesVacants = postes.filter((p) => p.statut === StatutPoste.VACANT).length;

        return {
            totalUnites: unites.length,
            totalPostes,
            postesActifs,
            postesVacants,
            tauxOccupation: totalPostes > 0 ? ((postesActifs / totalPostes) * 100).toFixed(2) : 0,
            parType: unites.reduce((acc, unite) => {
                acc[unite.type] = (acc[unite.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    /**
     * Validation complète de la cohérence de l'arborescence
     * Détecte les cycles, orphelins et incohérences
     */
    async validerArborescence(etablissementId: string): Promise<{
        valide: boolean;
        erreurs: string[];
        avertissements: string[];
        statistiques: any;
    }> {
        const erreurs: string[] = [];
        const avertissements: string[] = [];

        const unites = await this.uniteRepo.find({
            where: { etablissementId },
            order: { ordre: 'ASC' },
        });

        if (unites.length === 0) {
            return {
                valide: true,
                erreurs: [],
                avertissements: ['Aucune unité dans cet établissement'],
                statistiques: { totalUnites: 0 },
            };
        }

        // 1. Détecter les cycles dans la hiérarchie
        const unitesMap = new Map<string, UniteOrganisationnelle>();
        unites.forEach((u) => unitesMap.set(u.id, u));

        const visited = new Set<string>();
        const inStack = new Set<string>();

        const detecterCycle = (uniteId: string): boolean => {
            if (inStack.has(uniteId)) {
                return true;
            }
            if (visited.has(uniteId)) {
                return false;
            }

            visited.add(uniteId);
            inStack.add(uniteId);

            const enfants = unites.filter((u) => u.parentId === uniteId);
            for (const enfant of enfants) {
                if (detecterCycle(enfant.id)) {
                    return true;
                }
            }

            inStack.delete(uniteId);
            return false;
        };

        const racines = unites.filter((u) => !u.parentId);
        for (const racine of racines) {
            if (detecterCycle(racine.id)) {
                erreurs.push(`Cycle détecté dans la branche de l'unité ${racine.nom} (${racine.code})`);
            }
        }

        // 2. Vérifier que tous les parentId pointent vers des unités existantes
        for (const unite of unites) {
            if (unite.parentId && !unitesMap.has(unite.parentId)) {
                erreurs.push(
                    `L'unité ${unite.nom} (${unite.code}) référence un parent inexistant (${unite.parentId})`
                );
            }
        }

        // 3. Vérifier les codes en double
        const codesCount = new Map<string, number>();
        unites.forEach((u) => {
            codesCount.set(u.code, (codesCount.get(u.code) || 0) + 1);
        });

        codesCount.forEach((count, code) => {
            if (count > 1) {
                erreurs.push(`Code en double: ${code} (${count} occurrences)`);
            }
        });

        // 4. Vérifier les unités sans poste
        const postes = await this.posteRepo.find({
            where: { uniteOrganisationnelleId: In(unites.map((u) => u.id)) },
        });

        const postesParUnite = new Map<string, number>();
        postes.forEach((p) => {
            postesParUnite.set(
                p.uniteOrganisationnelleId,
                (postesParUnite.get(p.uniteOrganisationnelleId) || 0) + 1
            );
        });

        let unitesSansPoste = 0;
        for (const unite of unites) {
            if (!postesParUnite.has(unite.id)) {
                unitesSansPoste++;
                avertissements.push(`L'unité ${unite.nom} (${unite.code}) n'a aucun poste défini`);
            }
        }

        // 5. Statistiques
        const statistiques = {
            totalUnites: unites.length,
            totalPostes: postes.length,
            unitesSansPoste,
            profondeurMax: this.calculerProfondeurMax(unites),
        };

        return {
            valide: erreurs.length === 0,
            erreurs,
            avertissements,
            statistiques,
        };
    }

    /**
     * Calcule la profondeur maximale de l'arborescence
     */
    private calculerProfondeurMax(unites: UniteOrganisationnelle[]): number {
        const unitesMap = new Map<string, UniteOrganisationnelle>();
        unites.forEach((u) => unitesMap.set(u.id, u));

        let maxProfondeur = 0;

        const calculerProfondeur = (uniteId: string, profondeur: number): void => {
            if (profondeur > maxProfondeur) {
                maxProfondeur = profondeur;
            }

            const enfants = unites.filter((u) => u.parentId === uniteId);
            for (const enfant of enfants) {
                calculerProfondeur(enfant.id, profondeur + 1);
            }
        };

        const racines = unites.filter((u) => !u.parentId);
        for (const racine of racines) {
            calculerProfondeur(racine.id, 1);
        }

        return maxProfondeur;
    }

    async getOrganigramme(etablissementId: string): Promise<any> {
        const arborescence = await this.buildArborescence(etablissementId);

        // OPTIMISATION: Charger tous les postes en UNE SEULE requête
        const uniteIds = new Set<string>();
        const collecterIds = (unites: any[]): void => {
            unites.forEach((u) => {
                uniteIds.add(u.id);
                if (u.enfants && u.enfants.length > 0) {
                    collecterIds(u.enfants);
                }
            });
        };
        collecterIds(arborescence);

        const tousPostes = await this.posteRepo.find({
            where: { uniteOrganisationnelleId: In(Array.from(uniteIds)) },
        });

        const postesParUnite = new Map<string, any[]>();
        tousPostes.forEach((p) => {
            if (!postesParUnite.has(p.uniteOrganisationnelleId)) {
                postesParUnite.set(p.uniteOrganisationnelleId, []);
            }
            postesParUnite.get(p.uniteOrganisationnelleId)!.push(p);
        });

        const injecterPostes = (unites: any[]): any[] => {
            return unites.map((unite) => ({
                ...unite,
                postes: postesParUnite.get(unite.id) || [],
                enfants: unite.enfants ? injecterPostes(unite.enfants) : [],
            }));
        };

        return injecterPostes(arborescence);
    }
}

// Singleton exporté
export const organisationService = new OrganisationService();
