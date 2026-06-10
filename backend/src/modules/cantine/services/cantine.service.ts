/**
 * ==================================
 * eLISAschool - Service Cantine v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MenuCantine, InscriptionCantine, ConsommationCantine, StatutRepas, StatutInscriptionCantine } from '../entities';
import { CreateMenuDto, CreateInscriptionDto, EnregistrerConsommationDto, RechargerSoldeDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { parentsService } from '@modules/responsables-eleves/services';
import { getParamNumber, getParamBoolean, getParam } from '@modules/configuration/utils/config.helper';
import { notificationTemplates } from '@modules/notifications/services';
import { Eleve } from '@modules/eleves/entities';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { auditService, AuditAction } from '@modules/auth';

/**
 * Service Cantine avec configuration centralisée et cache
 */
export class CantineService {
    private menuRepo: Repository<MenuCantine>;
    private inscriptionRepo: Repository<InscriptionCantine>;
    private consommationRepo: Repository<ConsommationCantine>;

    // Cache pour les paramètres (TTL 5 min)
    private paramsCache: Map<string, { value: any; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.menuRepo = AppDataSource.getRepository(MenuCantine);
        this.inscriptionRepo = AppDataSource.getRepository(InscriptionCantine);
        this.consommationRepo = AppDataSource.getRepository(ConsommationCantine);
    }

    /**
     * Récupère les paramètres cantine depuis la configuration (avec cache)
     */
    private async getCantineParams() {
        const cacheKey = 'cantine:params';
        const cached = this.paramsCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.value;
        }

        const params = {
            menuPlanningDays: await getParamNumber('cantine.menu_planning_days', 7),
            allowPreorder: await getParamBoolean('cantine.allow_preorder', true),
            maxDebt: await getParamNumber('cantine.max_debt', 10000),
            currency: await getParam<string>('regional.currency', 'XOF'),
        };

        this.paramsCache.set(cacheKey, { value: params, timestamp: Date.now() });
        return params;
    }

    /**
     * Invalider le cache des paramètres
     */
    private invalidateParamsCache(): void {
        this.paramsCache.delete('cantine:params');
    }

    // ============ MENUS ============

    async createMenu(dto: CreateMenuDto, createurId?: string, etablissementId?: string): Promise<MenuCantine> {
        const menu = this.menuRepo.create({
            ...dto,
            etablissementId,
            date: dto.date ? new Date(dto.date) : new Date(),
        });
        await this.menuRepo.save(menu);
        logger.info(`[${etablissementId}] Menu créé pour le ${dto.date}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: createurId || 'system',
                action: AuditAction.MENU_CREATE,
                cible: 'MenuCantine',
                cibleId: menu.id,
                description: `Menu créé pour le ${dto.date}`,
                module: 'cantine',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Cantine] Erreur audit createMenu', error);
        }

        return menu;
    }

    async getMenus(dateDebut?: string, dateFin?: string, etablissementId?: string, page: number = 1, limit: number = 20): Promise<{ data: MenuCantine[]; total: number; page: number; limit: number }> {
        const qb = this.menuRepo.createQueryBuilder('m').where('m.actif = true');
        if (etablissementId) qb.andWhere('m.etablissementId = :etablissementId', { etablissementId });
        if (dateDebut) qb.andWhere('m.date >= :dateDebut', { dateDebut });
        if (dateFin) qb.andWhere('m.date <= :dateFin', { dateFin });
        
        const total = await qb.getCount();
        const data = await qb
            .orderBy('m.date', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        
        return { data, total, page, limit };
    }

    /**
     * Récupère les menus de la semaine (selon config)
     */
    async getMenusSemaine(etablissementId?: string): Promise<MenuCantine[]> {
        const params = await this.getCantineParams();
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + params.menuPlanningDays);

        const qb = this.menuRepo.createQueryBuilder('m')
            .where('m.actif = true');
        if (etablissementId) qb.andWhere('m.etablissementId = :etablissementId', { etablissementId });
        return qb
            .andWhere('m.date >= :today', { today: today.toISOString().split('T')[0] })
            .andWhere('m.date <= :endDate', { endDate: endDate.toISOString().split('T')[0] })
            .orderBy('m.date', 'ASC')
            .getMany();
    }

    async getMenuDuJour(etablissementId?: string): Promise<MenuCantine | null> {
        const today = new Date().toISOString().split('T')[0];
        const where: any = { date: new Date(today), actif: true };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.menuRepo.findOne({ where });
    }

    // ============ INSCRIPTIONS ============

    async createInscription(dto: CreateInscriptionDto, createurId: string, etablissementId?: string): Promise<InscriptionCantine> {
        // Vérifier si l'élève est déjà inscrit (actif ou en attente de validation)
        const where: any = { 
            eleveId: dto.eleveId, 
            statut: In([StatutInscriptionCantine.ACTIVE, StatutInscriptionCantine.EN_ATTENTE_VALIDATION]) 
        };
        if (etablissementId) where.etablissementId = etablissementId;
        const existant = await this.inscriptionRepo.findOne({ where });
        if (existant) {
            throw new AppError('Élève déjà inscrit à la cantine', 409, 'ALREADY_ENROLLED');
        }

        // Vérifier si la validation est requise
        const requireValidation = await getParamBoolean('cantine.require_validation', false);

        const inscription: InscriptionCantine = this.inscriptionRepo.create({
            ...dto,
            etablissementId,
            statut: requireValidation 
                ? StatutInscriptionCantine.EN_ATTENTE_VALIDATION 
                : StatutInscriptionCantine.ACTIVE,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
            solde: 0,
        });

        // Transaction pour inscription + workflow
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await queryRunner.manager.save(inscription);

            // Créer un workflow de validation si requis
            if (requireValidation) {
                await validationWorkflowService.createWorkflow({
                    module: 'cantine',
                    entiteId: inscription.id,
                    entiteType: 'InscriptionCantine',
                    niveauxRequis: 2,
                    etablissementId,
                }, createurId);

                logger.info(`[${etablissementId}] Inscription cantine créée en attente de validation pour élève ${dto.eleveId}`);
            } else {
                logger.info(`[${etablissementId}] Inscription cantine créée pour élève ${dto.eleveId}`);
            }

            // Audit trail
            await queryRunner.manager.query(`
                INSERT INTO audit_logs (id, "utilisateurId", action, cible, "cibleId", description, module, "etablissementId", "createdAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [
                require('crypto').randomUUID(),
                createurId,
                'INSCRIPTION_CANTINE_CREATE',
                'InscriptionCantine',
                inscription.id,
                `Inscription cantine créée pour élève ${dto.eleveId}`,
                'cantine',
                etablissementId,
            ]);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        return inscription;
    }

    async getInscription(id: string, etablissementId?: string): Promise<InscriptionCantine> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const inscription = await this.inscriptionRepo.findOne({
            where,
            relations: ['eleve'],
        });
        if (!inscription) throw new AppError('Inscription non trouvée', 404, 'NOT_FOUND');
        return inscription;
    }

    async getInscriptionByEleve(eleveId: string, etablissementId?: string): Promise<InscriptionCantine | null> {
        const where: any = { eleveId, statut: StatutInscriptionCantine.ACTIVE };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.inscriptionRepo.findOne({ where });
    }

    /**
     * Recharger le solde (avec devise depuis config)
     */
    async rechargerSolde(inscriptionId: string, dto: RechargerSoldeDto, createurId?: string, etablissementId?: string): Promise<InscriptionCantine> {
        const params = await this.getCantineParams();
        const inscription = await this.getInscription(inscriptionId, etablissementId);

        const ancienSolde = inscription.solde;
        inscription.solde += dto.montant;
        await this.inscriptionRepo.save(inscription);

        logger.info(`[${etablissementId}] Solde rechargé: +${dto.montant} ${params.currency} pour inscription ${inscriptionId}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: createurId || 'system',
                action: AuditAction.SOLDE_RECHARGE,
                cible: 'InscriptionCantine',
                cibleId: inscription.id,
                description: `Solde rechargé de ${dto.montant} ${params.currency}`,
                module: 'cantine',
                etablissementId,
                nouvellesValeurs: { ancienSolde, nouveauSolde: inscription.solde, montant: dto.montant },
            });
        } catch (error) {
            logger.warn('[Cantine] Erreur audit rechargerSolde', error);
        }
        
        // NOTIFICATION : Confirmer le rechargement aux parents
        try {
            await this.notifierRechargement(inscription, dto.montant, params.currency, etablissementId);
        } catch (error) {
            logger.warn('[Cantine] Échec notification rechargement (non bloquant)', error);
        }
        
        return inscription;
    }

    /**
     * Vérifier si le solde dépasse la dette maximale autorisée
     */
    async verifierLimiteDettes(inscriptionId: string, montant: number, etablissementId?: string): Promise<boolean> {
        const params = await this.getCantineParams();
        const inscription = await this.getInscription(inscriptionId, etablissementId);
        
        const nouveauSolde = inscription.solde - montant;
        const detteMax = params.maxDebt;
        
        // Si le solde devient négatif, vérifier qu'il ne dépasse pas la dette max
        if (nouveauSolde < 0 && Math.abs(nouveauSolde) > detteMax) {
            return false;
        }
        return true;
    }

    // ============ CONSOMMATIONS ============

    async enregistrerConsommation(dto: EnregistrerConsommationDto, createurId?: string, etablissementId?: string): Promise<ConsommationCantine> {
        const params = await this.getCantineParams();
        const inscription = await this.getInscriptionByEleve(dto.eleveId || dto.inscriptionId, etablissementId);
        if (!inscription) {
            throw new AppError('Élève non inscrit à la cantine', 400, 'NOT_ENROLLED');
        }

        // Vérifier le solde
        if (inscription.solde < (dto.montant || 0)) {
            // Vérifier si la dette maximale est respectée
            const nouveauSolde = inscription.solde - (dto.montant || 0);
            if (Math.abs(nouveauSolde) > params.maxDebt) {
                throw new AppError(
                    `Dette maximale atteinte (${params.maxDebt} ${params.currency}). Veuillez recharger votre solde.`,
                    400,
                    'MAX_DEBT_REACHED'
                );
            }
        }

        // Débiter le solde
        inscription.solde -= (dto.montant || 0);
        await this.inscriptionRepo.save(inscription);

        const consommation: ConsommationCantine = this.consommationRepo.create({
            ...dto,
            etablissementId,
            inscriptionId: inscription.id,
            date: dto.date ? new Date(dto.date) : new Date(),
            statut: StatutRepas.CONSOMME,
        });
        await this.consommationRepo.save(consommation);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: createurId || 'system',
                action: AuditAction.CONSOMMATION_ENREGISTRER,
                cible: 'ConsommationCantine',
                cibleId: consommation.id,
                description: `Consommation enregistrée pour élève ${dto.eleveId}`,
                module: 'cantine',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Cantine] Erreur audit enregistrerConsommation', error);
        }

        logger.info(`[${etablissementId}] Consommation enregistrée pour élève ${dto.eleveId}`);
        return consommation;
    }

    async getConsommationsEleve(eleveId: string, etablissementId?: string, mois?: string): Promise<ConsommationCantine[]> {
        const qb = this.consommationRepo.createQueryBuilder('c')
            .innerJoin('c.inscription', 'i')
            .where('i.eleveId = :eleveId', { eleveId });
        if (etablissementId) qb.andWhere('c.etablissementId = :etablissementId', { etablissementId });
        if (mois) {
            qb.andWhere('TO_CHAR(c.date, \'YYYY-MM\') = :mois', { mois });
        }
        return qb.orderBy('c.date', 'DESC').getMany();
    }

    /**
     * Notifier les parents du rechargement de solde
     */
    private async notifierRechargement(
        inscription: InscriptionCantine,
        montant: number,
        devise: string,
        etablissementId?: string
    ): Promise<void> {
        try {
            const eleveRepo = AppDataSource.getRepository(Eleve);
            const eleve = await eleveRepo.findOne({
                where: { id: inscription.eleveId },
                relations: ['utilisateur'],
            });

            if (!eleve?.utilisateurId) return;

            // Trouver les responsables
            const responsables = await parentsService.getResponsablesForNotification(eleve.utilisateurId);

            if (!responsables || responsables.length === 0) return;

            for (const resp of responsables) {
                // Utiliser le template message administration pour confirmation
                await notificationTemplates.messageAdministration({
                    destinataireId: resp.utilisateurId,
                    etablissementId,
                    metadata: {
                        email: resp.email,
                        type: 'cantine_rechargement',
                        inscriptionId: inscription.id,
                    },
                }, {
                    titre: `💰 Rechargement cantine - Élève ${eleve.id.substring(0, 8)}`,
                    message: `Le solde cantine de l'élève ${eleve.id.substring(0, 8)} a été rechargé de ${montant} ${devise}.\n\nNouveau solde: ${inscription.solde} ${devise}`,
                    expediteur: 'Service Cantine',
                });
            }

            logger.info(`[Cantine] Notification rechargement envoyée pour élève ${eleve.id.substring(0, 8)}`);
        } catch (error) {
            logger.warn('[Cantine] Erreur notification rechargement', error);
        }
    }

    /**
     * Envoyer des rappels de paiement pour les soldes faibles
     * À appeler via un cron job quotidien
     */
    async envoyerRappelsPaiement(etablissementId?: string): Promise<number> {
        const params = await this.getCantineParams();
        const seuilAlerte = params.maxDebt * 0.8; // 80% de la dette max

        // Trouver les inscriptions avec solde faible
        const qb = this.inscriptionRepo.createQueryBuilder('i')
            .innerJoin('i.eleve', 'e')
            .where('i.statut = :statut', { statut: StatutInscriptionCantine.ACTIVE })
            .andWhere('i.solde < :seuil', { seuil: -seuilAlerte });
        
        if (etablissementId) {
            qb.andWhere('i.etablissementId = :etablissementId', { etablissementId });
        }

        const inscriptions = await qb.getMany();
        let count = 0;

        for (const inscription of inscriptions) {
            try {
                const eleveRepo = AppDataSource.getRepository(Eleve);
                const eleve = await eleveRepo.findOne({
                    where: { id: inscription.eleveId },
                    relations: ['utilisateur'],
                });

                if (!eleve?.utilisateurId) continue;

                // Trouver les responsables
                const responsables = await parentsService.getResponsablesForNotification(eleve.utilisateurId);

                if (!responsables || responsables.length === 0) continue;

                for (const resp of responsables) {
                    await notificationTemplates.rappelPaiementCantine({
                        destinataireId: resp.utilisateurId,
                        etablissementId,
                        metadata: {
                            email: resp.email,
                            type: 'cantine_rappel',
                            inscriptionId: inscription.id,
                        },
                    }, {
                        eleveNom: `Élève ${eleve.id.substring(0, 8)}`,
                        montant: Math.abs(inscription.solde),
                        echeance: '7 jours',
                        solde: inscription.solde,
                    });
                    count++;
                }
            } catch (error) {
                logger.warn(`[Cantine] Erreur rappel paiement inscription ${inscription.id}`, error);
            }
        }

        if (count > 0) {
            logger.info(`[Cantine] ${count} rappels de paiement envoyés`);
        }

        return count;
    }
}

export const cantineService = new CantineService();
