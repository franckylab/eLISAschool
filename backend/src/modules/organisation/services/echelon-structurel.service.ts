/**
 * ==================================
 * eLISAschool - Service EchelonStructurel
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Service de gestion des échelons structurels (fusion NiveauOrganisation + UsageUnite).
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { EchelonStructurel } from '../entities';
import {
    CreateEchelonStructurelDto,
    UpdateEchelonStructurelDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class EchelonStructurelService {
    private repo: Repository<EchelonStructurel>;

    constructor() {
        this.repo = AppDataSource.getRepository(EchelonStructurel);
    }

    async create(dto: CreateEchelonStructurelDto): Promise<EchelonStructurel> {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<EchelonStructurel[]> {
        const qb = this.repo.createQueryBuilder('e');
        if (etablissementId) {
            qb.where('(e.etablissementId = :eid OR e.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(e.etablissementId IS NULL OR e.estSysteme = TRUE)');
        }
        return qb.orderBy('e.niveau', 'ASC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, niveau?: number) {
        const qb = this.repo.createQueryBuilder('e');
        if (etablissementId) {
            qb.where('(e.etablissementId = :eid OR e.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(e.etablissementId IS NULL OR e.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(e.label ILIKE :search OR e.code ILIKE :search OR e.description ILIKE :search)', { search: `%${search}%` });
        }
        if (niveau !== undefined) {
            qb.andWhere('e.niveau = :niveau', { niveau });
        }
        qb.orderBy('e.niveau', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<EchelonStructurel> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Échelon structurel non trouvé', 404, 'ECHELON_STRUCTUREL_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateEchelonStructurelDto): Promise<EchelonStructurel> {
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

export const echelonStructurelService = new EchelonStructurelService();
