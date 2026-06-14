/**
 * ==================================
 * eLISAschool - Service Competences
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
import { Competence } from '../entities';
import { CreateCompetenceDto, UpdateCompetenceDto, QueryCompetencesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class CompetencesService {
    private repo: Repository<Competence>;

    constructor() {
        this.repo = AppDataSource.getRepository(Competence);
    }

    async create(dto: CreateCompetenceDto, etablissementId: string): Promise<Competence> {
        // Vérifier unicité du code PAR établissement
        const existing = await this.repo.findOne({ 
            where: { code: dto.code, etablissementId } 
        });
        if (existing) {
            throw new AppError('Une compétence avec ce code existe déjà dans cet établissement', 409, 'COMPETENCE_EXISTS');
        }

        const competence = this.repo.create({
            ...dto,
            etablissementId,
        });
        await this.repo.save(competence);
        logger.info(`Compétence créée: ${dto.libelle} pour établissement ${etablissementId}`);
        return competence;
    }

    async findAll(query: QueryCompetencesDto = {}, etablissementId: string): Promise<PaginatedResult<Competence>> {
        const { page = 1, limit = 20, search, niveauId, matiereId, domaine, actif, sortBy = 'ordre', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('competence')
            .leftJoinAndSelect('competence.niveau', 'niveau')
            .leftJoinAndSelect('competence.matiere', 'matiere')
            .where('competence.etablissementId = :etablissementId', { etablissementId });

        // Filtre par niveau
        if (niveauId) {
            qb.andWhere('competence.niveauId = :niveauId', { niveauId });
        }

        // Filtre par matière
        if (matiereId) {
            qb.andWhere('competence.matiereId = :matiereId', { matiereId });
        }

        // Filtre par domaine
        if (domaine) {
            qb.andWhere('competence.domaine ILIKE :domaine', { domaine: `%${domaine}%` });
        }

        // Filtre par recherche
        if (search) {
            qb.andWhere('(competence.code ILIKE :search OR competence.libelle ILIKE :search OR competence.domaine ILIKE :search)', { search: `%${search}%` });
        }

        // Filtre par statut actif
        if (actif !== undefined) {
            qb.andWhere('competence.actif = :actif', { actif });
        }

        // Tri - champs autorisés
        const allowedSortFields = ['ordre', 'code', 'libelle', 'domaine', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'ordre';
        qb.orderBy(`competence.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findByNiveau(niveauId: string, etablissementId: string): Promise<Competence[]> {
        return this.repo.find({
            where: { niveauId, etablissementId, actif: true },
            order: { ordre: 'ASC' },
            relations: ['niveau', 'matiere'],
        });
    }

    async findByMatiere(matiereId: string, etablissementId: string): Promise<Competence[]> {
        return this.repo.find({
            where: { matiereId, etablissementId, actif: true },
            order: { ordre: 'ASC' },
            relations: ['niveau', 'matiere'],
        });
    }

    async findAllSimple(etablissementId: string): Promise<Competence[]> {
        return this.repo.find({
            where: { etablissementId },
            order: { ordre: 'ASC' },
            relations: ['niveau', 'matiere'],
        });
    }

    async findOne(id: string, etablissementId: string): Promise<Competence> {
        const competence = await this.repo.findOne({ 
            where: { id, etablissementId }, 
            relations: ['niveau', 'matiere'] 
        });
        if (!competence) throw new AppError('Compétence non trouvée', 404, 'NOT_FOUND');
        return competence;
    }

    async update(id: string, dto: UpdateCompetenceDto, etablissementId: string): Promise<Competence> {
        const competence = await this.findOne(id, etablissementId);
        Object.assign(competence, dto);
        await this.repo.save(competence);
        return competence;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const competence = await this.findOne(id, etablissementId);
        await this.repo.remove(competence);
        logger.info(`Compétence supprimée: ${id}`);
    }
}

export const competencesService = new CompetencesService();
