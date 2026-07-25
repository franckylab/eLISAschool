/**
 * eLISAschool - Module Personnel/RH
 * Service pour le dashboard et les statistiques du personnel
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { MembrePersonnel } from '../entities/personnel.entity';
import { ContratPersonnel } from '../entities/contrat-personnel.entity';
import { AbsencePersonnel } from '../entities/absence-personnel.entity';
import { BulletinPaie } from '@modules/paie/entities/bulletin-paie.entity';
import { EvaluationEnseignant } from '../entities/evaluation-enseignant.entity';
import { ProgressionProgramme } from '../entities/progression-programme.entity';

export class PersonnelDashboardService {
    private membreRepo: Repository<MembrePersonnel>;
    private contratRepo: Repository<ContratPersonnel>;
    private absenceRepo: Repository<AbsencePersonnel>;
    private bulletinRepo: Repository<BulletinPaie>;
    private evaluationRepo: Repository<EvaluationEnseignant>;
    private progressionRepo: Repository<ProgressionProgramme>;

    constructor() {
        this.membreRepo = AppDataSource.getRepository(MembrePersonnel);
        this.contratRepo = AppDataSource.getRepository(ContratPersonnel);
        this.absenceRepo = AppDataSource.getRepository(AbsencePersonnel);
        this.bulletinRepo = AppDataSource.getRepository(BulletinPaie);
        this.evaluationRepo = AppDataSource.getRepository(EvaluationEnseignant);
        this.progressionRepo = AppDataSource.getRepository(ProgressionProgramme);
    }

    async getDashboardRH(etablissementId: string) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Total personnel par catégorie de fonction (dérivée, jamais stockée)
        const totalPersonnelRaw: { categorie: string | null; count: string }[] = await this.membreRepo.query(`
            SELECT COALESCE(mf_cat.categorie, ap_cat.categorie, 'AUTRE') AS categorie, COUNT(*)::int AS count
            FROM membres_personnel p
            LEFT JOIN LATERAL (
                SELECT f.categorie FROM membres_fonctions mf
                JOIN fonctions f ON f.id = mf."fonctionId"
                WHERE mf."membrePersonnelId" = p.id
                  AND (mf."dateFin" IS NULL OR mf."dateFin" >= CURRENT_DATE)
                ORDER BY mf."estPrincipale" DESC, mf."dateDebut" DESC LIMIT 1
            ) mf_cat ON true
            LEFT JOIN LATERAL (
                SELECT f2.categorie FROM affectations_postes ap
                JOIN postes po ON po.id = ap."posteId"
                JOIN fonctions f2 ON f2.id = po."fonctionId"
                WHERE ap."membrePersonnelId" = p.id AND ap.statut = 'ACTIF'
                ORDER BY ap."dateDebut" DESC LIMIT 1
            ) ap_cat ON true
            WHERE p."etablissementId" = $1
            GROUP BY 1
        `, [etablissementId]);

        const totalPersonnel: Record<string, number> = {};
        totalPersonnelRaw.forEach((r) => {
            totalPersonnel[r.categorie ?? 'AUTRE'] = parseInt(r.count as unknown as string, 10);
        });

        // Contrats expirant dans les 30 prochains jours
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() + 30);

        const contratsExpirantBientot = await this.contratRepo
            .createQueryBuilder('contrat')
            .where('contrat.etablissementId = :etablissementId', { etablissementId })
            .andWhere('contrat.dateFin BETWEEN :now AND :dateLimite', {
                now: now.toISOString().split('T')[0],
                dateLimite: dateLimite.toISOString().split('T')[0],
            })
            .getCount();

        // Absences ce mois
        const absencesCeMois = await this.absenceRepo
            .createQueryBuilder('absence')
            .where('absence.etablissementId = :etablissementId', { etablissementId })
            .andWhere('EXTRACT(MONTH FROM absence.date) = :mois', { mois: currentMonth })
            .andWhere('EXTRACT(YEAR FROM absence.date) = :annee', { annee: currentYear })
            .getCount();

        // Taux d'absence ce mois
        const totalJoursOuvrables = this.getJoursOuvrablesMois(currentMonth, currentYear);
        const totalPersonnelCount = Object.values(totalPersonnel).reduce((sum, count) => sum + count, 0);
        const tauxAbsence = totalPersonnelCount > 0 && totalJoursOuvrables > 0
            ? (absencesCeMois / (totalPersonnelCount * totalJoursOuvrables)) * 100
            : 0;

        // Heures de cours ce mois (via absences - simplifié)
        const heuresCoursCeMois = await this.absenceRepo
            .createQueryBuilder('absence')
            .where('absence.etablissementId = :etablissementId', { etablissementId })
            .andWhere('EXTRACT(MONTH FROM absence.date) = :mois', { mois: currentMonth })
            .andWhere('EXTRACT(YEAR FROM absence.date) = :annee', { annee: currentYear })
            .andWhere('absence.type != :retard', { retard: 'RETARD' })
            .getCount();

        // Masse salariale du mois
        const masseSalariale = await this.bulletinRepo
            .createQueryBuilder('bulletin')
            .where('bulletin.etablissementId = :etablissementId', { etablissementId })
            .andWhere('bulletin.mois = :mois', { mois: currentMonth })
            .andWhere('bulletin.annee = :annee', { annee: currentYear })
            .select('SUM(bulletin.salaireNet)', 'total')
            .getRawOne();

        // Évaluations en retard (pas d'évaluation depuis 3 mois)
        const dateLimiteEval = new Date();
        dateLimiteEval.setMonth(dateLimiteEval.getMonth() - 3);

        const evaluationsEnRetard = await this.membreRepo
            .createQueryBuilder('membre')
            .where('membre.etablissementId = :etablissementId', { etablissementId })
            .andWhere(`EXISTS (
                SELECT 1 FROM membres_fonctions mf
                JOIN fonctions f ON f.id = mf."fonctionId"
                WHERE mf."membrePersonnelId" = membre.id
                  AND (mf."dateFin" IS NULL OR mf."dateFin" >= CURRENT_DATE)
                  AND f.categorie = :catEnseignant
                UNION
                SELECT 1 FROM affectations_postes ap
                JOIN postes po ON po.id = ap."posteId"
                JOIN fonctions f2 ON f2.id = po."fonctionId"
                WHERE ap."membrePersonnelId" = membre.id
                  AND ap.statut = 'ACTIF'
                  AND f2.categorie = :catEnseignant
            )`, { catEnseignant: 'ENSEIGNANT' })
            .andWhere((qb) => {
                const subQuery = qb.subQuery()
                    .from(EvaluationEnseignant, 'eval')
                    .where('eval.enseignantId = membre.id')
                    .andWhere('eval.dateEvaluation >= :dateLimite', { dateLimite: dateLimiteEval.toISOString().split('T')[0] })
                    .getQuery();
                return `NOT EXISTS ${subQuery}`;
            })
            .getCount();

        // Alertes progression
        const alertesProgression = await this.progressionRepo
            .createQueryBuilder('progression')
            .where('progression.etablissementId = :etablissementId', { etablissementId })
            .andWhere('progression.pourcentageRealise < :seuil', { seuil: 50 })
            .getCount();

        return {
            totalPersonnel,
            contratsExpirantBientot,
            absencesCeMois,
            tauxAbsence: Math.round(tauxAbsence * 100) / 100,
            heuresCoursCeMois,
            masseSalarialeMois: parseFloat(masseSalariale.total) || 0,
            evaluationsEnRetard,
            alertesProgression,
        };
    }

    async getStatistiquesEnseignant(enseignantId: string, etablissementId: string) {
        // Heures moyennes hebdomadaires (via absences - approximation)
        const now = new Date();
        const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateFin = now;

        const absences = await this.absenceRepo
            .createQueryBuilder('absence')
            .where('absence.membrePersonnelId = :enseignantId', { enseignantId })
            .andWhere('absence.etablissementId = :etablissementId', { etablissementId })
            .andWhere('absence.date BETWEEN :dateDebut AND :dateFin', {
                dateDebut: dateDebut.toISOString().split('T')[0],
                dateFin: dateFin.toISOString().split('T')[0],
            })
            .getCount();

        const joursOuvrables = this.getJoursOuvrablesPeriode(dateDebut, dateFin);
        const joursPresence = Math.max(0, joursOuvrables - absences);
        const heuresMoyHebdo = joursPresence > 0 ? (joursPresence * 6) / 4 : 0; // Approximation 6h/jour

        // Taux de présence
        const tauxPresence = joursOuvrables > 0 ? (joursPresence / joursOuvrables) * 100 : 100;

        // Moyenne des évaluations
        const moyenneEval = await this.evaluationRepo
            .createQueryBuilder('evaluation')
            .where('evaluation.enseignantId = :enseignantId', { enseignantId })
            .andWhere('evaluation.etablissementId = :etablissementId', { etablissementId })
            .select('AVG(evaluation.note)', 'moyenne')
            .addSelect('COUNT(evaluation.id)', 'count')
            .getRawOne();

        // Progression des programmes
        const progressions = await this.progressionRepo
            .createQueryBuilder('progression')
            .where('progression.enseignantId = :enseignantId', { enseignantId })
            .andWhere('progression.etablissementId = :etablissementId', { etablissementId })
            .getMany();

        const moyenneProgression = progressions.length > 0
            ? (progressions.reduce((sum, p) => sum + Number(p.pourcentageRealise), 0) / progressions.length).toFixed(2)
            : 0;

        return {
            heuresMoyHebdo: Math.round(heuresMoyHebdo * 100) / 100,
            tauxPresence: Math.round(tauxPresence * 100) / 100,
            moyenneEvaluations: moyenneEval.moyenne ? parseFloat(moyenneEval.moyenne).toFixed(2) : null,
            nombreEvaluations: moyenneEval.count ? parseInt(moyenneEval.count) : 0,
            moyenneProgression: moyenneProgression ? parseFloat(moyenneProgression as string) : 0,
            nombreProgressions: progressions.length,
        };
    }

    private getJoursOuvrablesMois(mois: number, annee: number): number {
        const dateDebut = new Date(annee, mois - 1, 1);
        const dateFin = new Date(annee, mois, 0);
        return this.getJoursOuvrablesPeriode(dateDebut, dateFin);
    }

    private getJoursOuvrablesPeriode(dateDebut: Date, dateFin: Date): number {
        let jours = 0;
        let current = new Date(dateDebut);

        while (current <= dateFin) {
            const jourSemaine = current.getDay();
            if (jourSemaine !== 0 && jourSemaine !== 6) {
                jours++;
            }
            current.setDate(current.getDate() + 1);
        }

        return jours;
    }
}

export const personnelDashboardService = new PersonnelDashboardService();
