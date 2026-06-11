/**
 * ==================================
 * eLISAschool - Service Parking
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { PlaceParking, Vehicule, AbonnementParking } from '../entities';
import {
    CreatePlaceParkingDto,
    UpdatePlaceParkingDto,
    CreateVehiculeDto,
    UpdateVehiculeDto,
    CreateAbonnementDto,
    UpdateAbonnementDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';

/**
 * Service Parking - Gestion des places, véhicules et abonnements
 */
export class ParkingService {
    private placeRepo: Repository<PlaceParking>;
    private vehiculeRepo: Repository<Vehicule>;
    private abonnementRepo: Repository<AbonnementParking>;

    constructor() {
        this.placeRepo = AppDataSource.getRepository(PlaceParking);
        this.vehiculeRepo = AppDataSource.getRepository(Vehicule);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementParking);
    }

    // ==================================
    // PLACES DE PARKING
    // ==================================

    async createPlace(dto: CreatePlaceParkingDto, createurId?: string, etablissementId?: string): Promise<PlaceParking> {
        // Vérifier si le numéro existe déjà
        const existant = await this.placeRepo.findOne({
            where: { numero: dto.numero, etablissementId: etablissementId || undefined },
        });
        if (existant) {
            throw new AppError('Ce numéro de place existe déjà', 409, 'PLACE_ALREADY_EXISTS');
        }

        const place = this.placeRepo.create({ ...dto, etablissementId });
        await this.placeRepo.save(place);
        logger.info(`[${etablissementId}] Place de parking créée: ${dto.numero}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: createurId || 'system',
                action: AuditAction.PLACE_PARKING_CREATE,
                cible: 'PlaceParking',
                cibleId: place.id,
                description: `Place de parking créée: ${dto.numero}`,
                module: 'parking',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Parking] Erreur audit createPlace', error);
        }

        return place;
    }

    async getPlaces(etablissementId?: string, filtres?: { type?: string; statut?: string }): Promise<PlaceParking[]> {
        const qb = this.placeRepo.createQueryBuilder('p');
        
        if (etablissementId) {
            qb.where('p.etablissementId = :etablissementId', { etablissementId });
        }
        
        if (filtres?.type) {
            qb.andWhere('p.type = :type', { type: filtres.type });
        }
        
        if (filtres?.statut) {
            qb.andWhere('p.statut = :statut', { statut: filtres.statut });
        }

        return qb.orderBy('p.numero', 'ASC').getMany();
    }

    async getPlace(id: string, etablissementId?: string): Promise<PlaceParking> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        
        const place = await this.placeRepo.findOne({ where });
        if (!place) throw new AppError('Place non trouvée', 404, 'NOT_FOUND');
        
        return place;
    }

    async updatePlace(id: string, dto: UpdatePlaceParkingDto, userId?: string, etablissementId?: string): Promise<PlaceParking> {
        const place = await this.getPlace(id, etablissementId);
        
        // Si on assigne un véhicule, vérifier qu'il existe
        if (dto.vehiculeId) {
            const vehicule = await this.vehiculeRepo.findOne({
                where: { id: dto.vehiculeId },
            });
            if (!vehicule) {
                throw new AppError('Véhicule non trouvé', 404, 'VEHICLE_NOT_FOUND');
            }
        }

        Object.assign(place, dto);
        await this.placeRepo.save(place);
        logger.info(`[${etablissementId}] Place mise à jour: ${place.numero}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: userId || 'system',
                action: AuditAction.PLACE_PARKING_UPDATE,
                cible: 'PlaceParking',
                cibleId: place.id,
                description: `Place mise à jour: ${place.numero}`,
                module: 'parking',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Parking] Erreur audit updatePlace', error);
        }

        return place;
    }

    async deletePlace(id: string, userId?: string, etablissementId?: string): Promise<void> {
        const place = await this.getPlace(id, etablissementId);
        
        if (place.statut === 'occupee') {
            throw new AppError('Impossible de supprimer une place occupée', 400, 'PLACE_OCCUPIED');
        }

        await this.placeRepo.remove(place);
        logger.info(`[${etablissementId}] Place supprimée: ${place.numero}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: userId || 'system',
                action: AuditAction.PLACE_PARKING_DELETE,
                cible: 'PlaceParking',
                cibleId: place.id,
                description: `Place supprimée: ${place.numero}`,
                module: 'parking',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Parking] Erreur audit deletePlace', error);
        }
    }

    // ==================================
    // VÉHICULES
    // ==================================

    async createVehicule(dto: CreateVehiculeDto, createurId?: string, etablissementId?: string): Promise<Vehicule> {
        // Vérifier si l'immatriculation existe déjà
        const existant = await this.vehiculeRepo.findOne({
            where: { immatriculation: dto.immatriculation, etablissementId: etablissementId || undefined },
        });
        if (existant) {
            throw new AppError('Ce véhicule est déjà enregistré', 409, 'VEHICLE_ALREADY_EXISTS');
        }

        const vehicule = this.vehiculeRepo.create({ ...dto, etablissementId });
        await this.vehiculeRepo.save(vehicule);
        logger.info(`[${etablissementId}] Véhicule créé: ${dto.immatriculation}`);

        // Si une place est assignée, la mettre à jour
        if (dto.placeParkingId) {
            await this.updatePlace(dto.placeParkingId, {
                statut: 'occupee',
                vehiculeId: vehicule.id,
            }, createurId, etablissementId);
        }

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: createurId || 'system',
                action: AuditAction.VEHICULE_CREATE,
                cible: 'Vehicule',
                cibleId: vehicule.id,
                description: `Véhicule créé: ${dto.immatriculation}`,
                module: 'parking',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Parking] Erreur audit createVehicule', error);
        }

        return vehicule;
    }

    async getVehicules(etablissementId?: string): Promise<Vehicule[]> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;
        
        return this.vehiculeRepo.find({
            where,
            order: { immatriculation: 'ASC' },
        });
    }

    async getVehicule(id: string, etablissementId?: string): Promise<Vehicule> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        
        const vehicule = await this.vehiculeRepo.findOne({ where });
        if (!vehicule) throw new AppError('Véhicule non trouvé', 404, 'NOT_FOUND');
        
        return vehicule;
    }

    async updateVehicule(id: string, dto: UpdateVehiculeDto, userId?: string, etablissementId?: string): Promise<Vehicule> {
        const vehicule = await this.getVehicule(id, etablissementId);
        
        // Si on change la place de parking
        if (dto.placeParkingId !== undefined) {
            // Libérer l'ancienne place
            if (vehicule.placeParkingId) {
                await this.updatePlace(vehicule.placeParkingId, {
                    statut: 'libre',
                    vehiculeId: null,
                }, userId, etablissementId);
            }
            
            // Occuper la nouvelle place
            if (dto.placeParkingId) {
                const nouvellePlace = await this.getPlace(dto.placeParkingId, etablissementId);
                if (nouvellePlace.statut !== 'libre') {
                    throw new AppError('Cette place n\'est pas disponible', 400, 'PLACE_NOT_AVAILABLE');
                }
                
                await this.updatePlace(dto.placeParkingId, {
                    statut: 'occupee',
                    vehiculeId: vehicule.id,
                }, userId, etablissementId);
            }
        }

        Object.assign(vehicule, dto);
        await this.vehiculeRepo.save(vehicule);
        logger.info(`[${etablissementId}] Véhicule mis à jour: ${vehicule.immatriculation}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: userId || 'system',
                action: AuditAction.VEHICULE_UPDATE,
                cible: 'Vehicule',
                cibleId: vehicule.id,
                description: `Véhicule mis à jour: ${vehicule.immatriculation}`,
                module: 'parking',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Parking] Erreur audit updateVehicule', error);
        }

        return vehicule;
    }

    async deleteVehicule(id: string, userId?: string, etablissementId?: string): Promise<void> {
        const vehicule = await this.getVehicule(id, etablissementId);
        
        // Libérer la place si le véhicule en avait une
        if (vehicule.placeParkingId) {
            await this.updatePlace(vehicule.placeParkingId, {
                statut: 'libre',
                vehiculeId: null,
            }, userId, etablissementId);
        }

        await this.vehiculeRepo.remove(vehicule);
        logger.info(`[${etablissementId}] Véhicule supprimé: ${vehicule.immatriculation}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: userId || 'system',
                action: AuditAction.VEHICULE_DELETE,
                cible: 'Vehicule',
                cibleId: vehicule.id,
                description: `Véhicule supprimé: ${vehicule.immatriculation}`,
                module: 'parking',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Parking] Erreur audit deleteVehicule', error);
        }
    }

    // ==================================
    // ABONNEMENTS
    // ==================================

    async createAbonnement(dto: CreateAbonnementDto, createurId?: string, etablissementId?: string): Promise<AbonnementParking> {
        // Vérifier si le véhicule existe
        const vehicule = await this.vehiculeRepo.findOne({
            where: { id: dto.vehiculeId },
        });
        if (!vehicule) {
            throw new AppError('Véhicule non trouvé', 404, 'VEHICLE_NOT_FOUND');
        }

        // Vérifier les dates
        const dateDebut = new Date(dto.dateDebut);
        const dateFin = new Date(dto.dateFin);
        if (dateFin <= dateDebut) {
            throw new AppError('La date de fin doit être après la date de début', 400, 'INVALID_DATES');
        }

        const abonnement = this.abonnementRepo.create({
            ...dto,
            dateDebut,
            dateFin,
            statut: 'actif',
            etablissementId,
        });
        await this.abonnementRepo.save(abonnement);
        logger.info(`[${etablissementId}] Abonnement créé pour véhicule ${dto.vehiculeId}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: createurId || 'system',
                action: AuditAction.ABONNEMENT_PARKING_CREATE,
                cible: 'AbonnementParking',
                cibleId: abonnement.id,
                description: `Abonnement créé pour véhicule ${dto.vehiculeId}`,
                module: 'parking',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Parking] Erreur audit createAbonnement', error);
        }

        return abonnement;
    }

    async getAbonnements(etablissementId?: string, filtres?: { statut?: string }): Promise<AbonnementParking[]> {
        const qb = this.abonnementRepo.createQueryBuilder('a');
        
        if (etablissementId) {
            qb.where('a.etablissementId = :etablissementId', { etablissementId });
        }
        
        if (filtres?.statut) {
            qb.andWhere('a.statut = :statut', { statut: filtres.statut });
        }

        return qb.orderBy('a.dateDebut', 'DESC').getMany();
    }

    async getAbonnement(id: string, etablissementId?: string): Promise<AbonnementParking> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        
        const abonnement = await this.abonnementRepo.findOne({ where });
        if (!abonnement) throw new AppError('Abonnement non trouvé', 404, 'NOT_FOUND');
        
        return abonnement;
    }

    async updateAbonnement(id: string, dto: UpdateAbonnementDto, userId?: string, etablissementId?: string): Promise<AbonnementParking> {
        const abonnement = await this.getAbonnement(id, etablissementId);
        
        if (dto.dateFin) {
            const nouvelleDateFin = new Date(dto.dateFin);
            if (nouvelleDateFin <= abonnement.dateDebut) {
                throw new AppError('La date de fin doit être après la date de début', 400, 'INVALID_DATES');
            }
            abonnement.dateFin = nouvelleDateFin;
        }

        if (dto.statut) abonnement.statut = dto.statut;
        if (dto.tarif !== undefined) abonnement.tarif = dto.tarif;

        await this.abonnementRepo.save(abonnement);
        logger.info(`[${etablissementId}] Abonnement mis à jour: ${abonnement.id}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: userId || 'system',
                action: AuditAction.ABONNEMENT_PARKING_UPDATE,
                cible: 'AbonnementParking',
                cibleId: abonnement.id,
                description: `Abonnement mis à jour: ${abonnement.id}`,
                module: 'parking',
                etablissementId,
            });
        } catch (error) {
            logger.warn('[Parking] Erreur audit updateAbonnement', error);
        }

        return abonnement;
    }

    async expireAbonnements(): Promise<number> {
        const aujourdHui = new Date();
        const result = await this.abonnementRepo
            .createQueryBuilder()
            .update(AbonnementParking)
            .set({ statut: 'expire' })
            .where('statut = :statut', { statut: 'actif' })
            .andWhere('dateFin < :aujourdHui', { aujourdHui })
            .execute();

        if (result.affected && result.affected > 0) {
            logger.info(`[${result.affected}] abonnements expirés automatiquement`);
        }

        return result.affected || 0;
    }

    // ==================================
    // STATISTIQUES
    // ==================================

    async getStatistiques(etablissementId?: string): Promise<{
        totalPlaces: number;
        placesLibres: number;
        placesOccupees: number;
        tauxOccupation: number;
        totalAbonnements: number;
        abonnementsActifs: number;
        revenusMensuels: number;
    }> {
        const qbPlaces = this.placeRepo.createQueryBuilder('p');
        if (etablissementId) qbPlaces.where('p.etablissementId = :etablissementId', { etablissementId });
        
        const totalPlaces = await qbPlaces.getCount();
        
        const placesLibres = await this.placeRepo.count({
            where: etablissementId ? { statut: 'libre', etablissementId } : { statut: 'libre' },
        });
        
        const placesOccupees = await this.placeRepo.count({
            where: etablissementId ? { statut: 'occupee', etablissementId } : { statut: 'occupee' },
        });

        const qbAbonnements = this.abonnementRepo.createQueryBuilder('a');
        if (etablissementId) qbAbonnements.where('a.etablissementId = :etablissementId', { etablissementId });
        
        const totalAbonnements = await qbAbonnements.getCount();
        
        const abonnementsActifs = await this.abonnementRepo.count({
            where: etablissementId ? { statut: 'actif', etablissementId } : { statut: 'actif' },
        });

        // Calcul des revenus mensuels
        const revenusQuery = this.abonnementRepo.createQueryBuilder('a')
            .select('SUM(a.tarif)', 'total')
            .where('a.statut = :statut', { statut: 'actif' });
        
        if (etablissementId) {
            revenusQuery.andWhere('a.etablissementId = :etablissementId', { etablissementId });
        }

        const result = await revenusQuery.getRawOne();
        const revenusMensuels = parseFloat(result?.total || 0);

        const tauxOccupation = totalPlaces > 0 ? (placesOccupees / totalPlaces) * 100 : 0;

        return {
            totalPlaces,
            placesLibres,
            placesOccupees,
            tauxOccupation,
            totalAbonnements,
            abonnementsActifs,
            revenusMensuels,
        };
    }
}

export const parkingService = new ParkingService();
