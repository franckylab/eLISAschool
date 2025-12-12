import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MenuCantine, InscriptionCantine, ConsommationCantine, StatutRepas } from '../entities';
import { CreateMenuDto, CreateInscriptionDto, RechargerSoldeDto, EnregistrerConsommationDto, QueryMenusDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class CantineService {
    private menuRepo: Repository<MenuCantine>;
    private inscriptionRepo: Repository<InscriptionCantine>;
    private consommationRepo: Repository<ConsommationCantine>;

    constructor() {
        this.menuRepo = AppDataSource.getRepository(MenuCantine);
        this.inscriptionRepo = AppDataSource.getRepository(InscriptionCantine);
        this.consommationRepo = AppDataSource.getRepository(ConsommationCantine);
    }

    async createMenu(dto: CreateMenuDto): Promise<MenuCantine> {
        const menu = this.menuRepo.create({ ...dto, date: new Date(dto.date) });
        await this.menuRepo.save(menu);
        logger.info(`Menu créé: ${menu.platPrincipal} pour ${dto.date}`);
        return menu;
    }

    async getMenus(query: QueryMenusDto) {
        const { page, limit, dateDebut, dateFin } = query;
        const qb = this.menuRepo.createQueryBuilder('m').orderBy('m.date', 'DESC');
        if (dateDebut) qb.andWhere('m.date >= :dateDebut', { dateDebut });
        if (dateFin) qb.andWhere('m.date <= :dateFin', { dateFin });
        const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
        return { items, total };
    }

    async getMenuDuJour(): Promise<MenuCantine[]> {
        const today = new Date().toISOString().split('T')[0];
        return this.menuRepo.find({ where: { date: new Date(today), statut: StatutRepas.DISPONIBLE } });
    }

    async createInscription(dto: CreateInscriptionDto): Promise<InscriptionCantine> {
        const existant = await this.inscriptionRepo.findOne({ where: { eleveId: dto.eleveId } });
        if (existant) throw new AppError('Élève déjà inscrit à la cantine', 409, 'ALREADY_ENROLLED');
        const inscription = this.inscriptionRepo.create(dto);
        await this.inscriptionRepo.save(inscription);
        return inscription;
    }

    async rechargerSolde(inscriptionId: string, dto: RechargerSoldeDto): Promise<InscriptionCantine> {
        const inscription = await this.inscriptionRepo.findOne({ where: { id: inscriptionId } });
        if (!inscription) throw new AppError('Inscription non trouvée', 404, 'NOT_FOUND');
        inscription.solde = Number(inscription.solde) + dto.montant;
        await this.inscriptionRepo.save(inscription);
        logger.info(`Solde rechargé: +${dto.montant} FCFA pour inscription ${inscriptionId}`);
        return inscription;
    }

    async enregistrerConsommation(dto: EnregistrerConsommationDto): Promise<ConsommationCantine> {
        const inscription = await this.inscriptionRepo.findOne({ where: { id: dto.inscriptionId } });
        const menu = await this.menuRepo.findOne({ where: { id: dto.menuId } });
        if (!inscription || !menu) throw new AppError('Données invalides', 400, 'INVALID_DATA');
        if (Number(inscription.solde) < Number(menu.prix)) throw new AppError('Solde insuffisant', 400, 'INSUFFICIENT_BALANCE');

        inscription.solde = Number(inscription.solde) - Number(menu.prix);
        await this.inscriptionRepo.save(inscription);

        const consommation = this.consommationRepo.create({ ...dto, paye: true });
        await this.consommationRepo.save(consommation);
        return consommation;
    }

    async getInscription(eleveId: string): Promise<InscriptionCantine | null> {
        return this.inscriptionRepo.findOne({ where: { eleveId }, relations: ['eleve'] });
    }
}

export const cantineService = new CantineService();
