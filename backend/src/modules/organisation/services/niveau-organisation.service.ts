/**
 * ==================================
 * eLISAschool - Service NiveauOrganisation
 * ==================================
 * Éclaté depuis nomenclature.service.ts
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { NiveauOrganisation } from '../entities';
import {
    CreateNiveauOrganisationDto,
    UpdateNiveauOrganisationDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class NiveauOrganisationService {
    private repo: Repository<NiveauOrganisation>;

    constructor() {
        this.repo = AppDataSource.getRepository(NiveauOrganisation);
    }

    async create(dto: CreateNiveauOrganisationDto): Promise<NiveauOrganisation> {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<NiveauOrganisation[]> {
        const qb = this.repo.createQueryBuilder('n');
        if (etablissementId) {
            qb.where('(n.etablissementId = :eid OR n.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(n.etablissementId IS NULL OR n.estSysteme = TRUE)');
        }
        return qb.orderBy('n.niveau', 'ASC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, niveau?: number) {
        const qb = this.repo.createQueryBuilder('n');
        if (etablissementId) {
            qb.where('(n.etablissementId = :eid OR n.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(n.etablissementId IS NULL OR n.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(n.label ILIKE :search OR n.description ILIKE :search)', { search: `%${search}%` });
        }
        if (niveau !== undefined) {
            qb.andWhere('n.niveau = :niveau', { niveau });
        }
        qb.orderBy('n.niveau', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<NiveauOrganisation> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Niveau d\'organisation non trouvé', 404, 'NIVEAU_ORG_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateNiveauOrganisationDto): Promise<NiveauOrganisation> {
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

export const niveauOrganisationService = new NiveauOrganisationService();
