/**
 * ==================================
 * eLISAschool - Service TypeRelationHierarchique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * CRUD des types de relation hiérarchique (nomenclature éditable).
 * Les types système (etablissementId null, estSysteme = true) sont toujours
 * visibles et protégés en suppression.
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TypeRelationHierarchique } from '../entities';
import { CreateTypeRelationHierarchiqueDto, UpdateTypeRelationHierarchiqueDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class TypeRelationHierarchiqueService {
    private repo: Repository<TypeRelationHierarchique>;

    constructor() {
        this.repo = AppDataSource.getRepository(TypeRelationHierarchique);
    }

    async create(dto: CreateTypeRelationHierarchiqueDto): Promise<TypeRelationHierarchique> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? undefined } });
        if (existing) throw new AppError('Ce code de type de relation existe déjà', 409, 'TYPE_RELATION_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<TypeRelationHierarchique[]> {
        const qb = this.repo.createQueryBuilder('t');
        if (etablissementId) {
            qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(t.etablissementId IS NULL OR t.estSysteme = TRUE)');
        }
        return qb.orderBy('t.label', 'ASC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string) {
        const qb = this.repo.createQueryBuilder('t');
        if (etablissementId) {
            qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(t.etablissementId IS NULL OR t.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(t.label ILIKE :search OR t.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('t.label', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<TypeRelationHierarchique> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Type de relation non trouvé', 404, 'TYPE_RELATION_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateTypeRelationHierarchiqueDto): Promise<TypeRelationHierarchique> {
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

export const typeRelationHierarchiqueService = new TypeRelationHierarchiqueService();
