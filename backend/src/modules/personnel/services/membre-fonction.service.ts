import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MembreFonction } from '../entities';
import { CreateMembreFonctionDto, UpdateMembreFonctionDto } from '../dto/membre-fonction.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class MembreFonctionService {
    private repo: Repository<MembreFonction>;

    constructor() {
        this.repo = AppDataSource.getRepository(MembreFonction);
    }

    async findByMembre(membrePersonnelId: string, etablissementId: string): Promise<MembreFonction[]> {
        return this.repo.find({
            where: { membrePersonnelId, etablissementId },
            relations: ['fonction'],
            order: { estPrincipale: 'DESC', dateDebut: 'DESC' },
        });
    }

    async create(dto: CreateMembreFonctionDto, etablissementId: string): Promise<MembreFonction> {
        if (dto.estPrincipale) {
            await this.repo.update(
                { membrePersonnelId: dto.membrePersonnelId, etablissementId },
                { estPrincipale: false }
            );
        }

        const mf = this.repo.create({
            ...dto,
            dateDebut: new Date(dto.dateDebut),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
            etablissementId,
        });
        await this.repo.save(mf);
        logger.info(`Fonction assignée au membre ${dto.membrePersonnelId}`);
        return this.repo.findOne({ where: { id: mf.id }, relations: ['fonction'] }) as Promise<MembreFonction>;
    }

    async update(id: string, dto: UpdateMembreFonctionDto, etablissementId: string): Promise<MembreFonction> {
        const mf = await this.repo.findOne({ where: { id, etablissementId } });
        if (!mf) throw new AppError('Assignation fonction non trouvée', 404, 'NOT_FOUND');

        if (dto.estPrincipale) {
            await this.repo.update(
                { membrePersonnelId: mf.membrePersonnelId, etablissementId },
                { estPrincipale: false }
            );
        }

        Object.assign(mf, {
            ...dto,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : mf.dateDebut,
            dateFin: dto.dateFin !== undefined ? (dto.dateFin ? new Date(dto.dateFin) : null) : mf.dateFin,
        });
        await this.repo.save(mf);
        return this.repo.findOne({ where: { id: mf.id }, relations: ['fonction'] }) as Promise<MembreFonction>;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const mf = await this.repo.findOne({ where: { id, etablissementId } });
        if (!mf) throw new AppError('Assignation fonction non trouvée', 404, 'NOT_FOUND');
        await this.repo.remove(mf);
        logger.info(`Fonction retirée du membre ${mf.membrePersonnelId}`);
    }
}

export const membreFonctionService = new MembreFonctionService();
