/**
 * ==================================
 * eLISAschool - Service Clubs v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Club, InscriptionClub, EvenementClub } from '../entities';
import { CreateClubDto, InscrireClubDto, CreateEvenementDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';

/**
 * Service Clubs avec configuration centralisée
 */
export class ClubsService {
    private clubRepo: Repository<Club>;
    private inscriptionRepo: Repository<InscriptionClub>;
    private evenementRepo: Repository<EvenementClub>;

    constructor() {
        this.clubRepo = AppDataSource.getRepository(Club);
        this.inscriptionRepo = AppDataSource.getRepository(InscriptionClub);
        this.evenementRepo = AppDataSource.getRepository(EvenementClub);
    }

    /**
     * Récupère les paramètres clubs depuis la configuration
     */
    private async getClubsParams() {
        return {
            maxPerStudent: await getParamNumber('clubs.max_per_student', 3),
            requireApproval: await getParamBoolean('clubs.require_approval', true),
        };
    }

    async createClub(dto: CreateClubDto): Promise<Club> {
        const club = this.clubRepo.create(dto);
        await this.clubRepo.save(club);
        logger.info(`Club créé: ${dto.nom}`);
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

    /**
     * Inscription à un club (vérifie la limite configurable)
     */
    async inscrire(dto: InscrireClubDto): Promise<InscriptionClub> {
        const params = await this.getClubsParams();

        // Vérifier le nombre d'inscriptions de l'élève
        const inscriptionsActuelles = await this.inscriptionRepo.count({
            where: { eleveId: dto.eleveId, actif: true },
        });

        if (inscriptionsActuelles >= params.maxPerStudent) {
            throw new AppError(
                `Limite de ${params.maxPerStudent} clubs par élève atteinte`,
                400,
                'MAX_CLUBS_REACHED'
            );
        }

        // Vérifier si déjà inscrit
        const existing = await this.inscriptionRepo.findOne({
            where: { clubId: dto.clubId, eleveId: dto.eleveId, actif: true },
        });
        if (existing) throw new AppError('Déjà inscrit', 409, 'ALREADY_ENROLLED');

        // Créer l'inscription avec approbation si requise
        const inscription = this.inscriptionRepo.create({
            ...dto,
            statut: params.requireApproval ? 'EN_ATTENTE' : 'APPROUVE',
        });
        await this.inscriptionRepo.save(inscription);

        logger.info(`Inscription club: élève ${dto.eleveId} -> club ${dto.clubId}`);
        return inscription;
    }

    async getInscrits(clubId: string): Promise<InscriptionClub[]> {
        return this.inscriptionRepo.find({ where: { clubId, actif: true }, relations: ['eleve'] });
    }

    async approuverInscription(inscriptionId: string): Promise<InscriptionClub> {
        const inscription = await this.inscriptionRepo.findOne({ where: { id: inscriptionId } });
        if (!inscription) throw new AppError('Inscription non trouvée', 404, 'NOT_FOUND');

        inscription.statut = 'APPROUVE';
        await this.inscriptionRepo.save(inscription);
        return inscription;
    }

    async createEvenement(clubId: string, dto: CreateEvenementDto): Promise<EvenementClub> {
        const evenement = this.evenementRepo.create({
            ...dto,
            clubId,
            dateDebut: new Date(dto.dateDebut),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
        });
        await this.evenementRepo.save(evenement);
        logger.info(`Événement club créé: ${dto.titre}`);
        return evenement;
    }

    async getEvenements(clubId: string): Promise<EvenementClub[]> {
        return this.evenementRepo.find({ where: { clubId }, order: { dateDebut: 'DESC' } });
    }

    /**
     * Compte d'inscriptions par élève
     */
    async getInscriptionsEleve(eleveId: string): Promise<{ clubs: InscriptionClub[]; limite: number }> {
        const params = await this.getClubsParams();
        const clubs = await this.inscriptionRepo.find({
            where: { eleveId, actif: true },
            relations: ['club'],
        });
        return { clubs, limite: params.maxPerStudent };
    }
}

export const clubsService = new ClubsService();
