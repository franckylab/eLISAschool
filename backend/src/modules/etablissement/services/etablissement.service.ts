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
import { getParamNumber, getParamBoolean, getParam } from '@modules/configuration/helpers/config-helpers';

export class EtablissementService {
    private etablissementRepo: Repository<Etablissement>;
    private configRepo: Repository<EtablissementConfig>;

    constructor() {
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
        this.configRepo = AppDataSource.getRepository(EtablissementConfig);
    }

    private async getEtablissementParams() {
        return {
            defaultLanguage: await getParam<string>('etablissement.default_language', 'fr'),
            maxUsersPerRole: await getParamNumber('etablissement.max_users_per_role', 50),
            requireApprovalForNewUsers: await getParamBoolean('etablissement.require_approval_new_users', false),
            defaultTimeZone: await getParam<string>('etablissement.default_timezone', 'Africa/Lagos'),
            enableMultiLanguage: await getParamBoolean('etablissement.enable_multi_language', false),
        };
    }

    // ==================================
    // CRUD Établissements
    // ==================================

    /**
     * Crée un nouvel établissement avec sa configuration par défaut
     */
    async create(dto: CreateEtablissementDto): Promise<Etablissement> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const params = await this.getEtablissementParams();

            // Validation de la langue par défaut
            if (dto.langueDefaut && !['fr', 'en', 'pt'].includes(dto.langueDefaut)) {
                throw new AppError(
                    'Langue non supportée. Utilisez: fr, en, pt',
                    400,
                    'INVALID_LANGUAGE'
                );
            }

            const etablissement = this.etablissementRepo.create({
                ...dto,
                langueDefaut: dto.langueDefaut || params.defaultLanguage,
                fuseauHoraire: dto.fuseauHoraire || params.defaultTimeZone,
            });
            await queryRunner.manager.save(etablissement);

            // Création automatique de la configuration par défaut
            const config = this.configRepo.create({
                etablissementId: etablissement.id,
                cyclesActifs: dto.cyclesActifs || [],
                configurationBulletin: dto.configurationBulletin,
            });
            await queryRunner.manager.save(config);

            await queryRunner.commitTransaction();
            logger.info(`Établissement créé: ${dto.nom} (${etablissement.id})`);
            return etablissement;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error(`Erreur création établissement: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
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
     * Désactive un établissement (suppression logique)
     * Empêche la suppression physique pour préserver l'intégrité des données
     */
    async desactiver(id: string): Promise<Etablissement> {
        const etablissement = await this.findOne(id);

        // Désactivation logique au lieu de suppression physique
        etablissement.actif = false;
        await this.etablissementRepo.save(etablissement);

        logger.info(`Établissement désactivé: ${etablissement.nom} (${id})`);
        return etablissement;
    }

    /**
     * Réactive un établissement
     */
    async activer(id: string): Promise<Etablissement> {
        const etablissement = await this.findOne(id);

        etablissement.actif = true;
        await this.etablissementRepo.save(etablissement);

        logger.info(`Établissement réactivé: ${etablissement.nom} (${id})`);
        return etablissement;
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
