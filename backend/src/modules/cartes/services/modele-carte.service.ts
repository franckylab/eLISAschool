/**
 * ==================================
 * eLISAschool - Service ModeleCarte
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ModeleCarte } from '../entities/modele-carte.entity';
import { CreateModeleCarteDto, UpdateModeleCarteDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class ModeleCarteService {
    private repo: Repository<ModeleCarte>;

    constructor() {
        this.repo = AppDataSource.getRepository(ModeleCarte);
    }

    async create(dto: CreateModeleCarteDto, etablissementId: string): Promise<ModeleCarte> {
        // Si parDefaut = true, désactiver les autres modèles par défaut
        if (dto.parDefaut) {
            await this.repo.update(
                { etablissementId, type: dto.type, parDefaut: true },
                { parDefaut: false }
            );
        }

        const modele = this.repo.create({
            ...dto,
            etablissementId,
        });

        await this.repo.save(modele);
        logger.info(`[Cartes] Modèle créé: ${modele.nom} pour établissement ${etablissementId}`);
        return modele;
    }

    async findAll(etablissementId: string, type?: string): Promise<ModeleCarte[]> {
        const where: any = { etablissementId, actif: true };
        if (type) where.type = type;

        return this.repo.find({ where, order: { createdAt: 'DESC' } });
    }

    async findOne(id: string, etablissementId: string): Promise<ModeleCarte> {
        const modele = await this.repo.findOne({
            where: { id, etablissementId },
        });

        if (!modele) {
            throw new AppError('Modèle de carte non trouvé', 404, 'NOT_FOUND');
        }

        return modele;
    }

    async update(id: string, dto: UpdateModeleCarteDto, etablissementId: string): Promise<ModeleCarte> {
        const modele = await this.findOne(id, etablissementId);

        // Si parDefaut = true, désactiver les autres
        if (dto.parDefaut) {
            await this.repo.update(
                { etablissementId, type: modele.type, parDefaut: true },
                { parDefaut: false }
            );
        }

        Object.assign(modele, dto);
        await this.repo.save(modele);
        return modele;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const modele = await this.findOne(id, etablissementId);
        await this.repo.remove(modele);
        logger.info(`[Cartes] Modèle supprimé: ${modele.nom}`);
    }

    async getDefaultModele(type: string, etablissementId: string): Promise<ModeleCarte | null> {
        return this.repo.findOne({
            where: { etablissementId, type, parDefaut: true, actif: true },
        });
    }
}

export const modeleCarteService = new ModeleCarteService();
