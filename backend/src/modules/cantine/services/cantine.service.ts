/**
 * ==================================
 * eLISAschool - Service Cantine v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
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

/**
 * Service Cantine avec configuration centralisée
 */
export class CantineService {
    private menuRepo: Repository<MenuCantine>;
    private inscriptionRepo: Repository<InscriptionCantine>;
    private consommationRepo: Repository<ConsommationCantine>;

    constructor() {
        this.menuRepo = AppDataSource.getRepository(MenuCantine);
        this.inscriptionRepo = AppDataSource.getRepository(InscriptionCantine);
        this.consommationRepo = AppDataSource.getRepository(ConsommationCantine);
    }

    /**
     * Récupère les paramètres cantine depuis la configuration
     */
    private async getCantineParams() {
        return {
            menuPlanningDays: await getParamNumber('cantine.menu_planning_days', 7),
            allowPreorder: await getParamBoolean('cantine.allow_preorder', true),
            maxDebt: await getParamNumber('cantine.max_debt', 10000),
            currency: await getParam<string>('regional.currency', 'XOF'),
        };
    }

    // ============ MENUS ============

    async createMenu(dto: CreateMenuDto, etablissementId?: string): Promise<MenuCantine> {
        const menu = this.menuRepo.create({
            ...dto,
            etablissementId,
            date: dto.date ? new Date(dto.date) : new Date(),
        });
        await this.menuRepo.save(menu);
        logger.info(`[${etablissementId}] Menu créé pour le ${dto.date}`);
        return menu;
    }

    async getMenus(dateDebut?: string, dateFin?: string, etablissementId?: string): Promise<MenuCantine[]> {
        const qb = this.menuRepo.createQueryBuilder('m').where('m.actif = true');
        if (etablissementId) qb.andWhere('m.etablissementId = :etablissementId', { etablissementId });
        if (dateDebut) qb.andWhere('m.date >= :dateDebut', { dateDebut });
        if (dateFin) qb.andWhere('m.date <= :dateFin', { dateFin });
        return qb.orderBy('m.date', 'ASC').getMany();
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
        await this.inscriptionRepo.save(inscription);

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
    async rechargerSolde(inscriptionId: string, dto: RechargerSoldeDto, etablissementId?: string): Promise<InscriptionCantine> {
        const params = await this.getCantineParams();
        const inscription = await this.getInscription(inscriptionId, etablissementId);

        inscription.solde += dto.montant;
        await this.inscriptionRepo.save(inscription);

        logger.info(`[${etablissementId}] Solde rechargé: +${dto.montant} ${params.currency} pour inscription ${inscriptionId}`);
        
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

    async enregistrerConsommation(dto: EnregistrerConsommationDto, etablissementId?: string): Promise<ConsommationCantine> {
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
