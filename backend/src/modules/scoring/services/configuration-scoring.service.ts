/**
 * ==================================
 * eLISAschool - Service Configuration Scoring
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ConfigurationScoring } from '../entities';
import { CreateConfigurationScoringDto, UpdateConfigurationScoringDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class ConfigurationScoringService {
    private repo: Repository<ConfigurationScoring>;

    constructor() {
        this.repo = AppDataSource.getRepository(ConfigurationScoring);
    }

    async create(dto: CreateConfigurationScoringDto): Promise<ConfigurationScoring> {
        // Vérifier l'unicité par établissement/année
        if (dto.etablissementId && dto.anneeScolaireId) {
            const existing = await this.repo.findOne({
                where: {
                    etablissementId: dto.etablissementId,
                    anneeScolaireId: dto.anneeScolaireId,
                },
            });

            if (existing) {
                throw new AppError(
                    'Une configuration de scoring existe déjà pour cet établissement et cette année',
                    409,
                    'CONFIG_SCORING_EXISTS'
                );
            }
        }

        const config = this.repo.create({
            ...dto,
            anneeScolaireId: dto.anneeScolaireId ?? undefined,
        } as any) as unknown as ConfigurationScoring;
        await this.repo.save(config);
        
        logger.info(`ConfigurationScoring créée: ${config.id}`);
        return config;
    }

    async findAll(etablissementId?: string): Promise<ConfigurationScoring[]> {
        const where: any = {};
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        return this.repo.find({
            where,
            relations: ['etablissement', 'anneeScolaire'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<ConfigurationScoring> {
        const config = await this.repo.findOne({
            where: { id },
            relations: ['etablissement', 'anneeScolaire'],
        });

        if (!config) {
            throw new AppError('Configuration de scoring non trouvée', 404, 'NOT_FOUND');
        }

        return config;
    }

    async update(id: string, dto: UpdateConfigurationScoringDto): Promise<ConfigurationScoring> {
        const config = await this.findOne(id);
        
        Object.assign(config, dto);
        await this.repo.save(config);
        
        logger.info(`ConfigurationScoring mise à jour: ${id}`);
        return config;
    }

    async delete(id: string): Promise<void> {
        const config = await this.findOne(id);
        await this.repo.remove(config);
        
        logger.info(`ConfigurationScoring supprimée: ${id}`);
    }

    async findByEtablissementEtAnnee(
        etablissementId: string,
        anneeScolaireId?: string
    ): Promise<ConfigurationScoring | null> {
        const where: any = { etablissementId };
        if (anneeScolaireId) {
            where.anneeScolaireId = anneeScolaireId;
        } else {
            where.anneeScolaireId = null;
        }

        return this.repo.findOne({ where, relations: ['etablissement', 'anneeScolaire'] });
    }

    /**
     * Obtient la configuration active pour un établissement
     * Priorité : configuration spécifique à l'année > configuration globale
     */
    async getActiveConfig(
        etablissementId: string,
        anneeScolaireId?: string
    ): Promise<ConfigurationScoring> {
        // Essayer d'abord avec l'année scolaire
        if (anneeScolaireId) {
            const configSpecifique = await this.findByEtablissementEtAnnee(etablissementId, anneeScolaireId);
            if (configSpecifique && configSpecifique.actif) {
                return configSpecifique;
            }
        }

        // Fallback : configuration globale sans année
        const configGlobale = await this.findByEtablissementEtAnnee(etablissementId);
        if (configGlobale && configGlobale.actif) {
            return configGlobale;
        }

        throw new AppError(
            'Aucune configuration de scoring active trouvée pour cet établissement',
            404,
            'NO_ACTIVE_SCORING_CONFIG'
        );
    }
}

export const configurationScoringService = new ConfigurationScoringService();
