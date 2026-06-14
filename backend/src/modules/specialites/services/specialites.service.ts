/**
 * ==================================
 * eLISAschool - Service Specialites
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Changements v2.0:
 * - Support multi-tenant avec etablissementId
 * - Toutes les requêtes sont filtrées par établissement
 * - Isolation totale des données entre établissements
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Specialite } from '../entities';
import { CreateSpecialiteDto, UpdateSpecialiteDto, QuerySpecialitesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class SpecialitesService {
    private repo: Repository<Specialite>;

    constructor() {
        this.repo = AppDataSource.getRepository(Specialite);
    }

    async create(dto: CreateSpecialiteDto, etablissementId: string): Promise<Specialite> {
        // Vérifier unicité du code par filière ET établissement
        const existing = await this.repo.findOne({ 
            where: { code: dto.code, filiereId: dto.filiereId, etablissementId } 
        });
        if (existing) {
            throw new AppError('Une spécialité avec ce code existe déjà dans cette filière pour cet établissement', 409, 'SPECIALITE_EXISTS');
        }

        const specialite = this.repo.create({
            ...dto,
            etablissementId,
        });
        await this.repo.save(specialite);
        logger.info(`Spécialité créée: ${dto.nom} pour établissement ${etablissementId}`);
        return specialite;
    }

    async findAll(query: QuerySpecialitesDto = {}, etablissementId: string): Promise<PaginatedResult<Specialite>> {
        const { page = 1, limit = 20, search, filiereId, actif, sortBy = 'ordre', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('specialite')
            .leftJoinAndSelect('specialite.filiere', 'filiere')
            .where('specialite.etablissementId = :etablissementId', { etablissementId });

        // Filtre par filière
        if (filiereId) {
            qb.andWhere('specialite.filiereId = :filiereId', { filiereId });
        }

        // Filtre par recherche
        if (search) {
            qb.andWhere('(specialite.nom ILIKE :search OR specialite.code ILIKE :search OR specialite.description ILIKE :search)', { search: `%${search}%` });
        }

        // Filtre par statut actif
        if (actif !== undefined) {
            qb.andWhere('specialite.actif = :actif', { actif });
        }

        // Tri - champs autorisés
        const allowedSortFields = ['ordre', 'nom', 'code', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'ordre';
        qb.orderBy(`specialite.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findByFiliere(filiereId: string, etablissementId: string): Promise<Specialite[]> {
        return this.repo.find({
            where: { filiereId, etablissementId, actif: true },
            order: { ordre: 'ASC' },
            relations: ['filiere'],
        });
    }

    async findAllSimple(etablissementId: string): Promise<Specialite[]> {
        return this.repo.find({
            where: { etablissementId },
            order: { ordre: 'ASC' },
            relations: ['filiere'],
        });
    }

    async findOne(id: string, etablissementId: string): Promise<Specialite> {
        const specialite = await this.repo.findOne({ 
            where: { id, etablissementId }, 
            relations: ['filiere'] 
        });
        if (!specialite) throw new AppError('Spécialité non trouvée', 404, 'NOT_FOUND');
        return specialite;
    }

    async update(id: string, dto: UpdateSpecialiteDto, etablissementId: string): Promise<Specialite> {
        const specialite = await this.findOne(id, etablissementId);
        Object.assign(specialite, dto);
        await this.repo.save(specialite);
        return specialite;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const specialite = await this.findOne(id, etablissementId);
        await this.repo.remove(specialite);
        logger.info(`Spécialité supprimée: ${id}`);
    }
}

export const specialitesService = new SpecialitesService();
