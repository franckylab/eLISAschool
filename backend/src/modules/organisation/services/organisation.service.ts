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

import { Repository, In, Like, FindOptionsWhere, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    UniteOrganisationnelle,
    Poste,
    HierarchiePersonnel,
    EchelonStructurel,
    StatutUnite,
    StatutPoste,
    TypeRelationHierarchique,
    StatutRelation,
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
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

/**
 * Noeud d'arborescence organisationnelle (type récursif)
 */
interface ArborescenceNode extends Partial<UniteOrganisationnelle> {
    id: string;
    enfants: ArborescenceNode[];
    depth?: number;
    echelonStructurelLabel?: string;
    echelonStructurelCouleur?: string;
    postes?: PosteOrganigramme[];
    totalMembres?: number;
    postesVacants?: number;
}

/**
 * Poste enrichi pour l'organigramme
 */
interface PosteOrganigramme extends Partial<Poste> {
    id: string;
    fonctionLabel?: string;
    niveauResponsabiliteLabel?: string;
    typePersonnelLabel?: string;
    occupantsCount?: number;
    statut?: StatutPoste;
}

/**
 * Résultat de la validation d'arborescence
 */
export interface ValidationArborescenceResult {
    valide: boolean;
    erreurs: string[];
    avertissements: string[];
    statistiques: {
        totalUnites: number;
        totalPostes: number;
        unitesSansPoste: number;
        profondeurMax: number;
    };
}

/**
 * Interface pour les statistiques organisationnelles
 */
export interface StatistiquesOrganisationResult {
    totalUnites: number;
    unitesActives: number;
    unitesSansPostes: number;
    totalPostes: number;
    postesActifs: number;
    postesOccupes: number;
    postesVacants: number;
    tauxOccupation: number;
    totalHierarchies: number;
    hierarchiesActives: number;
    profondeurMax: number;
    parEchelon: Record<string, number>;
    parEchelonDetails: Array<{
        echelonId: string;
        label: string;
        code: string;
        couleur?: string;
        count: number;
    }>;
}

export class OrganisationService {
    private uniteRepo: Repository<UniteOrganisationnelle>;
    private posteRepo: Repository<Poste>;
    private hierarchieRepo: Repository<HierarchiePersonnel>;
    private echelonRepo: Repository<EchelonStructurel>;

    // Configuration du cache
    private readonly CACHE_PREFIX = 'organisation:';
    private CACHE_ARBRESCENCE_TTL = 5 * 60; // 5 minutes (configurable)
    private CACHE_ORGANIGRAMME_TTL = 5 * 60; // 5 minutes (configurable)
    private useRedis = false;
    private redisCheckIntervalId: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.uniteRepo = AppDataSource.getRepository(UniteOrganisationnelle);
        this.posteRepo = AppDataSource.getRepository(Poste);
        this.hierarchieRepo = AppDataSource.getRepository(HierarchiePersonnel);
        this.echelonRepo = AppDataSource.getRepository(EchelonStructurel);

        // Vérifier si Redis est disponible (avec retry)
        this.checkRedisAvailability();
        
        // Re-vérifier toutes les 30 secondes
        this.redisCheckIntervalId = setInterval(() => this.checkRedisAvailability(), 30000);
    }

    /**
     * Nettoyer les ressources (appeler lors de l'arrêt du service)
     */
    destroy(): void {
        if (this.redisCheckIntervalId) {
            clearInterval(this.redisCheckIntervalId);
            this.redisCheckIntervalId = null;
        }
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

        // Si parentId fourni, vérifier qu'il existe + progression de niveau stricte
        if (dto.parentId) {
            const parent = await this.uniteRepo.findOne({
                where: { id: dto.parentId, etablissementId: dto.etablissementId },
                relations: ['echelonStructurel'],
            });
            if (!parent) {
                throw new AppError('Unité parente non trouvée', 404, 'PARENT_UNITE_NOT_FOUND');
            }
            await this.verifierProgressionNiveau(parent, dto.echelonStructurelId);
        }

        const unite = this.uniteRepo.create({
            nom: dto.nom,
            description: dto.description,
            echelonStructurelId: dto.echelonStructurelId,
            code: dto.code,
            etablissementId: dto.etablissementId,
            parentId: dto.parentId,
            ordre: dto.ordre,
            responsableNom: dto.responsableNom,
            responsableId: dto.responsableId,
            localisation: dto.localisation,
            statut: StatutUnite.ACTIF,
            actif: true,
        });

        const saved = await this.uniteRepo.save(unite);
        logger.info(`Unité organisationnelle créée: ${saved.nom}`, { uniteId: saved.id });
        return saved;
    }

    async findUnites(filtres: FiltreUnitesDto, etablissementId?: string): Promise<UniteOrganisationnelle[]> {
        const where: FindOptionsWhere<UniteOrganisationnelle> = {};

        if (filtres.etablissementId) {
            where.etablissementId = filtres.etablissementId;
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
        filtres: FiltreUnitesDto & { recherche?: string },
        page: number,
        limit: number,
        etablissementId?: string
    ): Promise<PaginatedResult<UniteOrganisationnelle>> {
        const qb = this.uniteRepo.createQueryBuilder('u')
            .leftJoinAndSelect('u.parent', 'parent');

        const eid = filtres.etablissementId || etablissementId;
        if (eid) {
            qb.andWhere('u.etablissementId = :eid', { eid });
        }
        if (filtres.actif !== undefined) {
            qb.andWhere('u.actif = :actif', { actif: filtres.actif });
        }
        if (filtres.parentId !== undefined) {
            qb.andWhere('u.parentId = :pid', { pid: filtres.parentId });
        }
        if (filtres.recherche) {
            qb.andWhere('(u.nom ILIKE :s OR u.code ILIKE :s)', { s: `%${filtres.recherche}%` });
        }

        qb.orderBy('u.ordre', 'ASC').addOrderBy('u.createdAt', 'DESC');
        return paginateWithQueryBuilder(qb, page, limit);
    }

    /**
     * Sous-unités directes d'une unité (pour l'onglet détail).
     */
    async findSousUnites(id: string, etablissementId?: string): Promise<UniteOrganisationnelle[]> {
        await this.findUniteById(id, etablissementId);
        return this.uniteRepo.find({
            where: { parentId: id },
            relations: ['echelonStructurel'],
            order: { ordre: 'ASC' },
        });
    }

    async findUniteById(id: string, etablissementId?: string): Promise<UniteOrganisationnelle> {
        const where: FindOptionsWhere<UniteOrganisationnelle> = { id };
        
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

    async updateUnite(id: string, dto: UpdateUniteOrganisationnelleDto, etablissementId?: string): Promise<UniteOrganisationnelle> {
        const unite = await this.findUniteById(id, etablissementId);
        const ancienEtablissementId = unite.etablissementId;

        // Vérifier parentId (changement ou nouveau)
        if (dto.parentId !== undefined && dto.parentId !== unite.parentId) {
            if (dto.parentId === id) {
                throw new AppError('Une unité ne peut pas être son propre parent', 400, 'SELF_PARENT');
            }
            if (dto.parentId) {
                const parent = await this.uniteRepo.findOne({
                    where: { id: dto.parentId, etablissementId: unite.etablissementId },
                    relations: ['echelonStructurel'],
                });
                if (!parent) {
                    throw new AppError('Unité parente non trouvée', 404, 'PARENT_UNITE_NOT_FOUND');
                }
                const cyclique = await this.verifierCycleUnite(dto.parentId, id, unite.etablissementId);
                if (cyclique) {
                    throw new AppError('Opération invalide : le parent choisi est un descendant de cette unité', 400, 'CYCLE_DETECTED');
                }
                // Vérifier profondeur max (6 niveaux)
                const profondeurResult = await this.uniteRepo.query(`
                    WITH RECURSIVE depth_calc AS (
                        SELECT id, "parentId", 1 AS depth
                        FROM unites_organisationnelles
                        WHERE id = $1 AND "etablissementId" = $2
                        UNION ALL
                        SELECT u.id, u."parentId", dc.depth + 1
                        FROM unites_organisationnelles u
                        INNER JOIN depth_calc dc ON u."parentId" = dc.id
                        WHERE dc.depth < 100
                    )
                    SELECT MAX(depth)::int AS max_depth FROM depth_calc
                `, [dto.parentId, unite.etablissementId]);
                const profondeurActuelle = profondeurResult[0]?.max_depth || 0;
                // Calculer la profondeur de l'unité elle-même
                const profondeurUniteResult = await this.uniteRepo.query(`
                    WITH RECURSIVE depth_calc AS (
                        SELECT id, "parentId", 1 AS depth
                        FROM unites_organisationnelles
                        WHERE id = $1 AND "etablissementId" = $2
                        UNION ALL
                        SELECT u.id, u."parentId", dc.depth + 1
                        FROM unites_organisationnelles u
                        INNER JOIN depth_calc dc ON u."parentId" = dc.id
                        WHERE dc.depth < 100
                    )
                    SELECT MAX(depth)::int AS max_depth FROM depth_calc
                `, [id, unite.etablissementId]);
                const profondeurUnite = profondeurUniteResult[0]?.max_depth || 0;
                // La profondeur résultante = profondeur du nouveau parent + sous-arbre de l'unité
                // On vérifie que le parent ne dépasse pas le niveau 5 (pour laisser 1 niveau aux enfants)
                if (profondeurActuelle > 5) {
                    throw new AppError('Profondeur maximale atteinte (6 niveaux). Impossible de déplacer cette unité à cet endroit.', 400, 'MAX_DEPTH_EXCEEDED');
                }
                await this.verifierProgressionNiveau(parent, dto.echelonStructurelId ?? unite.echelonStructurelId);
            }
        } else if (dto.echelonStructurelId !== undefined && dto.echelonStructurelId !== unite.echelonStructurelId) {
            // Changement de niveau sans changement de parent
            const parent = unite.parentId
                ? await this.uniteRepo.findOne({
                    where: { id: unite.parentId },
                    relations: ['echelonStructurel'],
                })
                : null;
            if (parent) {
                await this.verifierProgressionNiveau(parent, dto.echelonStructurelId);
            }
        }
        
        Object.assign(unite, dto);
        const updated = await this.uniteRepo.save(unite);
        logger.info(`Unité modifiée: ${updated.nom}`, { uniteId: updated.id });
        
        // Invalider le cache
        await this.invalidateArborescenceCache(ancienEtablissementId);
        
        return updated;
    }

    /**
     * Supprime une unité et TOUTE sa descendance (suppression en cascade).
     * Conforme à la modale d'impact frontend qui annonce la suppression des unités
     * enfants et des données associées.
     *
     * Mécanique FK :
     * - postes (poste.uniteOrganisationnelleId) → ON DELETE CASCADE : supprimés automatiquement
     * - hierarchie_personnel.posteId → ON DELETE SET NULL : détaché automatiquement
     * - unites_organisationnelles.parentId → ON DELETE SET NULL : les enfants ne sont PAS
     *   supprimés en cascade DB, d'où la suppression explicite de toute la descendance.
     */
    async deleteUnite(id: string, etablissementId?: string): Promise<void> {
        const unite = await this.findUniteById(id, etablissementId);
        const uniteEtablissementId = unite.etablissementId;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Collecter l'unité + tous ses descendants (CTE récursif, garde anti-cycle)
            const familleRows = await queryRunner.query(`
                WITH RECURSIVE desc_tree AS (
                    SELECT id, 0 AS depth FROM unites_organisationnelles WHERE id = $1
                    UNION ALL
                    SELECT u.id, dt.depth + 1 FROM unites_organisationnelles u
                    INNER JOIN desc_tree dt ON u."parentId" = dt.id
                    WHERE dt.depth < 100
                )
                SELECT id FROM desc_tree
            `, [id]);
            const familleIds: string[] = familleRows.map((r: { id: string }) => r.id);

            // 2. Supprimer toute la famille d'unités.
            //    Les postes sont supprimés en cascade (FK ON DELETE CASCADE) et
            //    hierarchie.posteId est mis à NULL (FK ON DELETE SET NULL).
            await queryRunner.query(
                `DELETE FROM unites_organisationnelles WHERE id = ANY($1::uuid[])`,
                [familleIds],
            );

            await queryRunner.commitTransaction();
            logger.info(`Unité supprimée en cascade: ${unite.nom}`, {
                uniteId: id,
                unitesSupprimees: familleIds.length,
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        // Invalider le cache
        await this.invalidateArborescenceCache(uniteEtablissementId);
    }

    async countUnitesActives(etablissementId: string): Promise<number> {
        return this.uniteRepo.count({
            where: { etablissementId, actif: true },
        });
    }

    /**
     * Réordonne une unité après une autre dans la liste des siblings.
     * Met à jour les champs `ordre` de tous les siblings.
     */
    async reordonnerUnite(uniteId: string, apresId: string | null, etablissementId?: string): Promise<void> {
        const where: FindOptionsWhere<UniteOrganisationnelle> = { id: uniteId };
        if (etablissementId) where.etablissementId = etablissementId;
        const unite = await this.uniteRepo.findOne({ where });
        if (!unite) {
            throw new AppError('Unité non trouvée', 404, 'UNITE_NOT_FOUND');
        }

        // Récupérer tous les siblings (même parent)
        const siblings = await this.uniteRepo.find({
            where: { parentId: unite.parentId, etablissementId: unite.etablissementId },
            order: { ordre: 'ASC' },
        });

        // Retirer l'unité courante de la liste
        const otherSiblings = siblings.filter(s => s.id !== uniteId);

        // Construire la nouvelle liste
        let newOrder: string[];
        if (apresId === null) {
            // Placer en premier
            newOrder = [uniteId, ...otherSiblings.map(s => s.id)];
        } else {
            const apresIndex = otherSiblings.findIndex(s => s.id === apresId);
            if (apresIndex === -1) {
                throw new AppError('Unité de référence non trouvée', 404, 'REFERENCE_NOT_FOUND');
            }
            // Insérer après la référence
            newOrder = [
                ...otherSiblings.slice(0, apresIndex + 1).map(s => s.id),
                uniteId,
                ...otherSiblings.slice(apresIndex + 1).map(s => s.id),
            ];
        }

        // Mettre à jour les ordres en batch
        await Promise.all(newOrder.map((id, index) =>
            this.uniteRepo.update(id, { ordre: index })
        ));

        logger.info(`Unité réordonnée: ${uniteId} après ${apresId || 'null'}`, { uniteId, apresId });
        await this.invalidateArborescenceCache(unite.etablissementId);
    }

    // ==================== ARBORESCENCE HIÉRARCHIQUE ====================

    async buildArborescence(etablissementId: string): Promise<ArborescenceNode[]> {
        // Clé de cache
        const cacheKey = `${this.CACHE_PREFIX}arborescence:${etablissementId}`;

        // Essayer de récupérer depuis le cache Redis
        if (this.useRedis) {
            try {
                const cached = await redisService.getJSON<ArborescenceNode[]>(cacheKey);
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
        const unitesMap = new Map<string, ArborescenceNode>();
        const racines: ArborescenceNode[] = [];

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

    async getCheminHierarchique(uniteId: string, etablissementId?: string): Promise<UniteOrganisationnelle[]> {
        const where: FindOptionsWhere<UniteOrganisationnelle> = { id: uniteId };
        if (etablissementId) where.etablissementId = etablissementId;
        const unite = await this.uniteRepo.findOne({ where });
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
        if (dto.personnelId && dto.superieurId) {
            await this.verifierPasDeCycle(dto.personnelId, dto.superieurId, dto.etablissementId || '');
        }

        const hierarchie = this.hierarchieRepo.create({
            personnelId: dto.personnelId,
            superieurId: dto.superieurId,
            typeRelation: dto.typeRelation as TypeRelationHierarchique,
            posteId: dto.posteId,
            etablissementId: dto.etablissementId,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
            commentaire: dto.commentaire,
            statut: StatutRelation.ACTIVE,
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
        if (personnelId === superieurId) {
            throw new AppError(
                'Une personne ne peut pas être son propre supérieur',
                400,
                'HIERARCHIE_CYCLE'
            );
        }

        // CTE récursif PostgreSQL : détection de cycle (A → B → C → A)
        const result = await this.hierarchieRepo.query(
            `WITH RECURSIVE chaine AS (
                SELECT h."superieurId" AS id, 1 AS depth
                FROM hierarchie_personnel h
                WHERE h."personnelId" = $1 AND h.actif = true
            UNION ALL
                SELECT h."superieurId", c.depth + 1
                FROM hierarchie_personnel h
                INNER JOIN chaine c ON c.id = h."personnelId"
                WHERE h.actif = true AND c.depth < 50
            )
            SELECT COUNT(*) > 0 AS cycle FROM chaine WHERE id = $2`,
            [personnelId, superieurId],
        );

        if (result[0]?.cycle) {
            throw new AppError(
                'Cycle hiérarchique détecté : ce supérieur est déjà subordonné (directement ou indirectement) à cette personne',
                400,
                'HIERARCHIE_CYCLE'
            );
        }
    }

    private async verifierProgressionNiveau(parent: UniteOrganisationnelle, enfantEchelonStructurelId?: string | null): Promise<void> {
        if (!enfantEchelonStructurelId) return;

        const parentEchelonId = parent.echelonStructurelId;
        if (!parentEchelonId) return;

        const [parentEchelon, enfantEchelon] = await Promise.all([
            AppDataSource.getRepository(EchelonStructurel).findOne({ where: { id: parentEchelonId } }),
            AppDataSource.getRepository(EchelonStructurel).findOne({ where: { id: enfantEchelonStructurelId } }),
        ]);

        if (!parentEchelon || !enfantEchelon) return;

        if (enfantEchelon.niveau !== parentEchelon.niveau + 1) {
            throw new AppError(
                `Progression de niveau invalide : le parent est au niveau ${parentEchelon.niveau}, l'enfant doit être au niveau ${parentEchelon.niveau + 1} (reçu: ${enfantEchelon.niveau})`,
                400,
                'NIVEAU_PROGRESSION_INVALIDE',
            );
        }
    }

    async findHierarchies(etablissementId: string, personnelId?: string): Promise<HierarchiePersonnel[]> {
        const where: FindOptionsWhere<HierarchiePersonnel> = { etablissementId, actif: true };

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

    async updateHierarchie(id: string, dto: UpdateHierarchiePersonnelDto, etablissementId?: string): Promise<HierarchiePersonnel> {
        const where: FindOptionsWhere<HierarchiePersonnel> = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const hierarchie = await this.hierarchieRepo.findOne({ where });
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

    async deleteHierarchie(id: string, etablissementId?: string): Promise<void> {
        const where: FindOptionsWhere<HierarchiePersonnel> = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const hierarchie = await this.hierarchieRepo.findOne({ where });
        if (!hierarchie) {
            throw new AppError('Relation hiérarchique non trouvée', 404, 'NOT_FOUND');
        }

        hierarchie.actif = false;
        await this.hierarchieRepo.save(hierarchie);
        logger.info(`Relation hiérarchique supprimée`, { hierarchieId: id });
    }

    // ==================== STATISTIQUES ET ANALYSES ====================

    async getStatistiquesOrganisation(etablissementId: string): Promise<StatistiquesOrganisationResult> {
        const unites = await this.uniteRepo.find({ where: { etablissementId } });
        const uniteIds = unites.map((u) => u.id);
        const postes = uniteIds.length > 0
            ? await this.posteRepo.find({ where: { uniteOrganisationnelleId: In(uniteIds) } })
            : [];

        // Unités
        const totalUnites = unites.length;
        const unitesActives = unites.filter((u) => u.actif).length;

        // Postes
        const totalPostes = postes.length;
        const postesActifs = postes.filter((p) => p.statut === StatutPoste.ACTIF).length;
        const postesOccupes = postes.filter((p) => p.occupantsCount > 0).length;
        const postesVacants = postes.filter((p) => p.statut === StatutPoste.VACANT || (p.actif && p.occupantsCount < p.nombrePostes)).length;

        // Unités sans postes
        const unitesAvecPostes = new Set(postes.map((p) => p.uniteOrganisationnelleId));
        const unitesSansPostes = unites.filter((u) => !unitesAvecPostes.has(u.id)).length;

        // Hiérarchies
        const hierarchieRepo = AppDataSource.getRepository('HierarchiePersonnel');
        const [totalHierarchies, hierarchiesActives] = uniteIds.length > 0
            ? await Promise.all([
                hierarchieRepo.count({ where: { etablissementId } }),
                hierarchieRepo.count({ where: { etablissementId, actif: true } }),
            ])
            : [0, 0];

        // Profondeur max
        const profondeurMax = this.calculerProfondeurMax(unites);

        // Répartition par échelon structurel
        const parEchelon = unites.reduce((acc, unite) => {
            const key = unite.echelonStructurelId || 'SANS_ECHELON';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Détails par échelon avec labels et couleurs
        // Inclure les échelons globaux (etablissementId NULL) ET locaux
        const echelons = await this.echelonRepo.find({
            where: [
                { etablissementId },
                { etablissementId: IsNull() },
            ],
            select: ['id', 'label', 'code', 'couleur'],
        });
        const echelonMap = new Map(echelons.map(e => [e.id, e]));
        const parEchelonDetails = Object.entries(parEchelon).map(([echelonId, count]) => {
            const echelon = echelonId === 'SANS_ECHELON' ? null : echelonMap.get(echelonId);
            return {
                echelonId,
                label: echelon?.label || 'Sans échelon',
                code: echelon?.code || 'N/A',
                couleur: echelon?.couleur,
                count,
            };
        }).sort((a, b) => b.count - a.count);

        return {
            // Unités
            totalUnites,
            unitesActives,
            unitesSansPostes,
            // Postes
            totalPostes,
            postesActifs,
            postesOccupes,
            postesVacants,
            tauxOccupation: totalPostes > 0 ? Math.round((postesOccupes / totalPostes) * 10000) / 100 : 0,
            // Hiérarchies
            totalHierarchies,
            hierarchiesActives,
            // Arborescence
            profondeurMax,
            // Répartition par échelon structurel
            parEchelon,
            parEchelonDetails,
        };
    }

    /**
     * Validation complète de la cohérence de l'arborescence
     * Détecte les cycles, orphelins et incohérences
     */
    async validerArborescence(etablissementId: string): Promise<ValidationArborescenceResult> {
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
                statistiques: {
                    totalUnites: 0,
                    totalPostes: 0,
                    unitesSansPoste: 0,
                    profondeurMax: 0,
                },
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

    /**
     * Vérifie via CTE récursif PostgreSQL que parentId n'est pas un descendant de entityId
     * (évite les cycles dans l'arborescence)
     */
    private async verifierCycleUnite(
        parentId: string,
        entityId: string,
        etablissementId: string,
    ): Promise<boolean> {
        const result = await this.uniteRepo.query(`
            WITH RECURSIVE ancestors AS (
                SELECT id, "parentId", 0 AS depth
                FROM unites_organisationnelles
                WHERE id = $1 AND "etablissementId" = $3
                UNION ALL
                SELECT u.id, u."parentId", a.depth + 1
                FROM unites_organisationnelles u
                INNER JOIN ancestors a ON u.id = a."parentId"
                WHERE a.depth < 100
            )
            SELECT COUNT(*)::int AS cnt FROM ancestors WHERE id = $2
        `, [parentId, entityId, etablissementId]);
        return (result[0]?.cnt || 0) > 0;
    }

    // ==================== IMPACT SUPPRESSION & BATCH ====================

    /**
     * Calcule l'impact de la suppression d'une unité (enfants, postes, membres, hiérarchies).
     * Vérification des relations directes ET indirectes.
     */
    async getImpactUnite(id: string, etablissementId?: string): Promise<{
        enfants: number;
        descendants: number;
        postes: number;
        postesOccupes: number;
        membresDirect: number;
        membresTotal: number;
        hierarchies: number;
    }> {
        const unite = await this.findUniteById(id, etablissementId);

        // Compter les enfants directs
        const enfants = await this.uniteRepo.count({ where: { parentId: id } });

        // Compter tous les descendants via CTE récursif
        const descendantsResult = await this.uniteRepo.query(`
            WITH RECURSIVE desc_tree AS (
                SELECT id, "parentId", 0 AS depth
                FROM unites_organisationnelles
                WHERE "parentId" = $1 AND "etablissementId" = $2
                UNION ALL
                SELECT u.id, u."parentId", dt.depth + 1
                FROM unites_organisationnelles u
                INNER JOIN desc_tree dt ON u."parentId" = dt.id
                WHERE dt.depth < 100
            )
            SELECT COUNT(*)::int AS cnt FROM desc_tree
        `, [id, unite.etablissementId]);
        const descendants = descendantsResult[0]?.cnt || 0;

        // Collecter tous les IDs (unité + descendants)
        const familleIds = [id];
        if (descendants > 0) {
            const descRows = await this.uniteRepo.query(`
                WITH RECURSIVE desc_tree AS (
                    SELECT id, 0 AS depth FROM unites_organisationnelles
                    WHERE "parentId" = $1 AND "etablissementId" = $2
                    UNION ALL
                    SELECT u.id, dt.depth + 1 FROM unites_organisationnelles u
                    INNER JOIN desc_tree dt ON u."parentId" = dt.id
                    WHERE dt.depth < 100
                )
                SELECT id FROM desc_tree
            `, [id, unite.etablissementId]);
            familleIds.push(...descRows.map((r: { id: string }) => r.id));
        }

        // Compter les postes dans toute la famille
        const postes = await this.posteRepo.find({
            where: { uniteOrganisationnelleId: In(familleIds) },
        });
        const postesOccupes = postes.filter(p => p.occupantsCount > 0).length;

        // Compter les membres (somme des occupantsCount)
        const membresDirect = postes.filter(p => p.uniteOrganisationnelleId === id)
            .reduce((sum, p) => sum + (p.occupantsCount || 0), 0);
        const membresTotal = postes.reduce((sum, p) => sum + (p.occupantsCount || 0), 0);

        // Compter les hiérarchies liées (via posteId sur les postes de la famille)
        const hierarchieRepo = AppDataSource.getRepository('HierarchiePersonnel');
        const hierarchies = await hierarchieRepo.count({
            where: { posteId: In(postes.map(p => p.id)), etablissementId: unite.etablissementId },
        });

        return { enfants, descendants, postes: postes.length, postesOccupes, membresDirect, membresTotal, hierarchies };
    }

    /**
     * Crée une unité avec ses postes en une seule transaction.
     */
    async creerUniteAvecPostes(
        dto: CreateUniteOrganisationnelleDto,
        postes: Array<{ intitule: string; code?: string; fonctionId?: string; description?: string; estSuppleant?: boolean }>
    ): Promise<UniteOrganisationnelle> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Vérifier unicité du code
            const existing = await queryRunner.manager.findOne(UniteOrganisationnelle, {
                where: { code: dto.code, etablissementId: dto.etablissementId },
            });
            if (existing) {
                throw new AppError('Une unité avec ce code existe déjà', 409, 'UNITE_CODE_EXISTS');
            }

            // 2. Créer l'unité
            const unite = queryRunner.manager.create(UniteOrganisationnelle, {
                nom: dto.nom,
                description: dto.description,
                echelonStructurelId: dto.echelonStructurelId,
                code: dto.code,
                etablissementId: dto.etablissementId,
                parentId: dto.parentId,
                ordre: dto.ordre,
                responsableNom: dto.responsableNom,
                responsableId: dto.responsableId,
                localisation: dto.localisation,
                statut: StatutUnite.ACTIF,
                actif: true,
            });
            const savedUnite = await queryRunner.manager.save(unite);

            // 3. Créer les postes associés
            if (postes && postes.length > 0) {
                for (const posteDto of postes) {
                    const poste = queryRunner.manager.create(Poste, {
                        intitule: posteDto.intitule,
                        code: posteDto.code || posteDto.intitule.substring(0, 4).toUpperCase(),
                        fonctionId: posteDto.fonctionId!,
                        description: posteDto.description,
                        uniteOrganisationnelleId: savedUnite.id,
                        statut: StatutPoste.VACANT,
                        actif: true,
                        nombrePostes: 1,
                        occupantsCount: 0,
                    });
                    await queryRunner.manager.save(poste);
                }
            }

            await queryRunner.commitTransaction();
            logger.info(`Unité créée avec ${postes?.length || 0} poste(s): ${savedUnite.nom}`, { uniteId: savedUnite.id });

            // Invalider le cache
            await this.invalidateArborescenceCache(dto.etablissementId);

            return this.findUniteById(savedUnite.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getOrganigramme(etablissementId: string): Promise<ArborescenceNode[]> {
        const arborescence = await this.buildArborescence(etablissementId);

        // OPTIMISATION: Charger tous les postes + échelons en UNE SEULE requête chacun
        const uniteIds = new Set<string>();
        const collecterIds = (unites: ArborescenceNode[]): void => {
            unites.forEach((u) => {
                uniteIds.add(u.id);
                if (u.enfants && u.enfants.length > 0) {
                    collecterIds(u.enfants);
                }
            });
        };
        collecterIds(arborescence);

        // Charger échelons pour résoudre le label (evite N+1 sur chaque noeud)
        // Charger échelons globaux (système) ET locaux pour résoudre les labels
        const tousEchelons = await this.echelonRepo.find({
            where: [
                { etablissementId },
                { etablissementId: IsNull() },
            ],
            select: ['id', 'label', 'code', 'couleur'],
        }) || [];
        const echelonMap = new Map<string, { label: string; code: string; couleur?: string }>();
        tousEchelons.forEach((e) => echelonMap.set(e.id, { label: e.label, code: e.code, couleur: e.couleur }));
        const tousPostes = await this.posteRepo.find({
            where: { uniteOrganisationnelleId: In(Array.from(uniteIds)) },
            relations: ['fonction', 'fonction.typePersonnel', 'niveauResponsabilite'],
        });

        const postesParUnite = new Map<string, PosteOrganigramme[]>();
        tousPostes.forEach((p) => {
            if (!postesParUnite.has(p.uniteOrganisationnelleId)) {
                postesParUnite.set(p.uniteOrganisationnelleId, []);
            }
            postesParUnite.get(p.uniteOrganisationnelleId)!.push({
                ...p,
                fonctionLabel: p.fonction?.nom,
                niveauResponsabiliteLabel: p.niveauResponsabilite?.label,
                // Type statutaire dérivé de la fonction du poste (jamais stocké sur le poste)
                typePersonnelLabel: p.fonction?.typePersonnel?.nom,
            });
        });

        // Enrichir chaque noeud avec depth, totalMembres, postesVacants
        const injecterPostes = (unites: ArborescenceNode[], depth: number = 0): ArborescenceNode[] => {
            return unites.map((unite) => {
                const postesUnite = postesParUnite.get(unite.id) || [];
                const enfantsEnrichis = unite.enfants ? injecterPostes(unite.enfants, depth + 1) : [];

                // Calcul totalMembres (cette unité + descendants)
                const membresDirect = postesUnite.reduce((sum: number, p: PosteOrganigramme) => sum + (p.occupantsCount || 0), 0);
                const membresDescendants = enfantsEnrichis.reduce((sum: number, e: ArborescenceNode) => sum + (e.totalMembres || 0), 0);

                // Calcul postesVacants (cette unité + descendants)
                const postesVacantsDirect = postesUnite.filter((p: PosteOrganigramme) => p.statut === StatutPoste.VACANT).length;
                const postesVacantsDescendants = enfantsEnrichis.reduce((sum: number, e: ArborescenceNode) => sum + (e.postesVacants || 0), 0);

                const echelon = unite.echelonStructurelId ? echelonMap.get(unite.echelonStructurelId) : undefined;

                return {
                    ...unite,
                    depth,
                    echelonStructurelLabel: echelon?.label || echelon?.code,
                    echelonStructurelCouleur: echelon?.couleur,
                    postes: postesUnite,
                    totalMembres: membresDirect + membresDescendants,
                    postesVacants: postesVacantsDirect + postesVacantsDescendants,
                    enfants: enfantsEnrichis,
                };
            });
        };

        return injecterPostes(arborescence);
    }
}

// Singleton exporté
export const organisationService = new OrganisationService();
