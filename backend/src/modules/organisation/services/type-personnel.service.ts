/**
 * ==================================
 * eLISAschool - Service TypePersonnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * CRUD des types de personnel (nomenclature globale, sans etablissementId).
 * Les seeds système sont protégés (estSysteme = true, non supprimables).
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TypePersonnel } from '../entities';
import { CreateTypePersonnelDto, UpdateTypePersonnelDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class TypePersonnelService {
    private repo: Repository<TypePersonnel>;

    constructor() {
        this.repo = AppDataSource.getRepository(TypePersonnel);
    }

    async create(dto: CreateTypePersonnelDto): Promise<TypePersonnel> {
        const existing = await this.repo.findOne({ where: { code: dto.code } });
        if (existing) throw new AppError('Ce code de type de personnel existe déjà', 409, 'TYPE_PERSONNEL_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(): Promise<TypePersonnel[]> {
        return this.repo.find({ order: { nom: 'ASC' } });
    }

    async findAllPaginated(page: number, limit: number, search?: string) {
        const qb = this.repo.createQueryBuilder('t');
        if (search) {
            qb.where('(t.nom ILIKE :search OR t.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('t.nom', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<TypePersonnel> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Type de personnel non trouvé', 404, 'TYPE_PERSONNEL_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateTypePersonnelDto): Promise<TypePersonnel> {
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

export const typePersonnelService = new TypePersonnelService();
