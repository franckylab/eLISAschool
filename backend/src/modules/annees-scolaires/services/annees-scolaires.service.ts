/**
 * ==================================
 * eLISAschool - Service Années Scolaires
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AnneeScolaire } from '../entities';
import { CreateAnneeScolaireDto, UpdateAnneeScolaireDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class AnneesScolairesService {
    private repo: Repository<AnneeScolaire>;

    constructor() {
        this.repo = AppDataSource.getRepository(AnneeScolaire);
    }

    async create(dto: CreateAnneeScolaireDto): Promise<AnneeScolaire> {
        // Si nouvelle année active, désactiver les autres
        if (dto.enCours) {
            await this.repo.update({ enCours: true }, { enCours: false });
        }

        const annee = this.repo.create({
            ...dto,
            dateDebut: new Date(dto.dateDebut),
            dateFin: new Date(dto.dateFin),
        });
        await this.repo.save(annee);
        logger.info(`Année scolaire créée: ${dto.libelle}`);
        return annee;
    }

    async findAll(): Promise<AnneeScolaire[]> {
        return this.repo.find({ order: { dateDebut: 'DESC' } });
    }

    async findActive(): Promise<AnneeScolaire | null> {
        return this.repo.findOne({ where: { enCours: true } });
    }

    async findOne(id: string): Promise<AnneeScolaire> {
        const annee = await this.repo.findOne({ where: { id } });
        if (!annee) throw new AppError('Année scolaire non trouvée', 404, 'NOT_FOUND');
        return annee;
    }

    async update(id: string, dto: UpdateAnneeScolaireDto): Promise<AnneeScolaire> {
        const annee = await this.findOne(id);

        // Si on active cette année
        if (dto.enCours && !annee.enCours) {
            await this.repo.update({ enCours: true }, { enCours: false });
        }

        if (dto.dateDebut) annee.dateDebut = new Date(dto.dateDebut);
        if (dto.dateFin) annee.dateFin = new Date(dto.dateFin);
        if (dto.libelle) annee.libelle = dto.libelle;
        if (dto.enCours !== undefined) annee.enCours = dto.enCours;
        if (dto.cloturee !== undefined) annee.cloturee = dto.cloturee;

        await this.repo.save(annee);
        return annee;
    }

    async delete(id: string): Promise<void> {
        const annee = await this.findOne(id);
        if (annee.enCours) {
            throw new AppError('Impossible de supprimer l\'année scolaire en cours', 400, 'CANNOT_DELETE_ACTIVE');
        }
        await this.repo.remove(annee);
        logger.info(`Année scolaire supprimée: ${id}`);
    }
}

export const anneesScolairesService = new AnneesScolairesService();
