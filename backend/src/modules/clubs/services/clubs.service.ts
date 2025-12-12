import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Club, InscriptionClub, EvenementClub } from '../entities';
import { CreateClubDto, InscrireClubDto, CreateEvenementDto } from '../dto';
import { AppError } from '@common/filters/error.filter';

export class ClubsService {
    private clubRepo: Repository<Club>;
    private inscriptionRepo: Repository<InscriptionClub>;
    private evenementRepo: Repository<EvenementClub>;

    constructor() {
        this.clubRepo = AppDataSource.getRepository(Club);
        this.inscriptionRepo = AppDataSource.getRepository(InscriptionClub);
        this.evenementRepo = AppDataSource.getRepository(EvenementClub);
    }

    async createClub(dto: CreateClubDto): Promise<Club> {
        const club = this.clubRepo.create(dto);
        await this.clubRepo.save(club);
        return club;
    }

    async getClubs(): Promise<Club[]> {
        return this.clubRepo.find({ where: { actif: true }, relations: ['responsable'] });
    }

    async getClub(id: string): Promise<Club> {
        const club = await this.clubRepo.findOne({ where: { id }, relations: ['responsable'] });
        if (!club) throw new AppError('Club non trouvé', 404, 'NOT_FOUND');
        return club;
    }

    async inscrire(dto: InscrireClubDto): Promise<InscriptionClub> {
        const existing = await this.inscriptionRepo.findOne({ where: { clubId: dto.clubId, eleveId: dto.eleveId, actif: true } });
        if (existing) throw new AppError('Déjà inscrit', 409, 'ALREADY_ENROLLED');
        const inscription = this.inscriptionRepo.create(dto);
        await this.inscriptionRepo.save(inscription);
        return inscription;
    }

    async getInscrits(clubId: string): Promise<InscriptionClub[]> {
        return this.inscriptionRepo.find({ where: { clubId, actif: true }, relations: ['eleve'] });
    }

    async createEvenement(clubId: string, dto: CreateEvenementDto): Promise<EvenementClub> {
        const evenement = this.evenementRepo.create({ ...dto, clubId, dateDebut: new Date(dto.dateDebut), dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined });
        await this.evenementRepo.save(evenement);
        return evenement;
    }

    async getEvenements(clubId: string): Promise<EvenementClub[]> {
        return this.evenementRepo.find({ where: { clubId }, order: { dateDebut: 'DESC' } });
    }
}

export const clubsService = new ClubsService();
