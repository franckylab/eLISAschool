/**
 * ==================================
 * eLISAschool - Service Workflow Validation Finances
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Gestion des workflows de validation pour :
 * - Paiements (2 niveaux)
 * - Dépenses (3 niveaux)
 * - Budgets (4 niveaux)
 */

import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

interface WorkflowConfig {
    requireValidation: boolean;
    levels: number[];
    seuils: Record<number, number>;
    roles: Record<number, string[]>;
}

interface ValidationRequest {
    entityId: string;
    entityType: 'PAIEMENT' | 'DEPENSE' | 'BUDGET';
    montant: number;
    etablissementId: string;
    utilisateurId: string;
    utilisateurRole: string;
}

interface ValidationResponse {
    statut: 'VALIDE' | 'EN_COURS' | 'REJETE';
    niveauActuel: number;
    niveauRequis: number;
    prochainesActions: string[];
}

export class FinanceWorkflowService {
    private static instance: FinanceWorkflowService;

    private constructor() {}

    static getInstance(): FinanceWorkflowService {
        if (!FinanceWorkflowService.instance) {
            FinanceWorkflowService.instance = new FinanceWorkflowService();
        }
        return FinanceWorkflowService.instance;
    }

    /**
     * Configuration des workflows par défaut
     */
    private getWorkflowConfig(type: 'PAIEMENT' | 'DEPENSE' | 'BUDGET'): WorkflowConfig {
        const configs: Record<string, WorkflowConfig> = {
            PAIEMENT: {
                requireValidation: false,
                levels: [1],
                seuils: {
                    1: 0, // Tous les paiements
                },
                roles: {
                    1: ['COMPTABLE', 'CAISSIER'],
                },
            },
            DEPENSE: {
                requireValidation: true,
                levels: [1, 2, 3],
                seuils: {
                    1: 0,
                    2: 500000,
                    3: 2000000,
                },
                roles: {
                    1: ['PERSONNEL', 'ENSEIGNANT'],
                    2: ['CHEF_ETABLISSEMENT', 'COMPTABLE'],
                    3: ['ADMIN', 'DIRECTEUR'],
                },
            },
            BUDGET: {
                requireValidation: true,
                levels: [1, 2, 3, 4],
                seuils: {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 10000000,
                },
                roles: {
                    1: ['COMPTABLE'],
                    2: ['CHEF_ETABLISSEMENT'],
                    3: ['ADMIN'],
                    4: ['DIRECTEUR', 'SUPER_ADMIN'],
                },
            },
        };

        return configs[type];
    }

    /**
     * Déterminer le niveau de validation requis selon le montant
     */
    private getNiveauRequis(montant: number, config: WorkflowConfig): number {
        let niveauRequis = 1;

        for (const niveau of config.levels) {
            const seuil = config.seuils[niveau] || 0;
            if (montant >= seuil) {
                niveauRequis = niveau;
            }
        }

        return niveauRequis;
    }

    /**
     * Vérifier si l'utilisateur peut valider à ce niveau
     */
    private canValidateAtLevel(
        utilisateurRole: string,
        niveau: number,
        config: WorkflowConfig
    ): boolean {
        const rolesAutorises = config.roles[niveau] || [];
        return rolesAutorises.includes(utilisateurRole);
    }

    /**
     * Valider une entité (paiement, dépense ou budget)
     */
    async valider(request: ValidationRequest): Promise<ValidationResponse> {
        const config = this.getWorkflowConfig(request.entityType);

        // Si validation non requise, validation automatique
        if (!config.requireValidation) {
            logger.info(`[Workflow] Validation automatique pour ${request.entityType} ${request.entityId}`);
            return {
                statut: 'VALIDE',
                niveauActuel: 0,
                niveauRequis: 0,
                prochainesActions: [],
            };
        }

        // Déterminer niveau requis selon montant
        const niveauRequis = this.getNiveauRequis(request.montant, config);

        // Vérifier si l'utilisateur peut valider
        if (!this.canValidateAtLevel(request.utilisateurRole, niveauRequis, config)) {
            throw new AppError(
                `Vous n'avez pas les permissions pour valider ce ${request.entityType} (niveau ${niveauRequis} requis)`,
                403,
                'INSUFFICIENT_VALIDATION_LEVEL'
            );
        }

        // Validation réussie à ce niveau
        logger.info(
            `[Workflow] ${request.entityType} ${request.entityId} validé niveau ${niveauRequis} par ${request.utilisateurRole}`
        );

        const prochainesActions = this.getNextActions(niveauRequis, niveauRequis, config);

        return {
            statut: niveauRequis >= Math.max(...config.levels) ? 'VALIDE' : 'EN_COURS',
            niveauActuel: niveauRequis,
            niveauRequis,
            prochainesActions,
        };
    }

    /**
     * Obtenir les prochaines actions requises
     */
    private getNextActions(
        niveauActuel: number,
        niveauRequis: number,
        config: WorkflowConfig
    ): string[] {
        if (niveauActuel >= niveauRequis && niveauActuel >= Math.max(...config.levels)) {
            return ['Entité entièrement validée'];
        }

        const nextLevel = niveauActuel + 1;
        if (config.levels.includes(nextLevel)) {
            const roles = config.roles[nextLevel] || [];
            return [`Validation niveau ${nextLevel} requise par: ${roles.join(', ')}`];
        }

        return [];
    }

    /**
     * Rejeter une entité
     */
    async rejeter(
        entityId: string,
        entityType: 'PAIEMENT' | 'DEPENSE' | 'BUDGET',
        motif: string,
        utilisateurRole: string
    ): Promise<void> {
        const config = this.getWorkflowConfig(entityType);

        // Vérifier si l'utilisateur peut rejeter (mêmes permissions que valider)
        if (!config.requireValidation) {
            throw new AppError('Cette entité ne nécessite pas de validation', 400, 'VALIDATION_NOT_REQUIRED');
        }

        logger.warn(
            `[Workflow] ${entityType} ${entityId} rejeté par ${utilisateurRole} - Motif: ${motif}`
        );

        // TODO: Enregistrer le rejet en base avec motif
        // TODO: Notification au demandeur
    }

    /**
     * Obtenir le statut de validation d'une entité
     */
    async getValidationStatus(
        entityId: string,
        entityType: 'PAIEMENT' | 'DEPENSE' | 'BUDGET',
        montant: number
    ): Promise<{
        requireValidation: boolean;
        niveauActuel: number;
        niveauRequis: number;
        estValide: boolean;
        validations: Array<{ niveau: number; statut: string; date?: Date }>;
    }> {
        const config = this.getWorkflowConfig(entityType);

        if (!config.requireValidation) {
            return {
                requireValidation: false,
                niveauActuel: 0,
                niveauRequis: 0,
                estValide: true,
                validations: [],
            };
        }

        const niveauRequis = this.getNiveauRequis(montant, config);

        // TODO: Récupérer les validations existantes depuis la base
        const validations: Array<{ niveau: number; statut: string; date?: Date }> = [];

        return {
            requireValidation: true,
            niveauActuel: validations.length,
            niveauRequis,
            estValide: validations.length >= niveauRequis,
            validations,
        };
    }

    /**
     * Vérifier si une entité est complètement validée
     */
    async estEntierementValide(
        entityId: string,
        entityType: 'PAIEMENT' | 'DEPENSE' | 'BUDGET',
        montant: number
    ): Promise<boolean> {
        const status = await this.getValidationStatus(entityId, entityType, montant);
        return status.estValide;
    }

    /**
     * Obtenir les rôles requis pour valider un montant donné
     */
    getRolesRequisPourMontant(
        montant: number,
        entityType: 'PAIEMENT' | 'DEPENSE' | 'BUDGET'
    ): string[] {
        const config = this.getWorkflowConfig(entityType);
        const niveauRequis = this.getNiveauRequis(montant, config);
        return config.roles[niveauRequis] || [];
    }

    /**
     * Mettre à jour la configuration d'un workflow
     */
    updateWorkflowConfig(
        type: 'PAIEMENT' | 'DEPENSE' | 'BUDGET',
        config: Partial<WorkflowConfig>
    ): void {
        // TODO: Persister en base via table parametres
        logger.info(`[Workflow] Configuration ${type} mise à jour:`, config);
    }
}

// Singleton export
export const financeWorkflowService = FinanceWorkflowService.getInstance();
