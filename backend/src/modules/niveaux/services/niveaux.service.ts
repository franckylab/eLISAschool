/**
 * ==================================
 * eLISAschool - Service Niveaux
 * ==================================
 * Version: 2.0.0
 * 
 * Changements v2.0:
 * - Toutes les méthodes scopées par etablissementId (multi-tenant)
 * - Filtrage systématique par établissement
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Niveau } from '../entities';
import { CreateNiveauDto, UpdateNiveauDto, QueryNiveauxDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class NiveauxService {
    private repo: Repository<Niveau>;

    constructor() {
        this.repo = AppDataSource.getRepository(Niveau);
    }

    async create(dto: CreateNiveauDto, etablissementId: string): Promise<Niveau> {
        // Vérifier unicité du code pour un sous-système ET établissement donnés
        if (dto.code) {
            const existing = await this.repo.findOne({
                where: { code: dto.code, sousSysteme: dto.sousSysteme, etablissementId }
            });
            if (existing) {
                throw new AppError('Un niveau avec ce code existe déjà pour ce sous-système dans cet établissement', 409, 'NIVEAU_EXISTS');
            }
        }

        const niveau = this.repo.create({ ...dto, etablissementId });
        await this.repo.save(niveau);
        logger.info(`Niveau créé: ${dto.nom} (${dto.code}) pour établissement ${etablissementId}`);
        return niveau;
    }

    async findAll(query: QueryNiveauxDto = {}, etablissementId: string): Promise<PaginatedResult<Niveau>> {
        const { page = 1, limit = 20, search, cycleId, sousSysteme, actif, estClasseExamen, sortBy = 'ordre', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('niveau')
            .leftJoinAndSelect('niveau.cycle', 'cycle')
            .where('niveau.etablissementId = :etablissementId', { etablissementId });

        if (search) {
            qb.andWhere('(niveau.nom ILIKE :search OR niveau.code ILIKE :search)', { search: `%${search}%` });
        }

        if (cycleId) {
            qb.andWhere('niveau.cycleId = :cycleId', { cycleId });
        }

        if (sousSysteme) {
            qb.andWhere('niveau.sousSysteme = :sousSysteme', { sousSysteme });
        }

        if (actif !== undefined) {
            qb.andWhere('niveau.actif = :actif', { actif });
        }

        if (estClasseExamen !== undefined) {
            qb.andWhere('niveau.estClasseExamen = :estClasseExamen', { estClasseExamen });
        }

        const allowedSortFields = ['ordre', 'nom', 'code', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'ordre';
        qb.orderBy(`niveau.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(etablissementId: string, cycleId?: string): Promise<Niveau[]> {
        const where: any = { etablissementId };
        if (cycleId) where.cycleId = cycleId;
        return this.repo.find({ where, order: { cycleId: 'ASC', ordre: 'ASC' }, relations: ['cycle'] });
    }

    async findOne(id: string, etablissementId: string): Promise<Niveau> {
        const niveau = await this.repo.findOne({ where: { id, etablissementId }, relations: ['cycle'] });
        if (!niveau) throw new AppError('Niveau non trouvé', 404, 'NOT_FOUND');
        return niveau;
    }

    async update(id: string, dto: UpdateNiveauDto, etablissementId: string): Promise<Niveau> {
        const niveau = await this.findOne(id, etablissementId);
        Object.assign(niveau, dto);
        await this.repo.save(niveau);
        return niveau;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const niveau = await this.findOne(id, etablissementId);
        await this.repo.remove(niveau);
        logger.info(`Niveau supprimé: ${id} (établissement ${etablissementId})`);
    }
}

export const niveauxService = new NiveauxService();
