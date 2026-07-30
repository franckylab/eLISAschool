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
import { redimensionnerLogo } from '@common/utils/image-processor.util';
import { auditService, AuditAction } from '@modules/auth';

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

            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.ETABLISSEMENT_CREATE,
                cible: 'Etablissement',
                cibleId: etablissement.id,
                description: requireValidation
                    ? `Création établissement en attente de validation: ${dto.nom}`
                    : `Création établissement: ${dto.nom}`,
                nouvellesValeurs: dto as unknown as Record<string, unknown>,
                module: 'etablissement',
                metadata: { entiteLabel: etablissement.nom, entiteRef: etablissement.code },
            });

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
    async findOne(id: string, includeLogo: boolean = false): Promise<Etablissement & { logoUrl?: string }> {
        const etablissement = await this.etablissementRepo.findOne({
            where: { id },
            relations: ['configuration'],
        });
        if (!etablissement) {
            throw new AppError('Établissement non trouvé', 404, 'ETABLISSEMENT_NOT_FOUND');
        }
        
        // Si includeLogo est true, charger le logoBase64 séparément
        const result = etablissement as any;
        if (includeLogo) {
            const withLogo = await this.etablissementRepo.findOne({
                where: { id },
                select: ['id', 'logoBase64'],
            });
            if (withLogo?.logoBase64) {
                result.logoUrl = withLogo.logoBase64;
            }
        }
        
        return result;
    }

    /**
     * Met à jour un établissement
     */
    async update(id: string, dto: UpdateEtablissementDto, createurId?: string): Promise<Etablissement> {
        const etablissement = await this.findOne(id);
        const anciennesValeurs = {
            nom: etablissement.nom,
            code: etablissement.code,
            actif: etablissement.actif,
            statut: etablissement.statut,
        };
        Object.assign(etablissement, dto);
        await this.etablissementRepo.save(etablissement);

        await auditService.log({
            utilisateurId: createurId,
            action: AuditAction.ETABLISSEMENT_UPDATE,
            cible: 'Etablissement',
            cibleId: etablissement.id,
            description: `Mise à jour établissement: ${etablissement.nom}`,
            anciennesValeurs,
            nouvellesValeurs: dto as unknown as Record<string, unknown>,
            module: 'etablissement',
            metadata: { entiteLabel: etablissement.nom, entiteRef: etablissement.code },
        });

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

    // ==================================
    // Upload et traitement du logo (v3.0)
    // ==================================

    /**
     * Récupère le logo d'un établissement (avec base64)
     * 
     * @param etablissementId ID de l'établissement
     * @returns { base64, type, taille } ou null si pas de logo
     */
    async getLogo(etablissementId: string): Promise<{
        base64: string;
        type: string;
        taille: number;
    } | null> {
        // Overrider select: false avec select explicite
        const etablissement = await this.etablissementRepo.findOne({
            where: { id: etablissementId },
            select: ['logoBase64', 'logoType', 'logoTaille'],
        });

        if (!etablissement || !etablissement.logoBase64) {
            return null;
        }

        return {
            base64: etablissement.logoBase64,
            type: etablissement.logoType || '',
            taille: etablissement.logoTaille || 0,
        };
    }

    /**
     * Upload et traite le logo d'un établissement
     * 
     * @param etablissementId ID de l'établissement
     * @param logoBase64 Data URI base64 du logo
     * @returns Établissement mis à jour avec logo (sans le base64 pour performance)
     */
    async uploadLogo(etablissementId: string, logoBase64: string): Promise<Etablissement> {
        const etablissement = await this.findOne(etablissementId);

        try {
            // 1. Redimensionnement et validation via utilitaire sharp
            const imageTraitee = await redimensionnerLogo(logoBase64);

            // 2. Mettre à jour l'établissement avec le logo traité
            etablissement.logoBase64 = imageTraitee.base64;
            etablissement.logoType = imageTraitee.type;
            etablissement.logoTaille = imageTraitee.taille;

            await this.etablissementRepo.save(etablissement);

            logger.info(`Logo uploadé pour établissement: ${etablissement.nom} (${etablissementId})`);

            // 3. Retourner sans le base64 (select: false)
            return this.findOne(etablissementId);
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`Erreur upload logo: ${error.message || error}`);
            throw new AppError(
                'Erreur lors de l\'upload du logo',
                500,
                'UPLOAD_LOGO_ERREUR'
            );
        }
    }

    /**
     * Supprime le logo d'un établissement
     * 
     * @param etablissementId ID de l'établissement
     * @returns Établissement mis à jour sans logo
     */
    async supprimerLogo(etablissementId: string): Promise<Etablissement> {
        const etablissement = await this.findOne(etablissementId);

        if (!etablissement.logoBase64) {
            throw new AppError('Aucun logo à supprimer', 400, 'LOGO_ABSENT');
        }

        etablissement.logoBase64 = null;
        etablissement.logoType = null;
        etablissement.logoTaille = null;

        await this.etablissementRepo.save(etablissement);

        logger.info(`Logo supprimé pour établissement: ${etablissement.nom} (${etablissementId})`);
        return etablissement;
    }

    // ==================================
    // Paramètres régionaux avec fallback 4 niveaux (v3.0)
    // ==================================

    /**
     * Récupère les paramètres régionaux d'un établissement avec fallback en cascade
     * 
     * Priorité (décroissante) :
     * 1. Valeur sur l'établissement
     * 2. ParametreSysteme (scope etablissementId)
     * 3. ParametreSysteme (global)
     * 4. ConfigurationApp (défaut système)
     * 5. Valeur par défaut codée en dur
     */
    async getParametresRegionaux(etablissementId: string): Promise<{
        langueDefaut: string;
        devise: string;
        fuseauHoraire: string;
    }> {
        const { getParam } = await import('@modules/configuration/utils/config.helper');
        const { ConfigurationApp } = await import('@modules/configuration/entities/configuration-app.entity');

        // Récupérer l'établissement
        const etablissement = await this.etablissementRepo.findOne({
            where: { id: etablissementId },
            select: ['langueDefaut', 'devise', 'fuseauHoraire'],
        });

        // Fallback 4 niveaux pour chaque paramètre
        const langueDefaut = etablissement?.langueDefaut
            || await getParam('app.langue_defaut', { etablissementId, defaultValue: 'fr' })
            || 'fr';

        const devise = etablissement?.devise
            || await getParam('app.devise', { etablissementId, defaultValue: 'XAF' })
            || 'XAF';

        const fuseauHoraire = etablissement?.fuseauHoraire
            || await getParam('app.fuseau_horaire', { etablissementId, defaultValue: 'Africa/Douala' })
            || 'Africa/Douala';

        return { langueDefaut, devise, fuseauHoraire };
    }
}

export const etablissementService = new EtablissementService();
