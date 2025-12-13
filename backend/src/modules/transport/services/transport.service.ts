/**
 * ==================================
 * eLISAschool - Service Transport v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { LigneTransport, InscriptionTransport, PresenceTransport } from '../entities';
import { CreateLigneDto, CreateInscriptionTransportDto, EnregistrerPresenceDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';

/**
 * Service Transport avec configuration centralisée
 */
export class TransportService {
    private ligneRepo: Repository<LigneTransport>;
    private inscriptionRepo: Repository<InscriptionTransport>;
    private presenceRepo: Repository<PresenceTransport>;

    constructor() {
        this.ligneRepo = AppDataSource.getRepository(LigneTransport);
        this.inscriptionRepo = AppDataSource.getRepository(InscriptionTransport);
        this.presenceRepo = AppDataSource.getRepository(PresenceTransport);
    }

    /**
     * Récupère les paramètres transport depuis la configuration
     */
    private async getTransportParams() {
        return {
            enableGPS: await getParamBoolean('transport.enable_gps', false),
            enableQRCheckin: await getParamBoolean('transport.enable_qr_checkin', true),
        };
    }

    async createLigne(dto: CreateLigneDto): Promise<LigneTransport> {
        const ligne = this.ligneRepo.create(dto);
        await this.ligneRepo.save(ligne);
        logger.info(`Ligne de transport créée: ${dto.nom}`);
        return ligne;
    }

    async getLignes(): Promise<LigneTransport[]> {
        return this.ligneRepo.find({ where: { actif: true }, relations: ['chauffeur'] });
    }

    async getLigne(id: string): Promise<LigneTransport> {
        const ligne = await this.ligneRepo.findOne({ where: { id }, relations: ['chauffeur'] });
        if (!ligne) throw new AppError('Ligne non trouvée', 404, 'NOT_FOUND');
        return ligne;
    }

    async createInscription(dto: CreateInscriptionTransportDto): Promise<InscriptionTransport> {
        const existant = await this.inscriptionRepo.findOne({ where: { eleveId: dto.eleveId, actif: true } });
        if (existant) throw new AppError('Élève déjà inscrit au transport', 409, 'ALREADY_ENROLLED');
        const inscription = this.inscriptionRepo.create(dto);
        await this.inscriptionRepo.save(inscription);
        return inscription;
    }

    async getInscriptionsByLigne(ligneId: string): Promise<InscriptionTransport[]> {
        return this.inscriptionRepo.find({ where: { ligneId, actif: true }, relations: ['eleve'] });
    }

    /**
     * Enregistrer une présence (vérifie si QR checkin est activé)
     */
    async enregistrerPresence(dto: EnregistrerPresenceDto): Promise<PresenceTransport> {
        const params = await this.getTransportParams();

        if (!params.enableQRCheckin) {
            throw new AppError('Le pointage QR n\'est pas activé', 400, 'QR_CHECKIN_DISABLED');
        }

        const presence = this.presenceRepo.create({ ...dto, date: new Date(dto.date) });
        await this.presenceRepo.save(presence);
        return presence;
    }

    async getPresencesDuJour(ligneId: string): Promise<PresenceTransport[]> {
        const today = new Date().toISOString().split('T')[0];
        return this.presenceRepo.createQueryBuilder('p')
            .innerJoin('p.inscription', 'i')
            .where('i.ligneId = :ligneId', { ligneId })
            .andWhere('p.date = :today', { today })
            .getMany();
    }

    /**
     * Vérifie si le GPS est activé (pour l'interface)
     */
    async isGPSEnabled(): Promise<boolean> {
        const params = await this.getTransportParams();
        return params.enableGPS;
    }
}

export const transportService = new TransportService();
