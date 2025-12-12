import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Requete, TypeRequete, StatutRequete } from '../entities';
import { CreateRequeteDto, TraiterRequeteDto, QueryRequetesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class RequetesService {
    private requeteRepo: Repository<Requete>;

    constructor() {
        this.requeteRepo = AppDataSource.getRepository(Requete);
    }

    async create(dto: CreateRequeteDto, demandeurId: string): Promise<Requete> {
        const requete = this.requeteRepo.create({ ...dto, demandeurId });
        await this.requeteRepo.save(requete);
        logger.info(`Requête créée: ${dto.sujet} par ${demandeurId}`);
        return requete;
    }

    async findAll(query: QueryRequetesDto) {
        const { page, limit, type, statut } = query;
        const where: any = {};
        if (type) where.type = type;
        if (statut) where.statut = statut;

        const [items, total] = await this.requeteRepo.findAndCount({
            where,
            relations: ['demandeur', 'approbateur'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total };
    }

    async findByUser(demandeurId: string, query: QueryRequetesDto) {
        const { page, limit, statut } = query;
        const where: any = { demandeurId };
        if (statut) where.statut = statut;

        const [items, total] = await this.requeteRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total };
    }

    async findOne(id: string): Promise<Requete> {
        const requete = await this.requeteRepo.findOne({ where: { id }, relations: ['demandeur', 'approbateur'] });
        if (!requete) throw new AppError('Requête non trouvée', 404, 'NOT_FOUND');
        return requete;
    }

    async traiter(id: string, dto: TraiterRequeteDto, approbateurId: string): Promise<Requete> {
        const requete = await this.findOne(id);
        if (requete.statut !== StatutRequete.EN_ATTENTE && requete.statut !== StatutRequete.EN_COURS) {
            throw new AppError('Requête déjà traitée', 400, 'ALREADY_PROCESSED');
        }
        requete.statut = dto.statut as StatutRequete;
        requete.approbateurId = approbateurId;
        requete.commentaireApprobation = dto.commentaire;
        requete.dateApprobation = new Date();
        await this.requeteRepo.save(requete);
        logger.info(`Requête ${id} ${dto.statut} par ${approbateurId}`);
        return requete;
    }

    async annuler(id: string, utilisateurId: string): Promise<Requete> {
        const requete = await this.findOne(id);
        if (requete.demandeurId !== utilisateurId) throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        if (requete.statut !== StatutRequete.EN_ATTENTE) throw new AppError('Impossible d\'annuler', 400, 'CANNOT_CANCEL');
        requete.statut = StatutRequete.ANNULEE;
        await this.requeteRepo.save(requete);
        return requete;
    }
}

export const requetesService = new RequetesService();
