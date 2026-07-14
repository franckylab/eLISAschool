import { Repository, Not } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Poste, StatutPoste } from '@modules/organisation/entities';
import { AffectationPoste, StatutAffectation, TypePersonnel } from '@modules/personnel/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
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

        if (!dto.modeRemunerationDefaut && dto.typePersonnelId) {
            const tp = await AppDataSource.getRepository(TypePersonnel).findOne({ where: { id: dto.typePersonnelId } });
            if (tp?.modeRemunerationDefaut) {
                dto.modeRemunerationDefaut = tp.modeRemunerationDefaut;
            }
        }

        const poste = this.posteRepo.create({
            intitulé: dto.intitulé,
            description: dto.description,
            code: dto.code,
            typePersonnelId: dto.typePersonnelId,
            niveauResponsabilite: dto.niveauResponsabilite as any,
            fonctionId: dto.fonctionId,
            uniteOrganisationnelleId: dto.uniteOrganisationnelleId,
            occupantId: dto.occupantId,
            occupantNom: dto.occupantNom,
            nombrePostes: dto.nombrePostes,
            modeRemunerationDefaut: dto.modeRemunerationDefaut,
            competencesRequises: dto.competencesRequises,
            missions: dto.missions,
            metadata: dto.metadata,
            statut: dto.occupantId ? StatutPoste.ACTIF : StatutPoste.VACANT,
            actif: true,
        });

        const saved = await this.posteRepo.save(poste);
        logger.info(`Poste créé: ${saved.intitulé}`, { posteId: saved.id });
        return saved;
    }

    async findAll(query: QueryPostesDto, etablissementId?: string): Promise<{ data: Poste[]; total: number; page: number; limit: number }> {
        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.uniteOrganisationnelle', 'uo')
            .leftJoinAndSelect('p.fonction', 'f')
            .leftJoinAndSelect('p.typePersonnel', 'tp');

        if (etablissementId) {
            qb.leftJoin('uo.organisation', 'org')
                .andWhere('org.etablissementId = :etablissementId', { etablissementId });
        }
        if (query.search) {
            qb.andWhere('(p.intitulé ILIKE :search OR p.code ILIKE :search)', { search: `%${query.search}%` });
        }
        if (query.typePersonnelId) {
            qb.andWhere('p.typePersonnelId = :typePersonnelId', { typePersonnelId: query.typePersonnelId });
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
        }

        const total = await qb.getCount();
        const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany();

        return { data, total, page: query.page, limit: query.limit };
    }

    async findAllSimple(etablissementId?: string): Promise<Poste[]> {
        const where: any = { actif: true };
        if (etablissementId) {
            where.uniteOrganisationnelle = { organisation: { etablissementId } };
        }
        return this.posteRepo.find({ where, relations: ['uniteOrganisationnelle', 'fonction'], order: { intitulé: 'ASC' } });
    }

    async findVacants(etablissementId?: string): Promise<Poste[]> {
        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.uniteOrganisationnelle', 'uo')
            .where('p.actif = :actif', { actif: true })
            .andWhere('p.statut != :supprime', { supprime: StatutPoste.SUPPRIME })
            .andWhere('p."occupantsCount" < p."nombrePostes"');
        if (etablissementId) {
            qb.leftJoin('uo.organisation', 'org')
                .andWhere('org.etablissementId = :eid', { eid: etablissementId });
        }
        return qb.orderBy('p.intitulé', 'ASC').getMany();
    }

    async findByFonction(fonctionId: string, etablissementId?: string): Promise<Poste[]> {
        const where: any = { fonctionId };
        if (etablissementId) {
            where.uniteOrganisationnelle = { organisation: { etablissementId } };
        }
        return this.posteRepo.find({ where, relations: ['uniteOrganisationnelle', 'fonction'], order: { intitulé: 'ASC' } });
    }

    async findById(id: string, etablissementId?: string): Promise<Poste> {
        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.uniteOrganisationnelle', 'uo')
            .leftJoinAndSelect('p.fonction', 'f')
            .leftJoinAndSelect('p.typePersonnel', 'tp')
            .where('p.id = :id', { id });
        if (etablissementId) {
            qb.leftJoin('uo.organisation', 'org')
                .andWhere('org.etablissementId = :eid', { eid: etablissementId });
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

        if (dto.occupantId !== undefined) {
            poste.occupantId = dto.occupantId;
            poste.statut = dto.occupantId ? StatutPoste.ACTIF : StatutPoste.VACANT;
        }

        const updated = await this.posteRepo.save(poste);
        logger.info(`Poste modifié: ${updated.intitulé}`, { posteId: id });
        return updated;
    }

    async delete(id: string): Promise<void> {
        const poste = await this.findById(id);
        await this.posteRepo.remove(poste);
        logger.info(`Poste supprimé: ${poste.intitulé}`, { posteId: id });
    }

    async getStatistiques(etablissementId?: string): Promise<any> {
        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoin('p.uniteOrganisationnelle', 'uo');
        if (etablissementId) {
            qb.leftJoin('uo.organisation', 'org')
                .andWhere('org.etablissementId = :eid', { eid: etablissementId });
        }
        const total = await qb.getCount();

        const actifsQb = this.posteRepo.createQueryBuilder('p')
            .leftJoin('p.uniteOrganisationnelle', 'uo');
        if (etablissementId) {
            actifsQb.leftJoin('uo.organisation', 'org')
                .andWhere('org.etablissementId = :eid', { eid: etablissementId });
        }
        actifsQb.andWhere('p."occupantsCount" > 0');
        const actifs = await actifsQb.getCount();

        const vacants = await this.posteRepo.createQueryBuilder('p')
            .leftJoin('p.uniteOrganisationnelle', 'uo')
            .where('p.actif = :actif', { actif: true })
            .andWhere('p."occupantsCount" < p."nombrePostes"')
            .andWhere('p.statut != :supprime', { supprime: StatutPoste.SUPPRIME })
            .leftJoin('uo.organisation', 'org')
            .andWhere('org.etablissementId = :eid', { eid: etablissementId })
            .getCount();

        return { total, actifs, vacants };
    }
}

export const postesService = new PostesService();
