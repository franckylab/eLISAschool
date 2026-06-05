/**
 * ==================================
 * eLISAschool - Service Cantine v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MenuCantine, InscriptionCantine, ConsommationCantine, StatutRepas, StatutInscriptionCantine } from '../entities';
import { CreateMenuDto, CreateInscriptionDto, EnregistrerConsommationDto, RechargerSoldeDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean, getParam } from '@modules/configuration/utils/config.helper';

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
            currency: await getParam<string>('regional.currency', 'XOF'),
        };
    }

    // ============ MENUS ============

    async createMenu(dto: CreateMenuDto): Promise<MenuCantine> {
        const menu = this.menuRepo.create({
            ...dto,
            date: dto.date ? new Date(dto.date) : new Date(),
        });
        await this.menuRepo.save(menu);
        logger.info(`Menu créé pour le ${dto.date}`);
        return menu;
    }

    async getMenus(dateDebut?: string, dateFin?: string): Promise<MenuCantine[]> {
        const qb = this.menuRepo.createQueryBuilder('m').where('m.actif = true');

        if (dateDebut) qb.andWhere('m.date >= :dateDebut', { dateDebut });
        if (dateFin) qb.andWhere('m.date <= :dateFin', { dateFin });

        return qb.orderBy('m.date', 'ASC').getMany();
    }

    /**
     * Récupère les menus de la semaine (selon config)
     */
    async getMenusSemaine(): Promise<MenuCantine[]> {
        const params = await this.getCantineParams();
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + params.menuPlanningDays);

        return this.menuRepo.createQueryBuilder('m')
            .where('m.actif = true')
            .andWhere('m.date >= :today', { today: today.toISOString().split('T')[0] })
            .andWhere('m.date <= :endDate', { endDate: endDate.toISOString().split('T')[0] })
            .orderBy('m.date', 'ASC')
            .getMany();
    }

    async getMenuDuJour(): Promise<MenuCantine | null> {
        const today = new Date().toISOString().split('T')[0];
        return this.menuRepo.findOne({ where: { date: new Date(today), actif: true } });
    }

    // ============ INSCRIPTIONS ============

    async createInscription(dto: CreateInscriptionDto): Promise<InscriptionCantine> {
        const existant = await this.inscriptionRepo.findOne({
            where: { eleveId: dto.eleveId, statut: StatutInscriptionCantine.ACTIVE },
        });
        if (existant) {
            throw new AppError('Élève déjà inscrit à la cantine', 409, 'ALREADY_ENROLLED');
        }

        const inscription: InscriptionCantine = this.inscriptionRepo.create({
            ...dto,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
            solde: 0,
        });
        await this.inscriptionRepo.save(inscription);
        return inscription;
    }

    async getInscription(id: string): Promise<InscriptionCantine> {
        const inscription = await this.inscriptionRepo.findOne({
            where: { id },
            relations: ['eleve'],
        });
        if (!inscription) throw new AppError('Inscription non trouvée', 404, 'NOT_FOUND');
        return inscription;
    }

    async getInscriptionByEleve(eleveId: string): Promise<InscriptionCantine | null> {
        return this.inscriptionRepo.findOne({
            where: { eleveId, statut: StatutInscriptionCantine.ACTIVE },
        });
    }

    /**
     * Recharger le solde (avec devise depuis config)
     */
    async rechargerSolde(inscriptionId: string, dto: RechargerSoldeDto): Promise<InscriptionCantine> {
        const params = await this.getCantineParams();
        const inscription = await this.getInscription(inscriptionId);

        inscription.solde += dto.montant;
        await this.inscriptionRepo.save(inscription);

        logger.info(`Solde rechargé: +${dto.montant} ${params.currency} pour inscription ${inscriptionId}`);
        return inscription;
    }

    // ============ CONSOMMATIONS ============

    async enregistrerConsommation(dto: EnregistrerConsommationDto): Promise<ConsommationCantine> {
        const inscription = await this.getInscriptionByEleve(dto.eleveId || dto.inscriptionId);
        if (!inscription) {
            throw new AppError('Élève non inscrit à la cantine', 400, 'NOT_ENROLLED');
        }

        // Vérifier le solde
        if (inscription.solde < (dto.montant || 0)) {
            throw new AppError('Solde insuffisant', 400, 'INSUFFICIENT_BALANCE');
        }

        // Débiter le solde
        inscription.solde -= (dto.montant || 0);
        await this.inscriptionRepo.save(inscription);

        const consommation: ConsommationCantine = this.consommationRepo.create({
            ...dto,
            inscriptionId: inscription.id,
            date: dto.date ? new Date(dto.date) : new Date(),
            statut: StatutRepas.CONSOMME,
        });
        await this.consommationRepo.save(consommation);

        return consommation;
    }

    async getConsommationsEleve(eleveId: string, mois?: string): Promise<ConsommationCantine[]> {
        const qb = this.consommationRepo.createQueryBuilder('c')
            .innerJoin('c.inscription', 'i')
            .where('i.eleveId = :eleveId', { eleveId });

        if (mois) {
            qb.andWhere('TO_CHAR(c.date, \'YYYY-MM\') = :mois', { mois });
        }

        return qb.orderBy('c.date', 'DESC').getMany();
    }
}

export const cantineService = new CantineService();
