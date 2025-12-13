/**
 * ==================================
 * eLISAschool - Service Niveaux
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Niveau } from '../entities';
import { CreateNiveauDto, UpdateNiveauDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

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

    async findAll(cycleId?: string): Promise<Niveau[]> {
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
