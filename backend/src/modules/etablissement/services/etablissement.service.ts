/**
 * ==================================
 * eLISAschool - Service Etablissement (multi-établissements)
 * ==================================
 * Version: 2.0.0
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Etablissement, EtablissementConfig } from '../entities';
import { CreateEtablissementDto, UpdateEtablissementDto, UpdateEtablissementConfigDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class EtablissementService {
    private etablissementRepo: Repository<Etablissement>;
    private configRepo: Repository<EtablissementConfig>;

    constructor() {
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
        this.configRepo = AppDataSource.getRepository(EtablissementConfig);
    }

    // ==================================
    // CRUD Établissements
    // ==================================

    /**
     * Crée un nouvel établissement avec sa configuration par défaut
     */
    async create(dto: CreateEtablissementDto): Promise<Etablissement> {
        const etablissement = this.etablissementRepo.create(dto);
        await this.etablissementRepo.save(etablissement);

        // Création automatique de la configuration par défaut
        const config = this.configRepo.create({
            etablissementId: etablissement.id,
            cyclesActifs: [],
        });
        await this.configRepo.save(config);

        logger.info(`Établissement créé: ${dto.nom} (${etablissement.id})`);
        return etablissement;
    }

    /**
     * Retourne tous les établissements (actifs ou non)
     */
    async findAll(actifOnly: boolean = false): Promise<Etablissement[]> {
        const where: any = {};
        if (actifOnly) where.actif = true;

        return this.etablissementRepo.find({
            where,
            relations: ['configuration'],
            order: { nom: 'ASC' },
        });
    }

    /**
     * Retourne un établissement par son ID
     */
    async findOne(id: string): Promise<Etablissement> {
        const etablissement = await this.etablissementRepo.findOne({
            where: { id },
            relations: ['configuration'],
        });
        if (!etablissement) {
            throw new AppError('Établissement non trouvé', 404, 'ETABLISSEMENT_NOT_FOUND');
        }
        return etablissement;
    }

    /**
     * Met à jour un établissement
     */
    async update(id: string, dto: UpdateEtablissementDto): Promise<Etablissement> {
        const etablissement = await this.findOne(id);
        Object.assign(etablissement, dto);
        await this.etablissementRepo.save(etablissement);
        logger.info(`Établissement mis à jour: ${etablissement.nom} (${id})`);
        return etablissement;
    }

    /**
     * Supprime un établissement (désactivation logique recommandée)
     */
    async delete(id: string): Promise<void> {
        const etablissement = await this.findOne(id);

        // Vérifier s'il y a des données liées avant suppression
        // En production, préférer la désactivation (actif = false)
        await this.configRepo.delete({ etablissementId: id });
        await this.etablissementRepo.remove(etablissement);

        logger.info(`Établissement supprimé: ${id}`);
    }

    // ==================================
    // Configuration par établissement
    // ==================================

    /**
     * Récupère la configuration d'un établissement spécifique
     */
    async getConfig(etablissementId: string): Promise<EtablissementConfig> {
        const config = await this.configRepo.findOne({
            where: { etablissementId },
            relations: ['etablissement'],
        });

        if (!config) {
            throw new AppError('Configuration non trouvée pour cet établissement', 404, 'CONFIG_NOT_FOUND');
        }

        return config;
    }

    /**
     * Met à jour la configuration d'un établissement
     */
    async updateConfig(etablissementId: string, dto: UpdateEtablissementConfigDto): Promise<EtablissementConfig> {
        let config = await this.configRepo.findOne({ where: { etablissementId } });

        if (!config) {
            // Création automatique si elle n'existe pas
            config = this.configRepo.create({ etablissementId, cyclesActifs: [] });
        }

        Object.assign(config, dto);

        if (dto.cyclesActifs) {
            config.cyclesActifs = dto.cyclesActifs;
        }

        await this.configRepo.save(config);
        logger.info(`Configuration mise à jour pour établissement ${etablissementId}`);
        return config;
    }
}

export const etablissementService = new EtablissementService();
