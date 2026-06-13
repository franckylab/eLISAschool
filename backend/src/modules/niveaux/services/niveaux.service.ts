/**
 * ==================================
 * eLISAschool - Service Niveaux
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Niveau } from '../entities';
import { CreateNiveauDto, UpdateNiveauDto, QueryNiveauxDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class NiveauxService {
    private repo: Repository<Niveau>;

    constructor() {
        this.repo = AppDataSource.getRepository(Niveau);
    }

    async create(dto: CreateNiveauDto): Promise<Niveau> {
        const niveau = this.repo.create(dto);
        await this.repo.save(niveau);
        logger.info(`Niveau créé: ${dto.nom}`);
        return niveau;
    }

    async findAll(query: QueryNiveauxDto = {}): Promise<PaginatedResult<Niveau>> {
        const { page = 1, limit = 20, search, cycleId, sousSysteme, actif, estClasseExamen, sortBy = 'ordre', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('niveau')
            .leftJoinAndSelect('niveau.cycle', 'cycle');

        if (search) {
            qb.andWhere('(niveau.nom ILIKE :search OR niveau.code ILIKE :search)', { search: `%${search}%` });
        }

        if (cycleId) {
            qb.andWhere('niveau.cycleId = :cycleId', { cycleId });
        }

        if (sousSysteme) {
            qb.andWhere('niveau.sousSysteme = :sousSysteme', { sousSysteme });
        }

        if (actif !== undefined) {
            qb.andWhere('niveau.actif = :actif', { actif });
        }

        if (estClasseExamen !== undefined) {
            qb.andWhere('niveau.estClasseExamen = :estClasseExamen', { estClasseExamen });
        }

        const allowedSortFields = ['ordre', 'nom', 'code', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'ordre';
        qb.orderBy(`niveau.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(cycleId?: string): Promise<Niveau[]> {
        const where: any = {};
        if (cycleId) where.cycleId = cycleId;
        return this.repo.find({ where, order: { cycleId: 'ASC', ordre: 'ASC' }, relations: ['cycle'] });
    }

    async findOne(id: string): Promise<Niveau> {
        const niveau = await this.repo.findOne({ where: { id }, relations: ['cycle'] });
        if (!niveau) throw new AppError('Niveau non trouvé', 404, 'NOT_FOUND');
        return niveau;
    }

    async update(id: string, dto: UpdateNiveauDto): Promise<Niveau> {
        const niveau = await this.findOne(id);
        Object.assign(niveau, dto);
        await this.repo.save(niveau);
        return niveau;
    }

    async delete(id: string): Promise<void> {
        const niveau = await this.findOne(id);
        await this.repo.remove(niveau);
        logger.info(`Niveau supprimé: ${id}`);
    }
}

export const niveauxService = new NiveauxService();
