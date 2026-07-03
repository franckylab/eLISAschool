/**
 * ==================================
 * eLISAschool - Service Salles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Logique métier pour la gestion des salles :
 * - CRUD complet avec validation
 * - Vérification d'unicité du code
 * - Filtrage par établissement (multi-tenant)
 * - Pagination et recherche
 * - Vérification des conflits d'occupation
 */

import { Repository, ILike, MoreThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Salle, TypeSalle, StatutSalle } from '../entities';
import { CreateSalleDto, UpdateSalleDto, QuerySallesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { salleAvailabilityService } from './salle-availability.service';

export class SalleService {
    private repo: Repository<Salle>;

    constructor() {
        this.repo = AppDataSource.getRepository(Salle);
    }

    /**
     * Crée une nouvelle salle
     */
    async create(dto: CreateSalleDto, etablissementId: string): Promise<Salle> {
        // Vérifier l'unicité du code
        const exists = await this.repo.findOne({
            where: { code: dto.code, etablissementId }
        });

        if (exists) {
            throw new AppError(
                `Une salle avec le code "${dto.code}" existe déjà`,
                409,
                'SALLE_CODE_EXISTS'
            );
        }

        const salle = this.repo.create({
            ...dto,
            etablissementId,
        });

        const saved = await this.repo.save(salle);
        logger.info(`Salle créée: ${saved.nom} (${saved.code})`, { etablissementId, salleId: saved.id });
        return saved;
    }

    /**
     * Récupère toutes les salles avec pagination
     */
    async findAll(dto: QuerySallesDto, etablissementId: string): Promise<{ data: Salle[]; total: number }> {
        const { page, limit, typeSalle, disponible, statut, capaciteMin, capaciteMax, search } = dto;
        const offset = (page - 1) * limit;

        // Construire les conditions WHERE
        let whereClause: any = { etablissementId };

        if (typeSalle) whereClause.typeSalle = typeSalle;
        if (disponible !== undefined) whereClause.disponible = disponible;
        if (statut) whereClause.statut = statut;
        
        // Filtre de capacité
        if (capaciteMin || capaciteMax) {
            whereClause.capacite = {};
            if (capaciteMin) whereClause.capacite._greater_than_or_equal = capaciteMin;
            if (capaciteMax) whereClause.capacite._less_than_or_equal = capaciteMax;
        }

        // Recherche textuelle simplifiée
        if (search) {
            whereClause.nom = ILike(`%${search}%`);
        }

        const [data, total] = await this.repo.findAndCount({
            where: whereClause,
            order: { nom: 'ASC' },
            take: limit,
            skip: offset,
        });

        return { data, total };
    }

    /**
     * Récupère une salle par son ID
     */
    async findOne(id: string, etablissementId: string): Promise<Salle> {
        const salle = await this.repo.findOne({
            where: { id, etablissementId },
        });

        if (!salle) {
            throw new AppError('Salle non trouvée', 404, 'NOT_FOUND');
        }

        return salle;
    }

    /**
     * Met à jour une salle
     */
    async update(id: string, dto: UpdateSalleDto, etablissementId: string): Promise<Salle> {
        const salle = await this.findOne(id, etablissementId);

        // Si on modifie le statut, mettre à jour disponible en conséquence
        if (dto.statut === StatutSalle.EN_MAINTENANCE || dto.statut === StatutSalle.INDISPONIBLE) {
            dto.disponible = false;
        } else if (dto.statut === StatutSalle.DISPONIBLE) {
            dto.disponible = true;
        }

        Object.assign(salle, dto);
        const updated = await this.repo.save(salle);
        logger.info(`Salle modifiée: ${updated.nom}`, { etablissementId, salleId: updated.id });
        return updated;
    }

    /**
     * Supprime une salle
     */
    async delete(id: string, etablissementId: string): Promise<void> {
        const salle = await this.findOne(id, etablissementId);
        await this.repo.remove(salle);
        logger.info(`Salle supprimée: ${salle.nom}`, { etablissementId, salleId: id });
    }

    /**
     * Récupère les salles disponibles
     */
    async findDisponibles(
        etablissementId: string,
        capaciteMin?: number,
        typeSalle?: TypeSalle
    ): Promise<Salle[]> {
        const where: any = {
            etablissementId,
            disponible: true,
            statut: StatutSalle.DISPONIBLE,
        };

        if (capaciteMin) {
            where.capacite = MoreThan(capaciteMin - 1) as any;
        }

        if (typeSalle) {
            where.typeSalle = typeSalle;
        }

        return this.repo.find({ where, order: { capacite: 'DESC' } });
    }

    /**
     * Vérifie si une salle est disponible pour un créneau horaire
     * Utilise le service transverse pour checker EDT + HeureCours
     */
    async estDisponiblePourCreneau(
        salleId: string,
        etablissementId: string,
        jour: string,
        heureDebut: string,
        heureFin: string,
        anneeScolaireId: string,
        excludeEmploiId?: string
    ): Promise<boolean> {
        const { disponible } = await salleAvailabilityService.verifierDisponibilite(
            salleId,
            etablissementId,
            { jour, heureDebut, heureFin, anneeScolaireId, excludeEmploiId }
        );
        return disponible;
    }

    /**
     * Statistiques des salles
     */
    async getStatistiques(etablissementId: string): Promise<{
        total: number;
        disponibles: number;
        enMaintenance: number;
        indisponibles: number;
        capaciteTotale: number;
        parType: Record<string, number>;
    }> {
        const salles = await this.repo.find({ where: { etablissementId } });

        const stats = {
            total: salles.length,
            disponibles: salles.filter(s => s.disponible).length,
            enMaintenance: salles.filter(s => s.statut === StatutSalle.EN_MAINTENANCE).length,
            indisponibles: salles.filter(s => s.statut === StatutSalle.INDISPONIBLE).length,
            capaciteTotale: salles.reduce((sum, s) => sum + s.capacite, 0),
            parType: {} as Record<string, number>,
        };

        // Compter par type
        salles.forEach(salle => {
            stats.parType[salle.typeSalle] = (stats.parType[salle.typeSalle] || 0) + 1;
        });

        return stats;
    }
}

// Singleton exporté
export const salleService = new SalleService();
