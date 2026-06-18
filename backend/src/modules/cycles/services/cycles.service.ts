/**
 * ==================================
 * eLISAschool - Service Cycles
 * ==================================
 * Version: 2.0.0
 * 
 * Changements v2.0:
 * - Toutes les méthodes scopées par etablissementId (multi-tenant)
 * - Vérification d'unicité par établissement (code + etablissementId)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Cycle } from '../entities';
import { CreateCycleDto, UpdateCycleDto, QueryCyclesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class CyclesService {
    private repo: Repository<Cycle>;

    constructor() {
        this.repo = AppDataSource.getRepository(Cycle);
    }

    async create(dto: CreateCycleDto, etablissementId: string): Promise<Cycle> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId } });
        if (existing) {
            throw new AppError('Un cycle avec ce code existe déjà pour cet établissement', 409, 'CYCLE_EXISTS');
        }

        const cycle = this.repo.create({ ...dto, etablissementId });
        await this.repo.save(cycle);
        logger.info(`Cycle créé: ${dto.nom} (${dto.code}) pour établissement ${etablissementId}`);
        return cycle;
    }

    async findAll(query: QueryCyclesDto = {}, etablissementId: string): Promise<PaginatedResult<Cycle>> {
        const { page = 1, limit = 20, search, actif, sortBy = 'ordre', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('cycle')
            .where('cycle.etablissementId = :etablissementId', { etablissementId });

        // Filtre par recherche
        if (search) {
            qb.andWhere('(cycle.nom ILIKE :search OR cycle.code ILIKE :search OR cycle.description ILIKE :search)', { search: `%${search}%` });
        }

        // Filtre par statut actif
        if (actif !== undefined) {
            qb.andWhere('cycle.actif = :actif', { actif });
        }

        // Tri - champs autorisés
        const allowedSortFields = ['ordre', 'nom', 'code', 'createdAt', 'actif', 'dureeAnnees'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'ordre';
        qb.orderBy(`cycle.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(etablissementId: string): Promise<Cycle[]> {
        return this.repo.find({
            where: { etablissementId },
            order: { ordre: 'ASC' },
        });
    }

    async findOne(id: string, etablissementId: string): Promise<Cycle> {
        const cycle = await this.repo.findOne({ where: { id, etablissementId } });
        if (!cycle) throw new AppError('Cycle non trouvé', 404, 'NOT_FOUND');
        return cycle;
    }

    async update(id: string, dto: UpdateCycleDto, etablissementId: string): Promise<Cycle> {
        const cycle = await this.findOne(id, etablissementId);
        Object.assign(cycle, dto);
        await this.repo.save(cycle);
        return cycle;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const cycle = await this.findOne(id, etablissementId);
        await this.repo.remove(cycle);
        logger.info(`Cycle supprimé: ${id} (établissement ${etablissementId})`);
    }
}

export const cyclesService = new CyclesService();
