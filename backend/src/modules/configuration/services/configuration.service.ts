/**
 * ==================================
 * eLISAschool - Service Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ConfigurationApp, ConfigurationModule } from '../entities';
import { UpdateConfigAppDto, UpdateConfigModuleDto, ActiverLicenceDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Service de gestion de la configuration
 */
export class ConfigurationService {
    private configAppRepository: Repository<ConfigurationApp>;
    private configModuleRepository: Repository<ConfigurationModule>;

    constructor() {
        this.configAppRepository = AppDataSource.getRepository(ConfigurationApp);
        this.configModuleRepository = AppDataSource.getRepository(ConfigurationModule);
    }

    /**
     * Récupérer la configuration globale de l'application
     */
    async getConfigApp(): Promise<ConfigurationApp> {
        let config = await this.configAppRepository.findOne({ where: {} });

        // Créer une configuration par défaut si elle n'existe pas
        if (!config) {
            config = this.configAppRepository.create({
                nomEtablissement: 'Mon Établissement',
                langueDefaut: 'fr',
                devise: 'XOF',
                fuseauHoraire: 'Africa/Douala',
                couleurPrimaire: '#28a745',
                couleurSecondaire: '#ffc107',
                couleurAccent: '#007bff',
                theme: 'default',
                modulesActifs: {},
                version: '1.0.0',
            });
            await this.configAppRepository.save(config);
        }

        return config;
    }

    /**
     * Mettre à jour la configuration globale
     */
    async updateConfigApp(updateDto: UpdateConfigAppDto): Promise<ConfigurationApp> {
        let config = await this.getConfigApp();

        Object.assign(config, updateDto);
        await this.configAppRepository.save(config);

        logger.info('Configuration application mise à jour');

        return config;
    }

    /**
     * Activer une licence
     */
    async activerLicence(dto: ActiverLicenceDto): Promise<{ success: boolean; message: string }> {
        const config = await this.getConfigApp();

        // TODO: Validation de la licence côté serveur
        // Pour l'instant, on accepte toute clé de plus de 10 caractères
        if (dto.licenceKey.length < 10) {
            throw new AppError('Clé de licence invalide', 400, 'INVALID_LICENSE');
        }

        config.licenceKey = dto.licenceKey;
        config.licenceActive = true;
        config.licenceExpiration = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // +1 an

        await this.configAppRepository.save(config);

        logger.info('Licence activée avec succès');

        return { success: true, message: 'Licence activée avec succès' };
    }

    /**
     * Récupérer la configuration d'un module
     */
    async getConfigModule(moduleNom: string, etablissementId?: string): Promise<ConfigurationModule> {
        let config = await this.configModuleRepository.findOne({
            where: { moduleNom, etablissementId: etablissementId || undefined },
        });

        if (!config) {
            // Créer une configuration par défaut pour le module
            config = this.configModuleRepository.create({
                moduleNom,
                etablissementId,
                champsPersonnalises: [],
                widgets: [],
                parametres: {},
                actif: true,
            });
            await this.configModuleRepository.save(config);
        }

        return config;
    }

    /**
     * Mettre à jour la configuration d'un module
     */
    async updateConfigModule(
        moduleNom: string,
        updateDto: UpdateConfigModuleDto,
        etablissementId?: string
    ): Promise<ConfigurationModule> {
        let config = await this.getConfigModule(moduleNom, etablissementId);

        if (updateDto.champsPersonnalises !== undefined) {
            config.champsPersonnalises = updateDto.champsPersonnalises;
        }

        if (updateDto.widgets !== undefined) {
            config.widgets = updateDto.widgets;
        }

        if (updateDto.parametres !== undefined) {
            config.parametres = { ...config.parametres, ...updateDto.parametres };
        }

        if (updateDto.actif !== undefined) {
            config.actif = updateDto.actif;
        }

        await this.configModuleRepository.save(config);

        logger.info(`Configuration du module ${moduleNom} mise à jour`);

        return config;
    }

    /**
     * Activer/désactiver un module
     */
    async toggleModule(moduleNom: string, actif: boolean): Promise<ConfigurationApp> {
        const config = await this.getConfigApp();

        config.modulesActifs[moduleNom] = actif;
        await this.configAppRepository.save(config);

        logger.info(`Module ${moduleNom} ${actif ? 'activé' : 'désactivé'}`);

        return config;
    }

    /**
     * Récupérer la liste de tous les modules configurés
     */
    async getAllModulesConfig(etablissementId?: string): Promise<ConfigurationModule[]> {
        return this.configModuleRepository.find({
            where: { etablissementId: etablissementId || undefined },
        });
    }
}

export const configurationService = new ConfigurationService();

export default ConfigurationService;
