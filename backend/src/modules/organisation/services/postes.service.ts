import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Poste, StatutPoste } from '../entities';
import { AffectationPoste } from '@modules/personnel/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import type { CreatePosteDto, UpdatePosteDto, QueryPostesDto } from '../dto/poste.dto';

export class PostesService {
    private posteRepo: Repository<Poste>;
    private affectationRepo: Repository<AffectationPoste>;

    constructor() {
        this.posteRepo = AppDataSource.getRepository(Poste);
        this.affectationRepo = AppDataSource.getRepository(AffectationPoste);
    }

    async create(dto: CreatePosteDto): Promise<Poste> {
        const existing = await this.posteRepo.findOne({
            where: { code: dto.code, uniteOrganisationnelleId: dto.uniteOrganisationnelleId },
        });
        if (existing) {
            throw new AppError('Un poste avec ce code existe déjà dans cette unité', 409, 'POSTE_CODE_EXISTS');
        }

        const poste = this.posteRepo.create({
            intitule: dto.intitule,
            description: dto.description,
            code: dto.code,
            categoriePosteId: dto.categoriePosteId,
            niveauResponsabiliteId: dto.niveauResponsabiliteId,
            fonctionId: dto.fonctionId,
            uniteOrganisationnelleId: dto.uniteOrganisationnelleId,
            nombrePostes: dto.nombrePostes,
            competencesRequises: dto.competencesRequises,
            missions: dto.missions,
            statut: StatutPoste.VACANT,
            actif: true,
        });

        const saved = await this.posteRepo.save(poste);
        logger.info(`Poste créé: ${saved.intitule}`, { posteId: saved.id });
        return saved;
    }

    async findAll(query: QueryPostesDto, etablissementId?: string): Promise<PaginatedResult<Poste>> {
        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.uniteOrganisationnelle', 'uo')
            .leftJoinAndSelect('p.fonction', 'f')
            .leftJoinAndSelect('f.typePersonnel', 'ftp')
            .leftJoinAndSelect('p.categoriePoste', 'cp')
            .leftJoinAndSelect('p.niveauResponsabilite', 'nr');

        if (etablissementId) {
            qb.andWhere('uo.etablissementId = :etablissementId', { etablissementId });
        }
        if (query.search) {
            qb.andWhere('(p.intitule ILIKE :search OR p.code ILIKE :search)', { search: `%${query.search}%` });
        }
        if (query.categoriePosteId) {
            qb.andWhere('p.categoriePosteId = :categoriePosteId', { categoriePosteId: query.categoriePosteId });
        }
        if (query.statut) {
            qb.andWhere('p.statut = :statut', { statut: query.statut });
        }
        if (query.fonctionId) {
            qb.andWhere('p.fonctionId = :fonctionId', { fonctionId: query.fonctionId });
        }
        if (query.uniteOrganisationnelleId) {
            qb.andWhere('p.uniteOrganisationnelleId = :uniteOrganisationnelleId', { uniteOrganisationnelleId: query.uniteOrganisationnelleId });
        }
        if (query.vacant === true) {
            qb.andWhere('p."occupantsCount" < p."nombrePostes"');
        }
        if (query.sortBy) {
            qb.orderBy(`p.${query.sortBy}`, query.sortOrder);
        } else {
            qb.orderBy('p.createdAt', 'DESC');
        }

        return paginateWithQueryBuilder(qb, query.page, query.limit);
    }

    async findAllSimple(etablissementId?: string): Promise<Poste[]> {
        return this.posteRepo.find({
            where: { actif: true, uniteOrganisationnelle: { etablissementId } },
            relations: ['uniteOrganisationnelle', 'fonction', 'fonction.typePersonnel', 'categoriePoste', 'niveauResponsabilite'],
            order: { intitule: 'ASC' },
        });
    }

    async findVacants(etablissementId?: string): Promise<Poste[]> {
        return this.posteRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.uniteOrganisationnelle', 'uo')
            .where('p.actif = :actif', { actif: true })
            .andWhere('p.statut != :supprime', { supprime: StatutPoste.SUPPRIME })
            .andWhere('p."occupantsCount" < p."nombrePostes"')
            .andWhere('uo.etablissementId = :eid', { eid: etablissementId })
            .orderBy('p.intitule', 'ASC')
            .getMany();
    }

    async findByFonction(fonctionId: string, etablissementId?: string): Promise<Poste[]> {
        return this.posteRepo.find({
            where: { fonctionId, uniteOrganisationnelle: { etablissementId } },
            relations: ['uniteOrganisationnelle', 'fonction', 'fonction.typePersonnel', 'categoriePoste', 'niveauResponsabilite'],
            order: { intitule: 'ASC' },
        });
    }

    async findById(id: string, etablissementId?: string): Promise<Poste> {
        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.uniteOrganisationnelle', 'uo')
            .leftJoinAndSelect('p.fonction', 'f')
            .leftJoinAndSelect('f.typePersonnel', 'ftp')
            .leftJoinAndSelect('p.categoriePoste', 'cp')
            .leftJoinAndSelect('p.niveauResponsabilite', 'nr')
            .where('p.id = :id', { id });
        if (etablissementId) {
            qb.andWhere('uo.etablissementId = :eid', { eid: etablissementId });
        }
        const poste = await qb.getOne();
        if (!poste) {
            throw new AppError('Poste non trouvé', 404, 'NOT_FOUND');
        }
        return poste;
    }

    async update(id: string, dto: UpdatePosteDto): Promise<Poste> {
        const poste = await this.findById(id);
        Object.assign(poste, dto);

        const updated = await this.posteRepo.save(poste);
        logger.info(`Poste modifié: ${updated.intitule}`, { posteId: id });
        return updated;
    }

    async delete(id: string): Promise<void> {
        const poste = await this.findById(id);
        await this.posteRepo.remove(poste);
        logger.info(`Poste supprimé: ${poste.intitule}`, { posteId: id });
    }

    /**
     * Occupants d'un poste — via les affectations actives (module personnel).
     */
    async findOccupants(id: string, etablissementId?: string): Promise<AffectationPoste[]> {
        await this.findById(id, etablissementId);
        return this.affectationRepo.find({
            where: { posteId: id },
            relations: ['membrePersonnel'],
            order: { dateDebut: 'DESC' },
        });
    }

    async getStatistiques(etablissementId?: string): Promise<any> {
        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoin('p.uniteOrganisationnelle', 'uo')
            .where('uo.etablissementId = :eid', { eid: etablissementId });

        const total = await qb.getCount();

        const vacants = await this.posteRepo.createQueryBuilder('p')
            .leftJoin('p.uniteOrganisationnelle', 'uo')
            .where('uo.etablissementId = :eid', { eid: etablissementId })
            .andWhere('p.actif = :actif', { actif: true })
            .andWhere('p."occupantsCount" < p."nombrePostes"')
            .andWhere('p.statut != :supprime', { supprime: StatutPoste.SUPPRIME })
            .getCount();

        const occupants = await this.posteRepo.createQueryBuilder('p')
            .leftJoin('p.uniteOrganisationnelle', 'uo')
            .where('uo.etablissementId = :eid', { eid: etablissementId })
            .andWhere('p."occupantsCount" > 0')
            .getCount();

        return { total, occupants, vacants };
    }
}

export const postesService = new PostesService();
