/**
 * ==================================
 * eLISAschool - Service Élèves
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Eleve } from '../entities';
import { CreateEleveDto, UpdateEleveDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class ElevesService {
    private repo: Repository<Eleve>;

    constructor() {
        this.repo = AppDataSource.getRepository(Eleve);
    }

    async create(dto: CreateEleveDto): Promise<Eleve> {
        const existing = await this.repo.findOne({ where: { matricule: dto.matricule } });
        if (existing) throw new AppError('Matricule élève déjà existant', 409, 'MATRICULE_EXISTS');

        const userUsed = await this.repo.findOne({ where: { utilisateurId: dto.utilisateurId } });
        if (userUsed) throw new AppError('Cet utilisateur est déjà lié à un dossier élève', 409, 'USER_ALREADY_LINKED');

        const eleve = this.repo.create({
            ...dto,
            dateNaissance: new Date(dto.dateNaissance),
            dateInscription: dto.dateInscription ? new Date(dto.dateInscription) : new Date(),
        });

        await this.repo.save(eleve);
        logger.info(`Dossier élève créé: ${dto.matricule}`);
        return eleve;
    }

    async findAll(sousSysteme?: string): Promise<Eleve[]> {
        const where: any = {};
        if (sousSysteme) where.sousSysteme = sousSysteme;

        return this.repo.find({
            where,
            relations: ['utilisateur'],
            order: { nomTuteur: 'ASC' }
        });
    }

    async findOne(id: string): Promise<Eleve> {
        const eleve = await this.repo.findOne({ where: { id }, relations: ['utilisateur'] });
        if (!eleve) throw new AppError('Élève non trouvé', 404, 'NOT_FOUND');
        return eleve;
    }

    async findByUserId(userId: string): Promise<Eleve | null> {
        return this.repo.findOne({ where: { utilisateurId: userId } });
    }

    async update(id: string, dto: UpdateEleveDto): Promise<Eleve> {
        const eleve = await this.findOne(id);

        if (dto.dateNaissance) dto.dateNaissance = new Date(dto.dateNaissance) as any;
        if (dto.dateInscription) dto.dateInscription = new Date(dto.dateInscription) as any;

        Object.assign(eleve, dto);
        await this.repo.save(eleve);
        return eleve;
    }

    async delete(id: string): Promise<void> {
        const eleve = await this.findOne(id);
        await this.repo.remove(eleve);
        logger.info(`Dossier élève supprimé: ${id}`);
    }
}

export const elevesService = new ElevesService();
