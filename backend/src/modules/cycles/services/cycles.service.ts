/**
 * ==================================
 * eLISAschool - Service Cycles
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Cycle } from '../entities';
import { CreateCycleDto, UpdateCycleDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class CyclesService {
    private repo: Repository<Cycle>;

    constructor() {
        this.repo = AppDataSource.getRepository(Cycle);
    }

    async create(dto: CreateCycleDto): Promise<Cycle> {
        const existing = await this.repo.findOne({ where: { code: dto.code } });
        if (existing) {
            throw new AppError('Cycle déjà existant', 409, 'CYCLE_EXISTS');
        }

        const cycle = this.repo.create(dto);
        await this.repo.save(cycle);
        logger.info(`Cycle créé: ${dto.nom}`);
        return cycle;
    }

    async findAll(): Promise<Cycle[]> {
        return this.repo.find({ order: { ordre: 'ASC' } });
    }

    async findOne(id: string): Promise<Cycle> {
        const cycle = await this.repo.findOne({ where: { id } });
        if (!cycle) throw new AppError('Cycle non trouvé', 404, 'NOT_FOUND');
        return cycle;
    }

    async update(id: string, dto: UpdateCycleDto): Promise<Cycle> {
        const cycle = await this.findOne(id);
        Object.assign(cycle, dto);
        await this.repo.save(cycle);
        return cycle;
    }

    async delete(id: string): Promise<void> {
        const cycle = await this.findOne(id);
        await this.repo.remove(cycle);
        logger.info(`Cycle supprimé: ${id}`);
    }
}

export const cyclesService = new CyclesService();
