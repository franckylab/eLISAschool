import { Repository, LessThan, MoreThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Salle, StatutSalle } from '../entities';
import { CreneauHoraire } from '@modules/emploi-du-temps/entities';
import { HeureCours } from '@modules/personnel/entities';
import { logger } from '@common/utils/logger.util';

export interface ConflitSalle {
    source: 'creneau_horaire' | 'heure_cours';
    id: string;
    date?: Date;
    jour?: string;
    heureDebut: string;
    heureFin: string;
    details?: Record<string, unknown>;
}

export class SalleAvailabilityService {
    private salleRepo: Repository<Salle>;
    private edtRepo: Repository<CreneauHoraire>;
    private heureCoursRepo: Repository<HeureCours>;

    constructor() {
        this.salleRepo = AppDataSource.getRepository(Salle);
        this.edtRepo = AppDataSource.getRepository(CreneauHoraire);
        this.heureCoursRepo = AppDataSource.getRepository(HeureCours);
    }

    async verifierDisponibilite(
        salleId: string,
        etablissementId: string,
        options: {
            jour?: string;
            date?: Date;
            heureDebut: string;
            heureFin: string;
            anneeScolaireId?: string;
            excludeEmploiId?: string;
            excludeHeureCoursId?: string;
        }
    ): Promise<{ disponible: boolean; conflits: ConflitSalle[] }> {
        const salle = await this.salleRepo.findOne({
            where: { id: salleId, etablissementId },
        });

        if (!salle) {
            return {
                disponible: false,
                conflits: [{ source: 'creneau_horaire', id: '', heureDebut: '', heureFin: '', details: { reason: 'NOT_FOUND' } }],
            };
        }

        if (!salle.disponible || salle.statut !== StatutSalle.DISPONIBLE) {
            return {
                disponible: false,
                conflits: [{ source: 'creneau_horaire', id: '', heureDebut: '', heureFin: '', details: { reason: salle.statut } }],
            };
        }

        const conflits: ConflitSalle[] = [];

        const conflitsEDT = await this.verifierConflitsEDT(salleId, options);
        conflits.push(...conflitsEDT);

        if (options.date) {
            const conflitsHC = await this.verifierConflitsHeureCours(salleId, { ...options, date: options.date });
            conflits.push(...conflitsHC);
        }

        return { disponible: conflits.length === 0, conflits };
    }

    private async verifierConflitsEDT(
        salleId: string,
        options: {
            jour?: string;
            heureDebut: string;
            heureFin: string;
            anneeScolaireId?: string;
            excludeEmploiId?: string;
        }
    ): Promise<ConflitSalle[]> {
        if (!options.jour) return [];

        const where: any = {
            salleId,
            jour: options.jour,
        };

        if (options.anneeScolaireId) {
            where.anneeScolaireId = options.anneeScolaireId;
        }

        const creneaux = await this.edtRepo.find({ where });

        return creneaux
            .filter(c => c.id !== options.excludeEmploiId)
            .filter(c => options.heureDebut < c.heureFin && options.heureFin > c.heureDebut)
            .map(c => ({
                source: 'creneau_horaire' as const,
                id: c.id,
                jour: c.jour,
                heureDebut: c.heureDebut,
                heureFin: c.heureFin,
            }));
    }

    private async verifierConflitsHeureCours(
        salleId: string,
        options: {
            date: Date;
            heureDebut: string;
            heureFin: string;
            excludeHeureCoursId?: string;
        }
    ): Promise<ConflitSalle[]> {
        const cours = await this.heureCoursRepo.find({
            where: {
                salleId,
                date: options.date as any,
                heureDebut: LessThan(options.heureFin) as any,
                heureFin: MoreThan(options.heureDebut) as any,
            },
        });

        return cours
            .filter(c => c.id !== options.excludeHeureCoursId)
            .map(c => ({
                source: 'heure_cours' as const,
                id: c.id,
                date: c.date,
                heureDebut: c.heureDebut,
                heureFin: c.heureFin,
                details: { matiereId: c.matiereId, classeAnneeId: c.classeAnneeId },
            }));
    }

    async trouverSallesDisponibles(
        etablissementId: string,
        options: {
            jour: string;
            heureDebut: string;
            heureFin: string;
            anneeScolaireId?: string;
            capaciteMin?: number;
            typeSalle?: string;
            date?: Date;
        }
    ): Promise<Salle[]> {
        const where: any = {
            etablissementId,
            disponible: true,
            statut: StatutSalle.DISPONIBLE,
        };

        if (options.capaciteMin) {
            where.capacite = MoreThan(options.capaciteMin - 1) as any;
        }

        if (options.typeSalle) {
            where.typeSalle = options.typeSalle;
        }

        const salles = await this.salleRepo.find({ where, order: { capacite: 'DESC' } });

        const disponibles: Salle[] = [];
        for (const salle of salles) {
            const { disponible } = await this.verifierDisponibilite(salle.id, etablissementId, {
                jour: options.jour,
                heureDebut: options.heureDebut,
                heureFin: options.heureFin,
                anneeScolaireId: options.anneeScolaireId,
                date: options.date,
            });
            if (disponible) {
                disponibles.push(salle);
            }
        }

        return disponibles;
    }
}

export const salleAvailabilityService = new SalleAvailabilityService();
