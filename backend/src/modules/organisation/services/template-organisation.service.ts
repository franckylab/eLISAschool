/**
 * ==================================
 * eLISAschool - Service TemplateOrganisation
 * ==================================
 * Éclaté depuis nomenclature.service.ts
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TemplateOrganisation } from '../entities';
import { CreateTemplateOrganisationDto, UpdateTemplateOrganisationDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class TemplateOrganisationService {
    private repo: Repository<TemplateOrganisation>;

    constructor() {
        this.repo = AppDataSource.getRepository(TemplateOrganisation);
    }

    async create(dto: CreateTemplateOrganisationDto): Promise<TemplateOrganisation> {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<TemplateOrganisation[]> {
        const qb = this.repo.createQueryBuilder('t');
        if (etablissementId) {
            qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(t.etablissementId IS NULL OR t.estSysteme = TRUE)');
        }
        qb.andWhere('t.actif = TRUE').orderBy('t.nom', 'ASC');
        return qb.getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, actif?: boolean) {
        const qb = this.repo.createQueryBuilder('t');
        if (etablissementId) {
            qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(t.etablissementId IS NULL OR t.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(t.nom ILIKE :search OR t.description ILIKE :search)', { search: `%${search}%` });
        }
        if (actif !== undefined) {
            qb.andWhere('t.actif = :actif', { actif });
        }
        qb.orderBy('t.nom', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<TemplateOrganisation> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Template d\'organisation non trouvé', 404, 'TEMPLATE_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateTemplateOrganisationDto): Promise<TemplateOrganisation> {
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

export const templateOrganisationService = new TemplateOrganisationService();
