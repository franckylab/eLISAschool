/**
 * ==================================
 * eLISAschool - Service Diplomes-Eleves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { DiplomeEleve } from '../entities';
import { CreateDiplomeEleveDto, UpdateDiplomeEleveDto, QueryDiplomesElevesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { auditService, AuditAction } from '@modules/auth';

export class DiplomesElevesService {
    private repo: Repository<DiplomeEleve>;

    constructor() {
        this.repo = AppDataSource.getRepository(DiplomeEleve);
    }

    async create(dto: CreateDiplomeEleveDto, utilisateurId?: string, etablissementId?: string): Promise<DiplomeEleve> {
        // Vérifier si l'élève a déjà ce diplôme
        const existing = await this.repo.findOne({ 
            where: { 
                eleveId: dto.eleveId, 
                examenNationalId: dto.examenNationalId 
            } 
        });
        if (existing) {
            throw new AppError('Ce diplôme existe déjà pour cet élève', 409, 'DIPLOME_EXISTS');
        }

        const diplome = this.repo.create({
            ...dto,
            dateObtention: new Date(dto.dateObtention),
        });
        await this.repo.save(diplome);
        logger.info(`Diplôme enregistré pour élève ${dto.eleveId}: ${dto.examenNationalId}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.DIPLOME_CREATE,
            cible: 'DiplomeEleve',
            cibleId: diplome.id,
            description: `Diplôme enregistré pour élève ${dto.eleveId}`,
            module: 'diplomes-eleves',
            etablissementId,
            metadata: { entiteLabel: `Élève ${dto.eleveId}` },
        });

        return diplome;
    }

    async findAll(query: QueryDiplomesElevesDto = {}): Promise<PaginatedResult<DiplomeEleve>> {
        const { page = 1, limit = 20, search, eleveId, examenNationalId, resultat, anneeObtention, sortBy = 'dateObtention', sortOrder = 'DESC' } = query;

        const qb = this.repo.createQueryBuilder('diplome')
            .leftJoinAndSelect('diplome.eleve', 'eleve')
            .leftJoinAndSelect('diplome.examenNational', 'examen');

        if (eleveId) {
            qb.andWhere('diplome.eleveId = :eleveId', { eleveId });
        }

        if (examenNationalId) {
            qb.andWhere('diplome.examenNationalId = :examenNationalId', { examenNationalId });
        }

        if (resultat) {
            qb.andWhere('diplome.resultat = :resultat', { resultat });
        }

        if (anneeObtention) {
            qb.andWhere('EXTRACT(YEAR FROM diplome.dateObtention) = :annee', { annee: anneeObtention });
        }

        const allowedSortFields = ['dateObtention', 'resultat', 'mention', 'createdAt'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'dateObtention';
        qb.orderBy(`diplome.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(eleveId?: string): Promise<DiplomeEleve[]> {
        const where = eleveId ? { eleveId } : {};
        return this.repo.find({ where, order: { dateObtention: 'DESC' }, relations: ['eleve', 'examenNational'] });
    }

    async findByEleve(eleveId: string): Promise<DiplomeEleve[]> {
        return this.repo.find({ 
            where: { eleveId },
            order: { dateObtention: 'DESC' },
            relations: ['eleve', 'examenNational']
        });
    }

    async findOne(id: string): Promise<DiplomeEleve> {
        const diplome = await this.repo.findOne({ 
            where: { id },
            relations: ['eleve', 'examenNational']
        });
        if (!diplome) {
            throw new AppError('Diplôme non trouvé', 404, 'NOT_FOUND');
        }
        return diplome;
    }

    async update(id: string, dto: UpdateDiplomeEleveDto, utilisateurId?: string, etablissementId?: string): Promise<DiplomeEleve> {
        const diplome = await this.findOne(id);

        Object.assign(diplome, {
            ...dto,
            dateObtention: dto.dateObtention ? new Date(dto.dateObtention) : diplome.dateObtention,
        });
        await this.repo.save(diplome);
        logger.info(`Diplôme modifié: ${diplome.id}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.DIPLOME_UPDATE,
            cible: 'DiplomeEleve',
            cibleId: diplome.id,
            description: `Diplôme modifié: ${diplome.id}`,
            module: 'diplomes-eleves',
            etablissementId,
            metadata: { entiteLabel: `Diplôme ${diplome.id}` },
        });

        return diplome;
    }

    async delete(id: string, utilisateurId?: string, etablissementId?: string): Promise<void> {
        const diplome = await this.findOne(id);
        await this.repo.remove(diplome);
        logger.info(`Diplôme supprimé: ${diplome.id}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.DIPLOME_DELETE,
            cible: 'DiplomeEleve',
            cibleId: id,
            description: `Diplôme supprimé: ${diplome.id}`,
            module: 'diplomes-eleves',
            etablissementId,
            metadata: { entiteLabel: `Diplôme ${diplome.id}` },
        });
    }
}

export const diplomesElevesService = new DiplomesElevesService();
