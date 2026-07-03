/**
 * ==================================
 * eLISAschool - Service Validation Conflits Emploi du Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service de détection et validation des conflits dans l'emploi du temps
 * Vérifie les conflits d'enseignants, salles, classes et indisponibilités
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { HeureCours, IndisponibiliteEnseignant } from '@modules/personnel/entities';
import { RepartitionHoraire } from '../entities';
import { salleAvailabilityService } from '@modules/salles/services/salle-availability.service';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export interface ConflitDetection {
    type: 'ENSEIGNANT' | 'SALLE' | 'CLASSE' | 'INDISPONIBILITE' | 'SURCHARGE';
    severity: 'ERROR' | 'WARNING';
    message: string;
    conflictingIds?: string[];
    details?: any;
}

export class EmploiDuTempsValidatorService {
    private heureCoursRepo: Repository<HeureCours>;
    private indisponibiliteRepo: Repository<IndisponibiliteEnseignant>;
    private repartitionRepo: Repository<RepartitionHoraire>;

    constructor() {
        this.heureCoursRepo = AppDataSource.getRepository(HeureCours);
        this.indisponibiliteRepo = AppDataSource.getRepository(IndisponibiliteEnseignant);
        this.repartitionRepo = AppDataSource.getRepository(RepartitionHoraire);
    }

    /**
     * Vérifier tous les conflits pour un nouveau cours
     */
    async verifierConflits(
        enseignantId: string,
        classeId: string,
        salleId: string | null,
        date: Date,
        heureDebut: string,
        heureFin: string,
        etablissementId: string
    ): Promise<ConflitDetection[]> {
        const conflits: ConflitDetection[] = [];

        // 1. Conflit enseignant (même créneau)
        const conflitEnseignant = await this.verifierConflitEnseignant(
            enseignantId, date, heureDebut, heureFin, etablissementId
        );
        if (conflitEnseignant) {
            conflits.push(conflitEnseignant);
        }

        // 2. Conflit salle (même créneau)
        if (salleId) {
            const conflitSalle = await this.verifierConflitSalle(
                salleId, date, heureDebut, heureFin, etablissementId
            );
            if (conflitSalle) {
                conflits.push(conflitSalle);
            }
        }

        // 3. Conflit classe (même créneau)
        const conflitClasse = await this.verifierConflitClasse(
            classeId, date, heureDebut, heureFin, etablissementId
        );
        if (conflitClasse) {
            conflits.push(conflitClasse);
        }

        // 4. Indisponibilité enseignant
        const conflitIndisponibilite = await this.verifierIndisponibilite(
            enseignantId, date, heureDebut, heureFin, etablissementId
        );
        if (conflitIndisponibilite) {
            conflits.push(conflitIndisponibilite);
        }

        // 5. Surcharge enseignant (heures max/semaine)
        const surcharge = await this.verifierSurchargeEnseignant(
            enseignantId, date, etablissementId
        );
        if (surcharge) {
            conflits.push(surcharge);
        }

        return conflits;
    }

    /**
     * Vérifier conflit enseignant
     */
    private async verifierConflitEnseignant(
        enseignantId: string,
        date: Date,
        heureDebut: string,
        heureFin: string,
        etablissementId: string
    ): Promise<ConflitDetection | null> {
        const conflit = await this.heureCoursRepo.findOne({
            where: {
                enseignantId,
                date,
                etablissementId,
                heureDebut: this.lessThan(heureFin),
                heureFin: this.moreThan(heureDebut),
            },
        });

        if (conflit) {
            return {
                type: 'ENSEIGNANT',
                severity: 'ERROR',
                message: `L'enseignant a déjà un cours de ${conflit.heureDebut} à ${conflit.heureFin} ce jour`,
                conflictingIds: [conflit.id],
                details: {
                    matiere: conflit.matiereId,
                    classe: conflit.classeId,
                },
            };
        }

        return null;
    }

    /**
     * Vérifier conflit salle
     * Utilise le service transverse pour couvrir EDT + HeureCours
     */
    private async verifierConflitSalle(
        salleId: string,
        date: Date,
        heureDebut: string,
        heureFin: string,
        etablissementId: string
    ): Promise<ConflitDetection | null> {
        const { disponible, conflits } = await salleAvailabilityService.verifierDisponibilite(
            salleId,
            etablissementId,
            { date, heureDebut, heureFin }
        );

        if (disponible) return null;

        const conflit = conflits[0];
        if (!conflit) return null;

        return {
            type: 'SALLE',
            severity: 'ERROR',
            message: `La salle est déjà occupée de ${conflit.heureDebut} à ${conflit.heureFin}`,
            conflictingIds: [conflit.id],
            details: {
                source: conflit.source,
                ...conflit.details,
            },
        };
    }

    /**
     * Vérifier conflit classe
     */
    private async verifierConflitClasse(
        classeId: string,
        date: Date,
        heureDebut: string,
        heureFin: string,
        etablissementId: string
    ): Promise<ConflitDetection | null> {
        const conflit = await this.heureCoursRepo.findOne({
            where: {
                classeId,
                date,
                etablissementId,
                heureDebut: this.lessThan(heureFin),
                heureFin: this.moreThan(heureDebut),
            },
        });

        if (conflit) {
            return {
                type: 'CLASSE',
                severity: 'ERROR',
                message: `La classe a déjà un cours de ${conflit.heureDebut} à ${conflit.heureFin}`,
                conflictingIds: [conflit.id],
                details: {
                    enseignant: conflit.enseignantId,
                    matiere: conflit.matiereId,
                },
            };
        }

        return null;
    }

    /**
     * Vérifier indisponibilité enseignant
     */
    private async verifierIndisponibilite(
        enseignantId: string,
        date: Date,
        heureDebut: string,
        heureFin: string,
        etablissementId: string
    ): Promise<ConflitDetection | null> {
        const indisponibilites = await this.indisponibiliteRepo.find({
            where: {
                enseignantId,
                etablissementId,
                dateDebut: this.lessThanOrEqual(date),
                dateFin: this.moreThanOrEqual(date),
            },
        });

        for (const indispo of indisponibilites) {
            // Vérifier si c'est une indisponibilité horaire
            if (indispo.heureDebut && indispo.heureFin) {
                if (this.heuresOverlap(heureDebut, heureFin, indispo.heureDebut, indispo.heureFin)) {
                    return {
                        type: 'INDISPONIBILITE',
                        severity: 'ERROR',
                        message: `Enseignant indisponible: ${indispo.motif}`,
                        details: {
                            type: indispo.typeIndisponibilite,
                            motif: indispo.motif,
                        },
                    };
                }
            } else {
                // Indisponibilité toute la journée
                return {
                    type: 'INDISPONIBILITE',
                    severity: 'ERROR',
                    message: `Enseignant indisponible toute la journée: ${indispo.motif}`,
                    details: {
                        type: indispo.typeIndisponibilite,
                        motif: indispo.motif,
                    },
                };
            }
        }

        return null;
    }

    /**
     * Vérifier surcharge enseignant
     */
    private async verifierSurchargeEnseignant(
        enseignantId: string,
        date: Date,
        etablissementId: string
    ): Promise<ConflitDetection | null> {
        // Calculer les heures de la semaine
        const startOfWeek = this.getStartOfWeek(date);
        const endOfWeek = this.getEndOfWeek(date);

        const heuresSemaine = await this.heureCoursRepo
            .createQueryBuilder('hc')
            .select('SUM(EXTRACT(EPOCH FROM (hc."heureFin"::time - hc."heureDebut"::time)) / 3600)', 'totalHeures')
            .where('hc."enseignantId" = :enseignantId', { enseignantId })
            .andWhere('hc.date >= :startOfWeek', { startOfWeek })
            .andWhere('hc.date <= :endOfWeek', { endOfWeek })
            .andWhere('hc.etablissementId = :etablissementId', { etablissementId })
            .getRawOne();

        const totalHeures = parseFloat(heuresSemaine?.totalHeures || '0');

        // Limite typique: 20h/semaine pour un enseignant
        if (totalHeures >= 20) {
            return {
                type: 'SURCHARGE',
                severity: 'WARNING',
                message: `Enseignant surchargé: ${totalHeures}h cette semaine (max recommandé: 20h)`,
                details: {
                    heuresActuelles: totalHeures,
                    heuresMax: 20,
                },
            };
        }

        return null;
    }

    /**
     * Valider un cours (lancer exception si conflits ERROR)
     */
    async validerCours(
        enseignantId: string,
        classeId: string,
        salleId: string | null,
        date: Date,
        heureDebut: string,
        heureFin: string,
        etablissementId: string
    ): Promise<void> {
        const conflits = await this.verifierConflits(
            enseignantId, classeId, salleId, date, heureDebut, heureFin, etablissementId
        );

        const erreurs = conflits.filter(c => c.severity === 'ERROR');
        if (erreurs.length > 0) {
            const messages = erreurs.map(e => e.message).join('; ');
            const error = new AppError(
                `Conflits détectés: ${messages}`,
                409,
                'CONFLITS_EMPLOI_DU_TEMPS'
            );
            (error as any).details = { conflits: erreurs };
            throw error;
        }

        // Logger les warnings
        const warnings = conflits.filter(c => c.severity === 'WARNING');
        if (warnings.length > 0) {
            logger.warn(`Warnings emploi du temps: ${warnings.map(w => w.message).join('; ')}`);
        }
    }

    // ==================================
    // Helpers
    // ==================================

    private lessThan(value: string): any {
        return { $lt: value };
    }

    private moreThan(value: string): any {
        return { $gt: value };
    }

    private lessThanOrEqual(value: Date): any {
        return { $lte: value };
    }

    private moreThanOrEqual(value: Date): any {
        return { $gte: value };
    }

    private heuresOverlap(
        debut1: string, fin1: string, debut2: string, fin2: string
    ): boolean {
        return debut1 < fin2 && fin1 > debut2;
    }

    private getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
        return new Date(d.setDate(diff));
    }

    private getEndOfWeek(date: Date): Date {
        const start = this.getStartOfWeek(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6); // Dimanche
        return end;
    }
}

// Singleton export
export const emploiDuTempsValidatorService = new EmploiDuTempsValidatorService();
