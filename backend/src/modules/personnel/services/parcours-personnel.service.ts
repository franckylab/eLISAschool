/**
 * ==================================
 * eLISAschool - Service Parcours Professionnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Agrège toutes les informations du parcours d'un membre du personnel :
 * contrats, affectations, évaluations, absences, primes, etc.
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MembrePersonnel, ContratPersonnel, AffectationPoste, EvaluationEnseignant, AbsencePersonnel } from '../entities';
import { AppError } from '@common/filters/error.filter';

export interface ParcoursProfessionnel {
    membre: MembrePersonnel;
    contrats: ContratPersonnel[];
    affectations: AffectationPoste[];
    evaluations: EvaluationEnseignant[];
    statistiquesAbsences: {
        total: number;
        justifiees: number;
        nonJustifiees: number;
        retards: number;
    };
    evolutionSalariale: Array<{
        date: Date;
        salaire: number;
        typeContrat: string;
        poste?: string;
    }>;
    anciennete: {
        annees: number;
        mois: number;
        jours: number;
    };
    score: number;
    classement?: number;
}

export class ParcoursPersonnelService {
    private membreRepo: Repository<MembrePersonnel>;
    private contratRepo: Repository<ContratPersonnel>;
    private affectationRepo: Repository<AffectationPoste>;
    private evaluationRepo: Repository<EvaluationEnseignant>;
    private absenceRepo: Repository<AbsencePersonnel>;

    constructor() {
        this.membreRepo = AppDataSource.getRepository(MembrePersonnel);
        this.contratRepo = AppDataSource.getRepository(ContratPersonnel);
        this.affectationRepo = AppDataSource.getRepository(AffectationPoste);
        this.evaluationRepo = AppDataSource.getRepository(EvaluationEnseignant);
        this.absenceRepo = AppDataSource.getRepository(AbsencePersonnel);
    }

    /**
     * Récupérer le parcours professionnel complet d'un membre
     */
    async getParcoursComplet(
        membreId: string,
        etablissementId: string
    ): Promise<ParcoursProfessionnel> {
        // 1. Récupérer le membre
        const membre = await this.membreRepo.findOne({
            where: { id: membreId, etablissementId },
            relations: ['utilisateur', 'typePersonnel'],
        });

        if (!membre) {
            throw new AppError('Membre du personnel non trouvé', 404, 'NOT_FOUND');
        }

        // 2. Récupérer tous les contrats (historique)
        const contrats = await this.contratRepo.find({
            where: { membrePersonnelId: membreId, etablissementId },
            relations: ['typeContratEntity', 'poste', 'uniteOrganisationnelle'],
            order: { dateDebut: 'DESC' },
        });

        // 3. Récupérer toutes les affectations (historique)
        const affectations = await this.affectationRepo.find({
            where: { membrePersonnelId: membreId, etablissementId },
            relations: ['poste', 'uniteOrganisationnelle', 'contrat'],
            order: { dateDebut: 'DESC' },
        });

        // 4. Récupérer les évaluations
        const evaluations = await this.evaluationRepo.find({
            where: { enseignantId: membreId, etablissementId },
            order: { dateEvaluation: 'DESC' },
            take: 50, // Limiter pour performance
        });

        // 5. Statistiques des absences
        const absencesStats = await this.getStatistiquesAbsences(membreId, etablissementId);

        // 6. Calculer l'évolution salariale
        const evolutionSalariale = this.calculerEvolutionSalariale(contrats, affectations);

        // 7. Calculer l'ancienneté
        const anciennete = this.calculerAnciennete(membre.dateEmbauche);

        // 8. Score et classement (optionnel - peut être récupéré du module suivi-personnel)
        const score = 0; // TODO: Intégrer avec scoring-personnel

        return {
            membre,
            contrats,
            affectations,
            evaluations,
            statistiquesAbsences: absencesStats,
            evolutionSalariale,
            anciennete,
            score,
        };
    }

    /**
     * Calculer les statistiques d'absences
     */
    private async getStatistiquesAbsences(
        membreId: string,
        etablissementId: string
    ): Promise<{ total: number; justifiees: number; nonJustifiees: number; retards: number }> {
        const qb = this.absenceRepo
            .createQueryBuilder('a')
            .where('a.membrePersonnelId = :membreId', { membreId })
            .andWhere('a.etablissementId = :etablissementId', { etablissementId });

        const total = await qb.getCount();

        const justifiees = await qb.clone()
            .andWhere('a.statutJustification = :statut', { statut: 'JUSTIFIE' })
            .getCount();

        const nonJustifiees = await qb.clone()
            .andWhere('a.statutJustification = :statut', { statut: 'NON_JUSTIFIE' })
            .getCount();

        const retards = await qb.clone()
            .andWhere('a.type = :type', { type: 'RETARD' })
            .getCount();

        return {
            total,
            justifiees,
            nonJustifiees,
            retards,
        };
    }

    /**
     * Calculer l'évolution salariale à partir des contrats
     */
    private calculerEvolutionSalariale(
        contrats: ContratPersonnel[],
        affectations: AffectationPoste[]
    ): Array<{ date: Date; salaire: number; typeContrat: string; poste?: string }> {
        const evolution = contrats.map(contrat => {
            const affectation = affectations.find(a => a.contratId === contrat.id);
            return {
                date: contrat.dateDebut,
                salaire: Number(contrat.salaireBase),
                typeContrat: contrat.typeContrat,
                poste: affectation?.poste?.intitulé,
            };
        });

        // Trier par date décroissante
        return evolution.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    /**
     * Calculer l'ancienneté depuis la date d'embauche
     */
    private calculerAnciennete(dateEmbauche: Date): { annees: number; mois: number; jours: number } {
        const maintenant = new Date();
        const diff = maintenant.getTime() - dateEmbauche.getTime();

        const joursTotal = Math.floor(diff / (1000 * 60 * 60 * 24));
        const annees = Math.floor(joursTotal / 365.25);
        const mois = Math.floor((joursTotal % 365.25) / 30.44);
        const jours = Math.floor(joursTotal % 30.44);

        return {
            annees,
            mois,
            jours,
        };
    }

    /**
     * Récupérer un résumé rapide du parcours (pour listes)
     */
    async getResumeParcours(
        membreId: string,
        etablissementId: string
    ): Promise<{
        nombreContrats: number;
        nombreAffectations: number;
        ancienneteAnnees: number;
        salaireActuel?: number;
        posteActuel?: string;
    }> {
        const membre = await this.membreRepo.findOne({
            where: { id: membreId, etablissementId },
        });

        if (!membre) {
            throw new AppError('Membre du personnel non trouvé', 404, 'NOT_FOUND');
        }

        const [nombreContrats, nombreAffectations] = await Promise.all([
            this.contratRepo.count({ where: { membrePersonnelId: membreId, etablissementId } }),
            this.affectationRepo.count({ where: { membrePersonnelId: membreId, etablissementId } }),
        ]);

        const contratActif = await this.contratRepo.findOne({
            where: { membrePersonnelId: membreId, etablissementId, statut: 'ACTIF' },
            select: ['salaireBase'],
        });

        const affectationActive = await this.affectationRepo.findOne({
            where: { membrePersonnelId: membreId, etablissementId, statut: 'ACTIF' },
            relations: ['poste'],
        });

        const anciennete = this.calculerAnciennete(membre.dateEmbauche);

        return {
            nombreContrats,
            nombreAffectations,
            ancienneteAnnees: anciennete.annees,
            salaireActuel: contratActif ? Number(contratActif.salaireBase) : undefined,
            posteActuel: affectationActive?.poste?.intitulé,
        };
    }
}

export const parcoursPersonnelService = new ParcoursPersonnelService();
