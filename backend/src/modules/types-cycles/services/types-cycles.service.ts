/**
 * ==================================
 * eLISAschool - Service Types-Cycles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TypeCycle } from '../entities';
import { CreateTypeCycleDto, UpdateTypeCycleDto, QueryTypesCyclesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class TypesCyclesService {
    private repo: Repository<TypeCycle>;

    constructor() {
        this.repo = AppDataSource.getRepository(TypeCycle);
    }

    async create(dto: CreateTypeCycleDto): Promise<TypeCycle> {
        // Vérifier unicité du code
        const existingCode = await this.repo.findOne({ where: { code: dto.code } });
        if (existingCode) {
            throw new AppError('Un type de cycle avec ce code existe déjà', 409, 'TYPE_CYCLE_CODE_EXISTS');
        }

        // Vérifier unicité du nom
        const existingNom = await this.repo.findOne({ where: { nom: dto.nom } });
        if (existingNom) {
            throw new AppError('Un type de cycle avec ce nom existe déjà', 409, 'TYPE_CYCLE_NOM_EXISTS');
        }

        const typeCycle = this.repo.create(dto);
        await this.repo.save(typeCycle);
        logger.info(`Type de cycle créé: ${dto.nom} (${dto.code})`);
        return typeCycle;
    }

    async findAll(query: QueryTypesCyclesDto = {}): Promise<PaginatedResult<TypeCycle>> {
        const { page = 1, limit = 20, search, actif, sortBy = 'ordre', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('typeCycle')
            .leftJoinAndSelect('typeCycle.cycles', 'cycles');

        if (search) {
            qb.andWhere('(typeCycle.nom ILIKE :search OR typeCycle.code ILIKE :search)', { search: `%${search}%` });
        }

        if (actif !== undefined) {
            qb.andWhere('typeCycle.actif = :actif', { actif });
        }

        const allowedSortFields = ['ordre', 'nom', 'code', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'ordre';
        qb.orderBy(`typeCycle.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(): Promise<TypeCycle[]> {
        return this.repo.find({ order: { ordre: 'ASC' } });
    }

    async findOne(id: string): Promise<TypeCycle> {
        const typeCycle = await this.repo.findOne({ 
            where: { id },
            relations: ['cycles']
        });
        if (!typeCycle) {
            throw new AppError('Type de cycle non trouvé', 404, 'NOT_FOUND');
        }
        return typeCycle;
    }

    async update(id: string, dto: UpdateTypeCycleDto): Promise<TypeCycle> {
        const typeCycle = await this.findOne(id);

        // Vérifier unicité du code si modifié
        if (dto.code && dto.code !== typeCycle.code) {
            const existingCode = await this.repo.findOne({ where: { code: dto.code } });
            if (existingCode) {
                throw new AppError('Un type de cycle avec ce code existe déjà', 409, 'TYPE_CYCLE_CODE_EXISTS');
            }
        }

        // Vérifier unicité du nom si modifié
        if (dto.nom && dto.nom !== typeCycle.nom) {
            const existingNom = await this.repo.findOne({ where: { nom: dto.nom } });
            if (existingNom) {
                throw new AppError('Un type de cycle avec ce nom existe déjà', 409, 'TYPE_CYCLE_NOM_EXISTS');
            }
        }

        Object.assign(typeCycle, dto);
        await this.repo.save(typeCycle);
        logger.info(`Type de cycle modifié: ${typeCycle.nom}`);
        return typeCycle;
    }

    async delete(id: string): Promise<void> {
        const typeCycle = await this.findOne(id);
        
        // Vérifier s'il y a des cycles associés
        if (typeCycle.cycles && typeCycle.cycles.length > 0) {
            throw new AppError(
                `Impossible de supprimer : ${typeCycle.cycles.length} cycle(s) pédagogique(s) associé(s)`,
                400,
                'TYPE_CYCLE_HAS_CYCLES'
            );
        }

        await this.repo.remove(typeCycle);
        logger.info(`Type de cycle supprimé: ${typeCycle.nom}`);
    }
}

export const typesCyclesService = new TypesCyclesService();
