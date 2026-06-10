/**
 * ==================================
 * eLISAschool - Service Type Contrat Personnalisé
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TypeContratPersonnalise, CategorieContrat } from '../entities';
import { CreateTypeContratDto, UpdateTypeContratDto, QueryTypeContratDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class TypeContratService {
    private repo: Repository<TypeContratPersonnalise>;
    private cache = new Map<string, TypeContratPersonnalise[]>();
    private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
    private cacheTimestamp = new Map<string, number>();

    constructor() {
        this.repo = AppDataSource.getRepository(TypeContratPersonnalise);
    }

    /**
     * Créer un nouveau type de contrat
     */
    async create(
        dto: CreateTypeContratDto,
        etablissementId: string,
        userId: string,
        req?: any
    ): Promise<TypeContratPersonnalise> {
        // Vérifier l'unicité du code pour cet établissement
        const existing = await this.repo.findOne({
            where: {
                code: dto.code,
                etablissementId,
            },
        });

        if (existing) {
            throw new AppError('Un type de contrat avec ce code existe déjà', 409, 'TYPE_CONTRAT_EXISTS');
        }

        const typeContrat = this.repo.create({
            ...dto,
            etablissementId,
            estSysteme: false,
        });

        await this.repo.save(typeContrat);
        this.invalidateCache(etablissementId);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: 'TYPE_CONTRAT_CREATE' as any,
            cible: 'TypeContratPersonnalise',
            cibleId: typeContrat.id,
            description: `Création type contrat ${dto.code} - ${dto.nom}`,
            nouvellesValeurs: dto,
            module: 'personnel',
        }, req);

        logger.info(`Type contrat créé: ${typeContrat.id} (${dto.code})`);
        return typeContrat;
    }

    /**
     * Lister les types de contrat avec pagination
     */
    async findAll(
        query: QueryTypeContratDto,
        etablissementId: string
    ): Promise<PaginatedResult<TypeContratPersonnalise>> {
        const { page, limit, search, categorie, actif, estSysteme } = query;

        const qb = this.repo
            .createQueryBuilder('tc')
            .where('1=1');

        // Filtre: types système OU types de l'établissement
        qb.andWhere('(tc.establissementId = :etablissementId OR tc.establissementId IS NULL OR tc.estSysteme = true)', {
            etablissementId,
        });

        // Filtres optionnels
        if (categorie) {
            qb.andWhere('tc.categorie = :categorie', { categorie });
        }

        if (actif !== undefined) {
            qb.andWhere('tc.actif = :actif', { actif });
        }

        if (estSysteme !== undefined) {
            qb.andWhere('tc.estSysteme = :estSysteme', { estSysteme });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(tc.code ILIKE :search OR tc.nom ILIKE :search OR tc.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri
        const allowedFields = ['code', 'nom', 'categorie', 'ordre', 'createdAt'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'ordre';
        qb.orderBy(`tc.${orderField}`, query.sortOrder);

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    /**
     * Récupérer tous les types actifs (avec cache)
     */
    async getTypesActifs(etablissementId: string): Promise<TypeContratPersonnalise[]> {
        const cacheKey = `types_actifs:${etablissementId}`;
        const cached = this.cache.get(cacheKey);
        const timestamp = this.cacheTimestamp.get(cacheKey);

        if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
            return cached;
        }

        const types = await this.repo.find({
            where: [
                { etablissementId, actif: true },
                { estSysteme: true, actif: true },
            ],
            order: { ordre: 'ASC', code: 'ASC' },
        });

        this.cache.set(cacheKey, types);
        this.cacheTimestamp.set(cacheKey, Date.now());

        return types;
    }

    /**
     * Récupérer un type de contrat par ID
     */
    async findOne(id: string, etablissementId: string): Promise<TypeContratPersonnalise> {
        const typeContrat = await this.repo.findOne({
            where: { id },
        });

        if (!typeContrat) {
            throw new AppError('Type de contrat non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier l'accès multi-tenant
        if (typeContrat.etablissementId && typeContrat.etablissementId !== etablissementId && !typeContrat.estSysteme) {
            throw new AppError('Accès non autorisé à ce type de contrat', 403, 'FORBIDDEN');
        }

        return typeContrat;
    }

    /**
     * Mettre à jour un type de contrat
     */
    async update(
        id: string,
        dto: UpdateTypeContratDto,
        userId: string,
        etablissementId: string,
        req?: any
    ): Promise<TypeContratPersonnalise> {
        const typeContrat = await this.findOne(id, etablissementId);

        // Protection des types système
        if (typeContrat.estSysteme) {
            throw new AppError('Les types système ne peuvent pas être modifiés', 403, 'SYSTEM_TYPE_PROTECTED');
        }

        const anciennesValeurs = {
            nom: typeContrat.nom,
            categorie: typeContrat.categorie,
            actif: typeContrat.actif,
        };

        Object.assign(typeContrat, dto);
        await this.repo.save(typeContrat);
        this.invalidateCache(etablissementId);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: 'TYPE_CONTRAT_UPDATE' as any,
            cible: 'TypeContratPersonnalise',
            cibleId: id,
            description: `Modification type contrat ${typeContrat.code}`,
            anciennesValeurs,
            nouvellesValeurs: dto,
            module: 'personnel',
        }, req);

        logger.info(`Type contrat modifié: ${id}`);
        return typeContrat;
    }

    /**
     * Supprimer un type de contrat (soft delete)
     */
    async delete(id: string, userId: string, etablissementId: string, req?: any): Promise<void> {
        const typeContrat = await this.findOne(id, etablissementId);

        // Protection des types système
        if (typeContrat.estSysteme) {
            throw new AppError('Les types système ne peuvent pas être supprimés', 403, 'SYSTEM_TYPE_PROTECTED');
        }

        // Vérifier s'il y a des contrats utilisant ce type
        const contratRepo = AppDataSource.getRepository('ContratPersonnel');
        const contratsUtilisant = await contratRepo.count({
            where: { typeContratId: id },
        });

        if (contratsUtilisant > 0) {
            // Soft delete: désactiver au lieu de supprimer
            typeContrat.actif = false;
            await this.repo.save(typeContrat);
            this.invalidateCache(etablissementId);

            await auditService.log({
                utilisateurId: userId,
                action: 'TYPE_CONTRAT_DELETE' as any,
                cible: 'TypeContratPersonnalise',
                cibleId: id,
                description: `Désactivation type contrat ${typeContrat.code} (${contratsUtilisant} contrats existants)`,
                module: 'personnel',
            }, req);

            logger.info(`Type contrat désactivé: ${id} (${contratsUtilisant} contrats)`);
            return;
        }

        // Suppression réelle si aucun contrat n'utilise ce type
        await this.repo.remove(typeContrat);
        this.invalidateCache(etablissementId);

        await auditService.log({
            utilisateurId: userId,
            action: 'TYPE_CONTRAT_DELETE' as any,
            cible: 'TypeContratPersonnalise',
            cibleId: id,
            description: `Suppression type contrat ${typeContrat.code}`,
            module: 'personnel',
        }, req);

        logger.info(`Type contrat supprimé: ${id}`);
    }

    /**
     * Activer/désactiver un type de contrat
     */
    async toggleActif(
        id: string,
        userId: string,
        etablissementId: string,
        req?: any
    ): Promise<TypeContratPersonnalise> {
        const typeContrat = await this.findOne(id, etablissementId);

        if (typeContrat.estSysteme) {
            throw new AppError('Les types système ne peuvent pas être désactivés', 403, 'SYSTEM_TYPE_PROTECTED');
        }

        typeContrat.actif = !typeContrat.actif;
        await this.repo.save(typeContrat);
        this.invalidateCache(etablissementId);

        await auditService.log({
            utilisateurId: userId,
            action: 'TYPE_CONTRAT_UPDATE' as any,
            cible: 'TypeContratPersonnalise',
            cibleId: id,
            description: `${typeContrat.actif ? 'Activation' : 'Désactivation'} type contrat ${typeContrat.code}`,
            module: 'personnel',
        }, req);

        logger.info(`Type contrat ${typeContrat.actif ? 'activé' : 'désactivé'}: ${id}`);
        return typeContrat;
    }

    /**
     * Créer les types système par défaut (seeds)
     */
    async createTypesSysteme(): Promise<void> {
        const typesSysteme = [
            { code: 'CDD', nom: 'Contrat à Durée Déterminée', categorie: CategorieContrat.EMPLOI_TEMPORAIRE, ordre: 1 },
            { code: 'CDI', nom: 'Contrat à Durée Indéterminée', categorie: CategorieContrat.EMPLOI_PERMANENT, ordre: 2 },
            { code: 'VACATAIRE', nom: 'Vacataire', categorie: CategorieContrat.EMPLOI_TEMPORAIRE, ordre: 3 },
            { code: 'STAGIAIRE', nom: 'Stagiaire', categorie: CategorieContrat.STAGE_FORMATION, ordre: 4 },
        ];

        for (const typeData of typesSysteme) {
            const existing = await this.repo.findOne({
                where: { code: typeData.code, estSysteme: true },
            });

            if (!existing) {
                const typeContrat = this.repo.create({
                    ...typeData,
                    estSysteme: true,
                    actif: true,
                    etablissementId: null,
                });
                await this.repo.save(typeContrat);
                logger.info(`Type système créé: ${typeData.code}`);
            }
        }
    }

    /**
     * Invalider le cache
     */
    private invalidateCache(etablissementId?: string): void {
        if (!etablissementId) {
            this.cache.clear();
            this.cacheTimestamp.clear();
        } else {
            const keysToDelete = [];
            for (const key of this.cache.keys()) {
                if (key.includes(etablissementId)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => {
                this.cache.delete(key);
                this.cacheTimestamp.delete(key);
            });
        }
    }
}

export const typeContratService = new TypeContratService();
