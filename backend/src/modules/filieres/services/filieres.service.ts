/**
 * ==================================
 * eLISAschool - Service Filières
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Filiere } from '../entities';
import { CreateFiliereDto, UpdateFiliereDto, QueryFilieresDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class FilieresService {
    private repo: Repository<Filiere>;

    constructor() {
        this.repo = AppDataSource.getRepository(Filiere);
    }

    async create(dto: CreateFiliereDto): Promise<Filiere> {
        // Vérifier unicité du code pour un cycle donné
        const existing = await this.repo.findOne({ 
            where: { code: dto.code, cycleId: dto.cycleId } 
        });
        if (existing) {
            throw new AppError('Une filière avec ce code existe déjà pour ce cycle', 409, 'FILIERE_EXISTS');
        }

        const filiere = this.repo.create(dto);
        await this.repo.save(filiere);
        logger.info(`Filière créée: ${dto.nom} (${dto.code})`);
        return filiere;
    }

    async findAll(query: QueryFilieresDto = {}): Promise<PaginatedResult<Filiere>> {
        const { page = 1, limit = 20, search, cycleId, sousSysteme, actif, sortBy = 'nom', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('filiere')
            .leftJoinAndSelect('filiere.cycle', 'cycle');

        if (search) {
            qb.andWhere('(filiere.nom ILIKE :search OR filiere.code ILIKE :search)', { search: `%${search}%` });
        }

        if (cycleId) {
            qb.andWhere('filiere.cycleId = :cycleId', { cycleId });
        }

        if (sousSysteme) {
            qb.andWhere('filiere.sousSysteme = :sousSysteme', { sousSysteme });
        }

        if (actif !== undefined) {
            qb.andWhere('filiere.actif = :actif', { actif });
        }

        const allowedSortFields = ['nom', 'code', 'ordre', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'nom';
        qb.orderBy(`filiere.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(cycleId?: string): Promise<Filiere[]> {
        const where = cycleId ? { cycleId } : {};
        return this.repo.find({ where, order: { nom: 'ASC' }, relations: ['cycle'] });
    }

    async findOne(id: string): Promise<Filiere> {
        const filiere = await this.repo.findOne({ 
            where: { id },
            relations: ['cycle']
        });
        if (!filiere) {
            throw new AppError('Filière non trouvée', 404, 'NOT_FOUND');
        }
        return filiere;
    }

    async update(id: string, dto: UpdateFiliereDto): Promise<Filiere> {
        const filiere = await this.findOne(id);

        // Vérifier unicité du code si modifié
        if (dto.code && dto.code !== filiere.code) {
            const cycleId = dto.cycleId || filiere.cycleId;
            const existing = await this.repo.findOne({ 
                where: { code: dto.code, cycleId } 
            });
            if (existing) {
                throw new AppError('Une filière avec ce code existe déjà pour ce cycle', 409, 'FILIERE_EXISTS');
            }
        }

        Object.assign(filiere, dto);
        await this.repo.save(filiere);
        logger.info(`Filière modifiée: ${filiere.nom}`);
        return filiere;
    }

    async delete(id: string): Promise<void> {
        const filiere = await this.findOne(id);
        await this.repo.remove(filiere);
        logger.info(`Filière supprimée: ${filiere.nom}`);
    }
}

export const filieresService = new FilieresService();
