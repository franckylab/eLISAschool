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

    async createClub(dto: CreateClubDto, etablissementId?: string): Promise<Club> {
        const club = this.clubRepo.create({ ...dto, etablissementId });
        await this.clubRepo.save(club);
        logger.info(`[${etablissementId}] Club créé: ${dto.nom}`);
        return club;
    }

    async getClubs(etablissementId?: string): Promise<Club[]> {
        const where: any = { actif: true };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.clubRepo.find({ where, relations: ['responsable'] });
    }

    async getClub(id: string, etablissementId?: string): Promise<Club> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const club = await this.clubRepo.findOne({ where, relations: ['responsable'] });
        if (!club) throw new AppError('Club non trouvé', 404, 'NOT_FOUND');
        return club;
    }

    /**
     * Inscription à un club (vérifie la limite configurable)
     */
    async inscrire(dto: InscrireClubDto, etablissementId?: string): Promise<InscriptionClub> {
        const params = await this.getClubsParams();

        // Vérifier le nombre d'inscriptions de l'élève
        const whereCount: any = { eleveId: dto.eleveId, actif: true };
        if (etablissementId) whereCount.etablissementId = etablissementId;
        const inscriptionsActuelles = await this.inscriptionRepo.count({
            where: whereCount,
        });

        if (inscriptionsActuelles >= params.maxPerStudent) {
            throw new AppError(
                `Limite de ${params.maxPerStudent} clubs par élève atteinte`,
                400,
                'MAX_CLUBS_REACHED'
            );
        }

        // Vérifier si déjà inscrit
        const whereExisting: any = { clubId: dto.clubId, eleveId: dto.eleveId, actif: true };
        if (etablissementId) whereExisting.etablissementId = etablissementId;
        const existing = await this.inscriptionRepo.findOne({
            where: whereExisting,
        });
        if (existing) throw new AppError('Déjà inscrit', 409, 'ALREADY_ENROLLED');

        // Créer l'inscription avec approbation si requise
        const inscription = this.inscriptionRepo.create({
            ...dto,
            etablissementId,
            actif: !params.requireApproval,
        });
        await this.inscriptionRepo.save(inscription);

        logger.info(`[${etablissementId}] Inscription club: élève ${dto.eleveId} -> club ${dto.clubId}`);
        return inscription;
    }

    async getInscrits(clubId: string, etablissementId?: string): Promise<InscriptionClub[]> {
        const where: any = { clubId, actif: true };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.inscriptionRepo.find({ where, relations: ['eleve'] });
    }

    async approuverInscription(inscriptionId: string, etablissementId?: string): Promise<InscriptionClub> {
        const where: any = { id: inscriptionId };
        if (etablissementId) where.etablissementId = etablissementId;
        const inscription = await this.inscriptionRepo.findOne({ where });
        if (!inscription) throw new AppError('Inscription non trouvée', 404, 'NOT_FOUND');

        inscription.actif = true;
        await this.inscriptionRepo.save(inscription);
        return inscription;
    }

    async createEvenement(clubId: string, dto: CreateEvenementDto, etablissementId?: string): Promise<EvenementClub> {
        const evenement = this.evenementRepo.create({
            ...dto,
            etablissementId,
            clubId,
            dateDebut: new Date(dto.dateDebut),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
        });
        await this.evenementRepo.save(evenement);
        logger.info(`[${etablissementId}] Événement club créé: ${dto.titre}`);
        return evenement;
    }

    async getEvenements(clubId: string, etablissementId?: string): Promise<EvenementClub[]> {
        const where: any = { clubId };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.evenementRepo.find({ where, order: { dateDebut: 'DESC' } });
    }

    /**
     * Compte d'inscriptions par élève
     */
    async getInscriptionsEleve(eleveId: string, etablissementId?: string): Promise<{ clubs: InscriptionClub[]; limite: number }> {
        const params = await this.getClubsParams();
        const where: any = { eleveId, actif: true };
        if (etablissementId) where.etablissementId = etablissementId;
        const clubs = await this.inscriptionRepo.find({
            where,
            relations: ['club'],
        });
        return { clubs, limite: params.maxPerStudent };
    }
}

export const clubsService = new ClubsService();
