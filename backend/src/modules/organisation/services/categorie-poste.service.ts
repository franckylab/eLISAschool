/**
 * ==================================
 * eLISAschool - Service CategoriePoste
 * ==================================
 * Éclaté depuis nomenclature.service.ts
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { CategoriePoste } from '../entities';
import { CreateCategoriePosteDto, UpdateCategoriePosteDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class CategoriePosteService {
    private repo: Repository<CategoriePoste>;

    constructor() {
        this.repo = AppDataSource.getRepository(CategoriePoste);
    }

    async create(dto: CreateCategoriePosteDto): Promise<CategoriePoste> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? undefined } });
        if (existing) throw new AppError('Ce code de catégorie existe déjà', 409, 'CATEGORIE_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<CategoriePoste[]> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;
        return this.repo.find({ where, order: { label: 'ASC' } });
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string) {
        const qb = this.repo.createQueryBuilder('c');
        if (etablissementId) {
            qb.where('(c.etablissementId = :eid OR c.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(c.etablissementId IS NULL OR c.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(c.label ILIKE :search OR c.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('c.label', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<CategoriePoste> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Catégorie de poste non trouvée', 404, 'CATEGORIE_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateCategoriePosteDto): Promise<CategoriePoste> {
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

export const categoriePosteService = new CategoriePosteService();
