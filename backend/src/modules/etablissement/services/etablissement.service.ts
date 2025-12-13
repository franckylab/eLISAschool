/**
 * ==================================
 * eLISAschool - Service Etablissement
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { EtablissementConfig } from '../entities';
import { UpdateEtablissementDto } from '../dto';
import { logger } from '@common/utils/logger.util';

export class EtablissementService {
    private repo: Repository<EtablissementConfig>;

    constructor() {
        this.repo = AppDataSource.getRepository(EtablissementConfig);
    }

    /**
     * Récupère la configuration unique de l'établissement
     * Crée une config par défaut si elle n'existe pas
     */
    async getConfig(): Promise<EtablissementConfig> {
        const config = await this.repo.findOne({ where: {} });
        if (config) return config;

        // Création configuration par défaut
        const defaultConfig = this.repo.create({
            nom: 'Mon Établissement',
            cyclesActifs: [],
        });
        return this.repo.save(defaultConfig);
    }

    /**
     * Met à jour la configuration
     */
    async updateConfig(dto: UpdateEtablissementDto): Promise<EtablissementConfig> {
        let config = await this.repo.findOne({ where: {} });

        if (!config) {
            config = this.repo.create({ nom: dto.nom || 'Mon Établissement' });
        }

        Object.assign(config, dto);

        // Si cyclesActifs est mis à jour, s'assurer que c'est bien valide (sécurité supplémentaire)
        if (dto.cyclesActifs) {
            config.cyclesActifs = dto.cyclesActifs;
        }

        await this.repo.save(config);
        logger.info('Configuration établissement mise à jour');
        return config;
    }
}

export const etablissementService = new EtablissementService();
