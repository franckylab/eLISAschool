/**
 * ==================================
 * eLISAschool - Service UsageUnite
 * ==================================
 * Éclaté depuis nomenclature.service.ts
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { UsageUnite } from '../entities';
import { CreateUsageUniteDto, UpdateUsageUniteDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class UsageUniteService {
    private repo: Repository<UsageUnite>;

    constructor() {
        this.repo = AppDataSource.getRepository(UsageUnite);
    }

    async create(dto: CreateUsageUniteDto): Promise<UsageUnite> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? undefined } });
        if (existing) throw new AppError('Ce code d\'usage existe déjà', 409, 'USAGE_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<UsageUnite[]> {
        const qb = this.repo.createQueryBuilder('u');
        if (etablissementId) {
            qb.where('(u.etablissementId = :eid OR u.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(u.etablissementId IS NULL OR u.estSysteme = TRUE)');
        }
        return qb.orderBy('u.label', 'ASC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string) {
        const qb = this.repo.createQueryBuilder('u');
        if (etablissementId) {
            qb.where('(u.etablissementId = :eid OR u.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(u.etablissementId IS NULL OR u.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(u.label ILIKE :search OR u.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('u.label', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<UsageUnite> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Usage d\'unité non trouvé', 404, 'USAGE_UNITE_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateUsageUniteDto): Promise<UsageUnite> {
        const entity = await this.findById(id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string): Promise<void> {
        const entity = await this.findById(id);
        assertNotSystem(entity, 'supprimer');
        await this.repo.remove(entity);
    }
}

export const usageUniteService = new UsageUniteService();
