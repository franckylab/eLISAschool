/**
 * ==================================
 * eLISAschool - Service Rapports de Validation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service de génération de rapports de validation exportables
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { WorkflowValidation, StatutWorkflow, ValidationNiveau } from '../entities';
import { RapportValidation, DetailValidateur } from '../dto/validation-rapport.dto';
import { logger } from '@common/utils/logger.util';

/**
 * Service de génération de rapports de validation
 */
export class ValidationRapportService {
    private workflowRepo: Repository<WorkflowValidation>;

    constructor() {
        this.workflowRepo = AppDataSource.getRepository(WorkflowValidation);
    }

    /**
     * Génère un rapport synthétique de validation
     */
    async generateRapport(filters: {
        module?: string;
        periodeDebut: Date;
        periodeFin: Date;
        validateurId?: string;
        etablissementId?: string;
    }): Promise<RapportValidation> {
        logger.info(`[ValidationRapport] Génération rapport: module=${filters.module || 'Tous'}, periode=${filters.periodeDebut} - ${filters.periodeFin}`);

        // Requête avec filtres
        const qb = this.workflowRepo.createQueryBuilder('w')
            .where('w."createdAt" >= :debut', { debut: filters.periodeDebut })
            .andWhere('w."createdAt" <= :fin', { fin: filters.periodeFin });

        if (filters.module) {
            qb.andWhere('w.module = :module', { module: filters.module });
        }
        if (filters.etablissementId) {
            qb.andWhere('w.etablissementId = :etablissementId', { etablissementId: filters.etablissementId });
        }

        const workflows = await qb.getMany();

        // Filtrer par validateur si spécifié (dans l'historique)
        let workflowsFiltered = workflows;
        if (filters.validateurId) {
            workflowsFiltered = workflows.filter(w => {
                const historique = w.historique as ValidationNiveau[] | undefined;
                return historique?.some(h => h.validateurId === filters.validateurId);
            });
        }

        // Calculer statistiques
        const stats = {
            total: workflowsFiltered.length,
            enCours: workflowsFiltered.filter(w => w.statut === StatutWorkflow.EN_COURS).length,
            completees: workflowsFiltered.filter(w => w.statut === StatutWorkflow.COMPLETEE).length,
            rejetees: workflowsFiltered.filter(w => w.statut === StatutWorkflow.REJETEE).length,
            tauxCompletion: 0,
            tempsMoyenHeures: 0,
        };

        if (stats.total > 0) {
            stats.tauxCompletion = Math.round((stats.completees / stats.total) * 100);
        }

        // Calculer temps moyen pour les workflows complétés
        const completees = workflowsFiltered.filter(
            w => w.statut === StatutWorkflow.COMPLETEE && w.dateCompletion
        );
        if (completees.length > 0) {
            const totalHeures = completees.reduce((sum, w) => {
                const heures = (w.dateCompletion!.getTime() - w.createdAt.getTime()) / 3600000;
                return sum + heures;
            }, 0);
            stats.tempsMoyenHeures = Math.round(totalHeures / completees.length);
        }

        // Détails par validateur
        const details = this.calculateDetailsByValidateur(workflowsFiltered);

        return {
            periode: {
                debut: filters.periodeDebut,
                fin: filters.periodeFin,
                label: this.formatPeriode(filters.periodeDebut, filters.periodeFin),
            },
            module: filters.module || 'Tous',
            statistiques: stats,
            details,
            generePar: 'Système eLISAschool',
            genereAt: new Date(),
        };
    }

    /**
     * Exporte un rapport en format CSV
     */
    async exportCSV(rapport: RapportValidation): Promise<string> {
        const lines: string[] = [];

        // En-tête
        lines.push('Rapport de Validation');
        lines.push(`Période,${rapport.periode.label}`);
        lines.push(`Module,${rapport.module}`);
        lines.push(`Généré le,${rapport.genereAt.toLocaleDateString('fr-FR')}`);
        lines.push('');

        // Statistiques générales
        lines.push('Statistiques');
        lines.push('Total,En Cours,Complétées,Rejetées,Taux Completion,Temps Moyen (h)');
        lines.push(
            `${rapport.statistiques.total},${rapport.statistiques.enCours},${rapport.statistiques.completees},${rapport.statistiques.rejetees},${rapport.statistiques.tauxCompletion}%,${rapport.statistiques.tempsMoyenHeures}`
        );
        lines.push('');

        // Détails par validateur
        if (rapport.details.length > 0) {
            lines.push('Détails par Validateur');
            lines.push('Validateur,Nombre Traitées,Temps Moyen (h)');
            for (const detail of rapport.details) {
                lines.push(
                    `${detail.validateurNom},${detail.nombreTraitees},${detail.tempsMoyenHeures}`
                );
            }
        }

        return lines.join('\n');
    }

    /**
     * Calcule les détails par validateur
     */
    private calculateDetailsByValidateur(workflows: WorkflowValidation[]): DetailValidateur[] {
        const validateurMap = new Map<string, {
            validateurId: string;
            validateurNom: string;
            nombreTraitees: number;
            totalHeures: number;
        }>();

        for (const workflow of workflows) {
            const historique = workflow.historique as ValidationNiveau[] | undefined;
            if (!historique) continue;

            for (const validation of historique) {
                const id = validation.validateurId;
                const nom = validation.validateurNom || 'Inconnu';

                if (!validateurMap.has(id)) {
                    validateurMap.set(id, {
                        validateurId: id,
                        validateurNom: nom,
                        nombreTraitees: 0,
                        totalHeures: 0,
                    });
                }

                const entry = validateurMap.get(id)!;
                entry.nombreTraitees++;

                // Calculer le temps pour cette validation
                if (workflow.dateCompletion && workflow.createdAt) {
                    const heures = (workflow.dateCompletion.getTime() - workflow.createdAt.getTime()) / 3600000;
                    entry.totalHeures += heures / workflow.niveauActuel; // Répartir par niveau
                }
            }
        }

        // Convertir en array et calculer temps moyen
        const details: DetailValidateur[] = [];
        for (const entry of validateurMap.values()) {
            details.push({
                validateurId: entry.validateurId,
                validateurNom: entry.validateurNom,
                nombreTraitees: entry.nombreTraitees,
                tempsMoyenHeures: entry.nombreTraitees > 0
                    ? Math.round(entry.totalHeures / entry.nombreTraitees)
                    : 0,
            });
        }

        // Trier par nombre de traitées (desc)
        return details.sort((a, b) => b.nombreTraitees - a.nombreTraitees);
    }

    /**
     * Formate la période pour l'affichage
     */
    private formatPeriode(debut: Date, fin: Date): string {
        const options: Intl.DateTimeFormatOptions = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        };
        return `${debut.toLocaleDateString('fr-FR', options)} - ${fin.toLocaleDateString('fr-FR', options)}`;
    }
}

export const validationRapportService = new ValidationRapportService();
export default ValidationRapportService;
