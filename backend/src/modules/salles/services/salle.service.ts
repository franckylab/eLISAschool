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
import { ClasseAnnee } from '@modules/classes/entities';
import { CreateSalleDto, UpdateSalleDto, QuerySallesDto } from '../dto';
import { CreneauHoraire } from '@modules/emploi-du-temps/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';
import { salleAvailabilityService } from './salle-availability.service';

export class SalleService {
    private repo: Repository<Salle>;

    constructor() {
        this.repo = AppDataSource.getRepository(Salle);
    }

    /**
     * Crée une nouvelle salle
     */
    async create(dto: CreateSalleDto, etablissementId: string, utilisateurId?: string): Promise<Salle> {
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

        await auditService.log({
            utilisateurId,
            action: AuditAction.SALLE_CREATE,
            cible: 'Salle',
            cibleId: saved.id,
            description: `Création de la salle ${saved.nom} (${saved.code})`,
            nouvellesValeurs: { ...dto },
            module: 'salles',
            metadata: { entiteLabel: saved.nom, entiteRef: saved.code },
        });

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
    async update(id: string, dto: UpdateSalleDto, etablissementId: string, utilisateurId?: string): Promise<Salle> {
        const salle = await this.findOne(id, etablissementId);

        // Si réduction de capacité, vérifier les classes impactées
        if (dto.capacite !== undefined && dto.capacite < salle.capacite) {
            const nouvelleCapacite = dto.capacite;
            const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
            const classesLiees = await classeAnneeRepo.find({
                where: { sallePrincipaleId: id, actif: true },
                relations: ['classe'],
            });

            const classesBloquees = classesLiees.filter(ca => ca.effectifActuel > nouvelleCapacite);
            if (classesBloquees.length > 0) {
                const noms = classesBloquees.map(ca => ca.classe?.nom || ca.classeId).join(', ');
                throw new AppError(
                    `Impossible de réduire la capacité à ${nouvelleCapacite} : ${classesBloquees.length} classe(s) ont déjà plus d'élèves (${noms})`,
                    400,
                    'SALLE_CAPACITE_REDUCTION_BLOCKED'
                );
            }

            const classesAlertees = classesLiees.filter(
                ca => ca.effectifMax > nouvelleCapacite && ca.effectifActuel <= nouvelleCapacite
            );
            if (classesAlertees.length > 0) {
                const noms = classesAlertees.map(ca => `${ca.classe?.nom || ca.classeId} (effectifMax: ${ca.effectifMax} → ${nouvelleCapacite})`).join(', ');
                logger.warn(`[${etablissementId}] Réduction capacité salle ${salle.nom}: effectifMax réduit pour ${classesAlertees.length} classe(s): ${noms}`);

                for (const ca of classesAlertees) {
                    ca.effectifMax = nouvelleCapacite;
                    await classeAnneeRepo.save(ca);
                }
            }
        }

        // Si on modifie le statut, mettre à jour disponible en conséquence
        if (dto.statut === StatutSalle.EN_MAINTENANCE || dto.statut === StatutSalle.INDISPONIBLE) {
            dto.disponible = false;
        } else if (dto.statut === StatutSalle.DISPONIBLE) {
            dto.disponible = true;
        }

        const anciennesValeurs: Record<string, unknown> = {};
        for (const key of Object.keys(dto)) {
            anciennesValeurs[key] = (salle as unknown as Record<string, unknown>)[key];
        }

        Object.assign(salle, dto);
        const updated = await this.repo.save(salle);
        logger.info(`Salle modifiée: ${updated.nom}`, { etablissementId, salleId: updated.id });

        await auditService.log({
            utilisateurId,
            action: AuditAction.SALLE_UPDATE,
            cible: 'Salle',
            cibleId: updated.id,
            description: `Modification de la salle ${updated.nom} (${updated.code})`,
            anciennesValeurs,
            nouvellesValeurs: { ...dto },
            module: 'salles',
            metadata: { entiteLabel: updated.nom, entiteRef: updated.code },
        });

        return updated;
    }

    /**
     * Supprime une salle
     */
    async delete(id: string, etablissementId: string, utilisateurId?: string): Promise<void> {
        const salle = await this.findOne(id, etablissementId);
        const nom = salle.nom;
        const code = salle.code;
        await this.repo.remove(salle);
        logger.info(`Salle supprimée: ${nom}`, { etablissementId, salleId: id });

        await auditService.log({
            utilisateurId,
            action: AuditAction.SALLE_DELETE,
            cible: 'Salle',
            cibleId: id,
            description: `Suppression de la salle ${nom} (${code})`,
            anciennesValeurs: { nom, code },
            module: 'salles',
            metadata: { entiteLabel: nom, entiteRef: code },
        });
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
     * Statistiques détaillées d'une salle spécifique
     */
    async getSalleStats(salleId: string, etablissementId: string, anneeScolaireId?: string): Promise<{
        tauxOccupation: number;
        totalCreneauxSemaine: number;
        creneauxOccupes: number;
        occupationParJour: Record<string, number>;
        heuresReservees: number;
        classesLiees: number;
    }> {
        await this.findOne(salleId, etablissementId);

        const emploiRepo = AppDataSource.getRepository(CreneauHoraire);
        const where: any = { salleId };
        if (anneeScolaireId) where.anneeScolaireId = anneeScolaireId;

        const creneaux = await emploiRepo.find({ where });

        // Jours/heures ouvrés standards
        const JOURS_SEMAINE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
        const HEURE_DEBUT = 7;
        const HEURE_FIN = 18;
        const totalSlots = JOURS_SEMAINE.length * (HEURE_FIN - HEURE_DEBUT);

        const occupationParJour: Record<string, number> = {};
        JOURS_SEMAINE.forEach(j => occupationParJour[j] = 0);

        let heuresReservees = 0;

        for (const c of creneaux) {
            const [hD] = c.heureDebut.split(':').map(Number);
            const [hF] = c.heureFin.split(':').map(Number);
            const duree = Math.max(0, hF - hD);
            heuresReservees += duree;

            if (occupationParJour[c.jour] !== undefined) {
                occupationParJour[c.jour] += duree;
            }
        }

        const tauxOccupation = totalSlots > 0 ? Math.round((heuresReservees / totalSlots) * 100) : 0;

        // Compter les classes liées
        const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
        const classesLiees = await classeAnneeRepo.count({
            where: { sallePrincipaleId: salleId, actif: true },
        });

        return {
            tauxOccupation,
            totalCreneauxSemaine: totalSlots,
            creneauxOccupes: creneaux.length,
            occupationParJour,
            heuresReservees,
            classesLiees,
        };
    }

    /**
     * Récupère les classes liées à une salle
     */
    async getClassesBySalle(salleId: string, etablissementId: string): Promise<ClasseAnnee[]> {
        await this.findOne(salleId, etablissementId);

        const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
        return classeAnneeRepo.find({
            where: { sallePrincipaleId: salleId, actif: true },
            relations: ['classe', 'anneeScolaire', 'professeurPrincipal'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Statistiques globales des salles
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
