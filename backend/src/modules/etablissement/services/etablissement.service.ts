/**
 * ==================================
 * eLISAschool - Service Etablissement (multi-établissements)
 * ==================================
 * Version: 2.0.0
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Etablissement, EtablissementConfig, StatutEtablissement } from '../entities';
import { CreateEtablissementDto, UpdateEtablissementDto, UpdateEtablissementConfigDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { StatutPersonnel } from '@modules/personnel/entities';

export interface EtablissementStats {
    totalEtablissements: number;
    etablissementsActifs: number;
    etablissementsInactifs: number;
    parSousSysteme: Record<string, number>;
    parType: Record<string, number>;
}

export interface EtablissementDetailStats {
    etablissementId: string;
    nomEtablissement: string;
    nombreClasses: number;
    nombreEleves: number;
    nombrePersonnel: number;
    nombreNiveaux: number;
    tauxOccupation: number; // effectifActuel / effectifMax * 100
    config: {
        cyclesActifs: number;
        modulesActifs: number;
        planAbonnement?: string;
    };
}

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
    async create(dto: CreateEtablissementDto, createurId?: string): Promise<Etablissement> {
        const requireValidation = await getParamBoolean('etablissement.require_validation', false);

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const etablissement = this.etablissementRepo.create({
                ...dto,
                actif: !requireValidation,
                statut: requireValidation ? StatutEtablissement.EN_ATTENTE_VALIDATION : StatutEtablissement.ACTIF,
            });
            await queryRunner.manager.save(etablissement);

            // Création automatique de la configuration par défaut
            const config = this.configRepo.create({
                etablissementId: etablissement.id,
            });
            await queryRunner.manager.save(config);

            await queryRunner.commitTransaction();

            // Créer le workflow de validation si requis
            if (requireValidation && createurId) {
                await validationWorkflowService.createWorkflow({
                    module: 'etablissement',
                    entiteId: etablissement.id,
                    entiteType: 'Etablissement',
                    niveauxRequis: 2,
                    etablissementId: etablissement.id,
                    commentaire: `Création établissement: ${dto.nom}`,
                }, createurId);
            }

            logger.info(`Établissement créé: ${dto.nom} (${etablissement.id})`);
            return etablissement;
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error(`Erreur création établissement: ${error.message || error}`);
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
    async desactiver(id: string, createurId?: string): Promise<Etablissement> {
        const etablissement = await this.findOne(id);
        const requireValidation = await getParamBoolean('etablissement.require_validation', false);

        if (requireValidation && createurId) {
            // Ne PAS désactiver, mettre en attente
            etablissement.statut = StatutEtablissement.EN_ATTENTE_DESACTIVATION;
            await this.etablissementRepo.save(etablissement);

            await validationWorkflowService.createWorkflow({
                module: 'etablissement',
                entiteId: id,
                entiteType: 'Etablissement',
                niveauxRequis: 2,
                etablissementId: id,
                commentaire: `Demande de désactivation: ${etablissement.nom}`,
            }, createurId);

            logger.info(`Désactivation en attente de validation: ${etablissement.nom} (${id})`);
            return etablissement;
        }

        // Désactivation logique au lieu de suppression physique
        etablissement.actif = false;
        etablissement.statut = StatutEtablissement.INACTIF;
        await this.etablissementRepo.save(etablissement);

        logger.info(`Établissement désactivé: ${etablissement.nom} (${id})`);
        return etablissement;
    }

    /**
     * Réactive un établissement
     */
    async activer(id: string, createurId?: string): Promise<Etablissement> {
        const etablissement = await this.findOne(id);
        const requireValidation = await getParamBoolean('etablissement.require_validation', false);

        if (requireValidation && createurId) {
            // Ne PAS activer, mettre en attente
            etablissement.statut = StatutEtablissement.EN_ATTENTE_VALIDATION;
            await this.etablissementRepo.save(etablissement);

            await validationWorkflowService.createWorkflow({
                module: 'etablissement',
                entiteId: id,
                entiteType: 'Etablissement',
                niveauxRequis: 2,
                etablissementId: id,
                commentaire: `Demande de réactivation: ${etablissement.nom}`,
            }, createurId);

            logger.info(`Réactivation en attente de validation: ${etablissement.nom} (${id})`);
            return etablissement;
        }

        etablissement.actif = true;
        etablissement.statut = StatutEtablissement.ACTIF;
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

    // ==================================
    // Statistiques
    // ==================================

    /**
     * Statistiques globales de tous les établissements
     */
    async getStats(): Promise<EtablissementStats> {
        const tous = await this.etablissementRepo.find();

        const stats: EtablissementStats = {
            totalEtablissements: tous.length,
            etablissementsActifs: tous.filter(e => e.actif).length,
            etablissementsInactifs: tous.filter(e => !e.actif).length,
            parSousSysteme: {},
            parType: {},
        };

        // Compter par sous-système
        tous.forEach(e => {
            stats.parSousSysteme[e.sousSysteme] = (stats.parSousSysteme[e.sousSysteme] || 0) + 1;
            stats.parType[e.type] = (stats.parType[e.type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Statistiques détaillées d'un établissement
     */
    async getEtablissementStats(etablissementId: string): Promise<EtablissementDetailStats> {
        const etablissement = await this.findOne(etablissementId);
        const config = await this.getConfig(etablissementId).catch(() => null);

        // Compter les classes
        const classesRepo = AppDataSource.getRepository('Classe');
        const nombreClasses = await classesRepo.count({
            where: { 
                anneeScolaire: { 
                    etablissementId 
                } 
            },
            relations: ['anneeScolaire'],
        });

        // Compter les élèves
        const affectationRepo = AppDataSource.getRepository('AffectationEleve');
        const nombreEleves = await affectationRepo.count({
            where: { 
                classe: {
                    anneeScolaire: {
                        etablissementId
                    }
                },
                actif: true
            },
            relations: ['classe', 'classe.anneeScolaire'],
        });

        // Compter le personnel
        const membreRepo = AppDataSource.getRepository('MembrePersonnel');
        const nombrePersonnel = await membreRepo.count({
            where: { 
                etablissementId, 
                statut: StatutPersonnel.ACTIF
            },
        });

        // Compter les niveaux (via les classes)
        const niveaux = new Set<string>();
        const classes = await classesRepo.find({
            where: { anneeScolaire: { etablissementId } },
            relations: ['niveau', 'anneeScolaire'],
            select: ['niveauId'],
        });
        classes.forEach(c => {
            if (c.niveauId) niveaux.add(c.niveauId);
        });

        // Taux d'occupation
        const tauxOccupation = etablissement.effectifMax
            ? Math.round((etablissement.effectifActuel / etablissement.effectifMax) * 100)
            : 0;

        return {
            etablissementId,
            nomEtablissement: etablissement.nom,
            nombreClasses,
            nombreEleves,
            nombrePersonnel,
            nombreNiveaux: niveaux.size,
            tauxOccupation,
            config: {
                cyclesActifs: config?.cyclesActifs?.length || 0,
                modulesActifs: config?.modulesActifs
                    ? Object.values(config.modulesActifs).filter(Boolean).length
                    : 0,
                planAbonnement: config?.planAbonnement,
            },
        };
    }
}

export const etablissementService = new EtablissementService();
