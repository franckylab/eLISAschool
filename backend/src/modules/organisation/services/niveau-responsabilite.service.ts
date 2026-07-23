/**
 * ==================================
 * eLISAschool - Service NiveauResponsabilite
 * ==================================
 * Éclaté depuis nomenclature.service.ts
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { NiveauResponsabilite } from '../entities';
import { CreateNiveauResponsabiliteDto, UpdateNiveauResponsabiliteDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class NiveauResponsabiliteService {
    private repo: Repository<NiveauResponsabilite>;

    constructor() {
        this.repo = AppDataSource.getRepository(NiveauResponsabilite);
    }

    async create(dto: CreateNiveauResponsabiliteDto): Promise<NiveauResponsabilite> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? undefined } });
        if (existing) throw new AppError('Ce code de niveau existe déjà', 409, 'NIVEAU_RESP_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<NiveauResponsabilite[]> {
        const qb = this.repo.createQueryBuilder('n');
        if (etablissementId) {
            qb.where('(n.etablissementId = :eid OR n.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(n.etablissementId IS NULL OR n.estSysteme = TRUE)');
        }
        return qb.orderBy('n.niveau', 'DESC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, niveau?: number) {
        const qb = this.repo.createQueryBuilder('n');
        if (etablissementId) {
            qb.where('(n.etablissementId = :eid OR n.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(n.etablissementId IS NULL OR n.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(n.label ILIKE :search OR n.code ILIKE :search)', { search: `%${search}%` });
        }
        if (niveau !== undefined) {
            qb.andWhere('n.niveau = :niveau', { niveau });
        }
        qb.orderBy('n.niveau', 'DESC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<NiveauResponsabilite> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Niveau de responsabilité non trouvé', 404, 'NIVEAU_RESP_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateNiveauResponsabiliteDto): Promise<NiveauResponsabilite> {
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

export const niveauResponsabiliteService = new NiveauResponsabiliteService();
