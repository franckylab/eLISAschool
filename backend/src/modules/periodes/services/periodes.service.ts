/**
 * ==================================
 * eLISAschool - Service Périodes
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Periode, TypePeriode } from '../entities';
import { CreatePeriodeDto, UpdatePeriodeDto, CreateTypePeriodeDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class PeriodesService {
    private periodeRepo: Repository<Periode>;
    private typeRepo: Repository<TypePeriode>;

    constructor() {
        this.periodeRepo = AppDataSource.getRepository(Periode);
        this.typeRepo = AppDataSource.getRepository(TypePeriode);
    }

    // ==== TYPES ====

    async createType(dto: CreateTypePeriodeDto): Promise<TypePeriode> {
        const existing = await this.typeRepo.findOne({ where: { code: dto.code } });
        if (existing) throw new AppError('Code type période existe déjà', 409, 'TYPE_EXISTS');
        const type = this.typeRepo.create(dto);
        await this.typeRepo.save(type);
        return type;
    }

    async getTypes(): Promise<TypePeriode[]> {
        return this.typeRepo.find({ order: { nom: 'ASC' } });
    }

    // ==== PERIODES ====

    async create(dto: CreatePeriodeDto): Promise<Periode> {
        const periode = this.periodeRepo.create({
            ...dto,
            dateDebut: new Date(dto.dateDebut),
            dateFin: new Date(dto.dateFin),
        });
        await this.periodeRepo.save(periode);
        return periode;
    }

    async findAll(anneeId: string): Promise<Periode[]> {
        return this.periodeRepo.find({
            where: { anneeScolaireId: anneeId },
            relations: ['type'],
            order: { dateDebut: 'ASC', ordre: 'ASC' }
        });
    }

    async findOne(id: string): Promise<Periode> {
        const periode = await this.periodeRepo.findOne({ where: { id }, relations: ['type'] });
        if (!periode) throw new AppError('Période non trouvée', 404, 'NOT_FOUND');
        return periode;
    }

    async update(id: string, dto: UpdatePeriodeDto): Promise<Periode> {
        const periode = await this.findOne(id);

        if (dto.dateDebut) dto.dateDebut = new Date(dto.dateDebut) as any;
        if (dto.dateFin) dto.dateFin = new Date(dto.dateFin) as any;

        Object.assign(periode, dto);
        await this.periodeRepo.save(periode);
        return periode;
    }

    async delete(id: string): Promise<void> {
        const periode = await this.findOne(id);
        if (periode.cloturee) throw new AppError('Impossible de supprimer une période clôturée', 400, 'CANNOT_DELETE_CLOSED');
        await this.periodeRepo.remove(periode);
        logger.info(`Période supprimée: ${id}`);
    }
}

export const periodesService = new PeriodesService();
