/**
 * ==================================
 * eLISAschool - Service Examens-Nationaux
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ExamenNational } from '../entities';
import { CreateExamenNationalDto, UpdateExamenNationalDto, QueryExamensNationauxDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class ExamensNationauxService {
    private repo: Repository<ExamenNational>;

    constructor() {
        this.repo = AppDataSource.getRepository(ExamenNational);
    }

    async create(dto: CreateExamenNationalDto): Promise<ExamenNational> {
        // Vérifier unicité du code
        const existing = await this.repo.findOne({ where: { code: dto.code } });
        if (existing) {
            throw new AppError('Un examen national avec ce code existe déjà', 409, 'EXAMEN_CODE_EXISTS');
        }

        const examen = this.repo.create({
            ...dto,
            dateProgrammation: dto.dateProgrammation ? new Date(dto.dateProgrammation) : undefined,
        });
        await this.repo.save(examen);
        logger.info(`Examen national créé: ${dto.nom} (${dto.code})`);
        return examen;
    }

    async findAll(query: QueryExamensNationauxDto = {}): Promise<PaginatedResult<ExamenNational>> {
        const { page = 1, limit = 20, search, niveauId, type, sousSysteme, actif, sortBy = 'nom', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('examen')
            .leftJoinAndSelect('examen.niveau', 'niveau');

        if (search) {
            qb.andWhere('(examen.nom ILIKE :search OR examen.code ILIKE :search)', { search: `%${search}%` });
        }

        if (niveauId) {
            qb.andWhere('examen.niveauId = :niveauId', { niveauId });
        }

        if (type) {
            qb.andWhere('examen.type = :type', { type });
        }

        if (sousSysteme) {
            qb.andWhere('examen.sousSysteme = :sousSysteme', { sousSysteme });
        }

        if (actif !== undefined) {
            qb.andWhere('examen.actif = :actif', { actif });
        }

        const allowedSortFields = ['nom', 'code', 'type', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'nom';
        qb.orderBy(`examen.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(niveauId?: string): Promise<ExamenNational[]> {
        const where = niveauId ? { niveauId } : {};
        return this.repo.find({ where, order: { nom: 'ASC' }, relations: ['niveau'] });
    }

    async findOne(id: string): Promise<ExamenNational> {
        const examen = await this.repo.findOne({ 
            where: { id },
            relations: ['niveau']
        });
        if (!examen) {
            throw new AppError('Examen national non trouvé', 404, 'NOT_FOUND');
        }
        return examen;
    }

    async update(id: string, dto: UpdateExamenNationalDto): Promise<ExamenNational> {
        const examen = await this.findOne(id);

        // Vérifier unicité du code si modifié
        if (dto.code && dto.code !== examen.code) {
            const existing = await this.repo.findOne({ where: { code: dto.code } });
            if (existing) {
                throw new AppError('Un examen national avec ce code existe déjà', 409, 'EXAMEN_CODE_EXISTS');
            }
        }

        Object.assign(examen, {
            ...dto,
            dateProgrammation: dto.dateProgrammation ? new Date(dto.dateProgrammation) : examen.dateProgrammation,
        });
        await this.repo.save(examen);
        logger.info(`Examen national modifié: ${examen.nom}`);
        return examen;
    }

    async delete(id: string): Promise<void> {
        const examen = await this.findOne(id);
        await this.repo.remove(examen);
        logger.info(`Examen national supprimé: ${examen.nom}`);
    }
}

export const examensNationauxService = new ExamensNationauxService();
