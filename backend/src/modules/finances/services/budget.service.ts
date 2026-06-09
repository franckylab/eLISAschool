/**
 * ==================================
 * eLISAschool - Service Budget
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion budgétaire : création, suivi, engagement et consommation
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Interface pour une ligne de budget
 */
interface LigneBudget {
    id: string;
    budgetId: string;
    codeLigne: string;
    libelle: string;
    categorieDepenseId?: string;
    montantPrevu: number;
    montantEngage: number;
    montantConsomme: number;
    montantDisponible: number;
    responsableId?: string;
}

/**
 * Service de gestion budgétaire
 */
export class BudgetService {
    private budgetRepo: Repository<any>; // TODO: Créer entity Budget
    private ligneBudgetRepo: Repository<any>; // TODO: Créer entity LigneBudget

    constructor() {
        this.budgetRepo = AppDataSource.getRepository('Budget' as any);
        this.ligneBudgetRepo = AppDataSource.getRepository('LigneBudget' as any);
    }

    // ==================================
    // CRÉATION & GESTION BUDGET
    // ==================================

    /**
     * Créer un budget annuel
     */
    async creerBudget(
        dto: {
            nom: string;
            exercice: string;
            dateDebut: Date;
            dateFin: Date;
        },
        userId: string,
        etablissementId: string
    ): Promise<any> {
        try {
            // Vérifier unicité exercice
            // const existant = await this.budgetRepo.findOne({
            //     where: { exercice: dto.exercice, etablissementId },
            // });
            // if (existant) {
            //     throw new AppError('Budget existe déjà pour cet exercice', 409, 'BUDGET_EXISTS');
            // }

            const budget = {
                ...dto,
                statut: 'BROUILLON',
                validePar: userId,
                etablissementId,
            };

            // TODO: Sauvegarder
            // await this.budgetRepo.save(budget);

            logger.info(`[Budget] Budget créé: ${dto.nom} - Exercice ${dto.exercice}`);
            return budget;
        } catch (error) {
            logger.error('[Budget] Erreur création budget', error);
            throw error;
        }
    }

    /**
     * Ajouter une ligne de budget
     */
    async ajouterLigneBudget(
        budgetId: string,
        dto: {
            codeLigne: string;
            libelle: string;
            categorieDepenseId?: string;
            montantPrevu: number;
            responsableId?: string;
        }
    ): Promise<LigneBudget> {
        try {
            const ligne: LigneBudget = {
                id: 'temp', // TODO: Générer UUID
                budgetId,
                codeLigne: dto.codeLigne,
                libelle: dto.libelle,
                categorieDepenseId: dto.categorieDepenseId,
                montantPrevu: dto.montantPrevu,
                montantEngage: 0,
                montantConsomme: 0,
                montantDisponible: dto.montantPrevu,
                responsableId: dto.responsableId,
            };

            // TODO: Sauvegarder
            // await this.ligneBudgetRepo.save(ligne);

            logger.info(`[Budget] Ligne ajoutée: ${dto.libelle} - ${dto.montantPrevu} FCFA`);
            return ligne;
        } catch (error) {
            logger.error('[Budget] Erreur ajout ligne budget', error);
            throw error;
        }
    }

    /**
     * Valider un budget
     */
    async validerBudget(budgetId: string, userId: string): Promise<void> {
        try {
            // TODO: Vérifier que toutes les lignes sont remplies
            // TODO: Changer statut à VALIDE
            
            logger.info(`[Budget] Budget ${budgetId} validé par ${userId}`);
        } catch (error) {
            logger.error('[Budget] Erreur validation budget', error);
            throw error;
        }
    }

    /**
     * Clôturer un budget
     */
    async cloturerBudget(budgetId: string, userId: string): Promise<void> {
        try {
            // TODO: Vérifier qu'aucune dépense en cours
            // TODO: Changer statut à CLOTURE
            
            logger.info(`[Budget] Budget ${budgetId} clôturé par ${userId}`);
        } catch (error) {
            logger.error('[Budget] Erreur clôture budget', error);
            throw error;
        }
    }

    // ==================================
    // ENGAGEMENT & CONSOMMATION
    // ==================================

    /**
     * Engager un montant sur une ligne budgétaire
     * (lorsqu'une demande de dépense est validée)
     */
    async engagerBudget(
        categorieDepenseId: string,
        montant: number,
        referenceId: string, // ID de la demande
        etablissementId: string
    ): Promise<{
        ligneBudget: LigneBudget;
        disponible: number;
        alerte: boolean;
    }> {
        try {
            // Récupérer ligne budget active pour cette catégorie
            const ligne = await this.getLigneBudgetActive(categorieDepenseId, etablissementId);
            
            if (!ligne) {
                throw new AppError(
                    'Aucune ligne budget active pour cette catégorie',
                    404,
                    'BUDGET_LINE_NOT_FOUND'
                );
            }

            // Vérifier disponibilité
            const disponible = ligne.montantPrevu - ligne.montantEngage - montant;
            
            if (disponible < 0) {
                logger.warn(
                    `[Budget] Dépassement engagement: ${categorieDepenseId} - ` +
                    `Disponible: ${ligne.montantDisponible}, Demandé: ${montant}`
                );
            }

            // TODO: Mettre à jour montantEngage
            // ligne.montantEngage += montant;
            // ligne.montantDisponible = ligne.montantPrevu - ligne.montantEngage - ligne.montantConsomme;
            // await this.ligneBudgetRepo.save(ligne);

            // Alerte si > 80% utilisé
            const pourcentageEngage = ((ligne.montantEngage + montant) / ligne.montantPrevu) * 100;
            const alerte = pourcentageEngage > 80;

            if (alerte) {
                logger.warn(
                    `[Budget] Alerte: Catégorie ${categorieDepenseId} - ` +
                    `${pourcentageEngage.toFixed(1)}% engagé`
                );
            }

            return {
                ligneBudget: ligne,
                disponible,
                alerte,
            };
        } catch (error) {
            logger.error('[Budget] Erreur engagement budget', error);
            throw error;
        }
    }

    /**
     * Consommer un montant sur une ligne budgétaire
     * (lorsqu'une dépense est payée)
     */
    async consommerBudget(
        categorieDepenseId: string,
        montant: number,
        depenseId: string,
        etablissementId: string
    ): Promise<LigneBudget> {
        try {
            const ligne = await this.getLigneBudgetActive(categorieDepenseId, etablissementId);
            
            if (!ligne) {
                throw new AppError('Ligne budget non trouvée', 404, 'BUDGET_LINE_NOT_FOUND');
            }

            // TODO: Mettre à jour
            // 1. Déduire de montantEngage (l'engagement devient consommation)
            // ligne.montantEngage -= montant;
            // 2. Ajouter à montantConsomme
            // ligne.montantConsomme += montant;
            // 3. Recalculer disponible
            // ligne.montantDisponible = ligne.montantPrevu - ligne.montantEngage - ligne.montantConsomme;
            // await this.ligneBudgetRepo.save(ligne);

            logger.info(`[Budget] Consommation: ${categorieDepenseId} - ${montant} FCFA`);
            return ligne;
        } catch (error) {
            logger.error('[Budget] Erreur consommation budget', error);
            throw error;
        }
    }

    /**
     * Libérer un engagement
     * (lorsqu'une demande est rejetée/annulée)
     */
    async libererBudget(
        categorieDepenseId: string,
        montant: number,
        referenceId: string,
        etablissementId: string
    ): Promise<void> {
        try {
            const ligne = await this.getLigneBudgetActive(categorieDepenseId, etablissementId);
            
            if (!ligne) {
                throw new AppError('Ligne budget non trouvée', 404, 'BUDGET_LINE_NOT_FOUND');
            }

            // TODO: Libérer engagement
            // ligne.montantEngage -= montant;
            // ligne.montantDisponible = ligne.montantPrevu - ligne.montantEngage - ligne.montantConsomme;
            // await this.ligneBudgetRepo.save(ligne);

            logger.info(`[Budget] Engagement libéré: ${categorieDepenseId} - ${montant} FCFA`);
        } catch (error) {
            logger.error('[Budget] Erreur libération budget', error);
            throw error;
        }
    }

    // ==================================
    // SUIVI & RAPPORTS
    // ==================================

    /**
     * État complet d'un budget
     */
    async getEtatBudget(budgetId: string): Promise<{
        budget: any;
        lignes: Array<{
            codeLigne: string;
            libelle: string;
            montantPrevu: number;
            montantEngage: number;
            montantConsomme: number;
            montantDisponible: number;
            pourcentageConsomme: number;
            alerte: boolean;
        }>;
        totalPrevu: number;
        totalEngage: number;
        totalConsomme: number;
        totalDisponible: number;
    }> {
        try {
            // TODO: Récupérer depuis DB
            return {
                budget: {},
                lignes: [],
                totalPrevu: 0,
                totalEngage: 0,
                totalConsomme: 0,
                totalDisponible: 0,
            };
        } catch (error) {
            logger.error('[Budget] Erreur état budget', error);
            throw error;
        }
    }

    /**
     * Obtenir alertes de dépassement budgétaire
     */
    async getAlertesBudget(
        etablissementId: string
    ): Promise<Array<{
        categorie: string;
        montantConsomme: number;
        budgetPrevu: number;
        pourcentage: number;
        type: 'ENGAGEMENT' | 'CONSOMMATION' | 'DEPASSEMENT';
    }>> {
        const alertes: Array<{
            categorie: string;
            montantConsomme: number;
            budgetPrevu: number;
            pourcentage: number;
            type: 'ENGAGEMENT' | 'CONSOMMATION' | 'DEPASSEMENT';
        }> = [];

        try {
            // TODO: Vérifier toutes les lignes budget actives
            // const lignes = await this.ligneBudgetRepo.find({
            //     where: { etablissementId },
            //     relations: ['categorieDepense'],
            // });

            // for (const ligne of lignes) {
            //     const pourcentage = (ligne.montantConsomme / ligne.montantPrevu) * 100;
                
            //     if (pourcentage > 100) {
            //         alertes.push({
            //             categorie: ligne.categorieDepense?.libelle || 'N/A',
            //             montantConsomme: ligne.montantConsomme,
            //             budgetPrevu: ligne.montantPrevu,
            //             pourcentage,
            //             type: 'DEPASSEMENT',
            //         });
            //     } else if (pourcentage > 80) {
            //         alertes.push({
            //             categorie: ligne.categorieDepense?.libelle || 'N/A',
            //             montantConsomme: ligne.montantConsomme,
            //             budgetPrevu: ligne.montantPrevu,
            //             pourcentage,
            //             type: 'CONSOMMATION',
            //         });
            //     }
            // }

            return alertes;
        } catch (error) {
            logger.error('[Budget] Erreur récupération alertes', error);
            throw error;
        }
    }

    /**
     * Comparaison budget prévu vs réel
     */
    async getComparaisonBudget(
        budgetId: string,
        etablissementId: string
    ): Promise<Array<{
        categorie: string;
        prevu: number;
        reel: number;
        ecart: number;
        pourcentageEcart: number;
    }>> {
        try {
            // TODO: Implémenter comparaison
            return [];
        } catch (error) {
            logger.error('[Budget] Erreur comparaison budget', error);
            throw error;
        }
    }

    // ==================================
    // HELPERS
    // ==================================

    /**
     * Récupérer la ligne budget active pour une catégorie
     */
    private async getLigneBudgetActive(
        categorieDepenseId: string,
        etablissementId: string
    ): Promise<LigneBudget | null> {
        // TODO: Récupérer ligne où budget.statut = 'VALIDE' et budget.dateDebut <= now <= budget.dateFin
        return null;
    }

    /**
     * Calculer le pourcentage d'utilisation
     */
    private calculerPourcentageUtilisation(ligne: LigneBudget): number {
        if (ligne.montantPrevu === 0) return 0;
        return ((ligne.montantConsomme + ligne.montantEngage) / ligne.montantPrevu) * 100;
    }
}

// Singleton export
export const budgetService = new BudgetService();
