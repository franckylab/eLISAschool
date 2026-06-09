/**
 * ==================================
 * eLISAschool - Service Trésorerie
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion de la caisse, des comptes bancaires et des mouvements de trésorerie
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Interface pour un compte de caisse
 */
interface CompteCaisse {
    id: string;
    nom: string;
    soldeActuel: number;
    responsableId?: string;
    actif: boolean;
    etablissementId: string;
}

/**
 * Interface pour un mouvement de caisse
 */
interface MouvementCaisse {
    compteCaisseId: string;
    type: 'ENTREE' | 'SORTIE';
    montant: number;
    motif: string;
    paiementId?: string;
    ecritureComptableId?: string;
    effectuePar: string;
    validePar?: string;
    dateMouvement: Date;
    soldeApresMouvement: number;
    etablissementId: string;
}

/**
 * Service de trésorerie
 */
export class TresorerieService {
    private caisseRepo: Repository<any>; // TODO: Créer entity CompteCaisse
    private mouvementRepo: Repository<any>; // TODO: Créer entity MouvementCaisse
    private banqueRepo: Repository<any>; // TODO: Créer entity CompteBancaire

    constructor() {
        this.caisseRepo = AppDataSource.getRepository('CompteCaisse' as any);
        this.mouvementRepo = AppDataSource.getRepository('MouvementCaisse' as any);
        this.banqueRepo = AppDataSource.getRepository('CompteBancaire' as any);
    }

    // ==================================
    // GESTION CAISSE
    // ==================================

    /**
     * Enregistrer une entrée en caisse
     */
    async entrerCaisse(
        dto: {
            compteCaisseId: string;
            montant: number;
            motif: string;
            paiementId?: string;
        },
        userId: string,
        etablissementId?: string
    ): Promise<MouvementCaisse> {
        try {
            // Vérifier compte caisse existe
            const compte = await this.caisseRepo.findOne({ 
                where: { id: dto.compteCaisseId, actif: true } 
            });
            if (!compte) {
                throw new AppError('Compte caisse non trouvé ou inactif', 404, 'CAISSE_NOT_FOUND');
            }

            // Calculer nouveau solde
            const nouveauSolde = compte.soldeActuel + dto.montant;

            // Créer mouvement
            const mouvement: MouvementCaisse = {
                compteCaisseId: dto.compteCaisseId,
                type: 'ENTREE',
                montant: dto.montant,
                motif: dto.motif,
                paiementId: dto.paiementId,
                effectuePar: userId,
                dateMouvement: new Date(),
                soldeApresMouvement: nouveauSolde,
                etablissementId: etablissementId || compte.etablissementId,
            };

            // TODO: Sauvegarder dans transaction
            // await this.mouvementRepo.save(mouvement);
            
            // Mettre à jour solde caisse
            // compte.soldeActuel = nouveauSolde;
            // await this.caisseRepo.save(compte);

            logger.info(`[Trésorerie] Entrée caisse: +${dto.montant} FCFA - ${dto.motif}`);
            return mouvement;
        } catch (error) {
            logger.error('[Trésorerie] Erreur entrée caisse', error);
            throw error;
        }
    }

    /**
     * Enregistrer une sortie de caisse
     */
    async sortirCaisse(
        dto: {
            compteCaisseId: string;
            montant: number;
            motif: string;
            depenseId?: string;
        },
        userId: string,
        etablissementId?: string
    ): Promise<MouvementCaisse> {
        try {
            // Vérifier compte caisse existe
            const compte = await this.caisseRepo.findOne({ 
                where: { id: dto.compteCaisseId, actif: true } 
            });
            if (!compte) {
                throw new AppError('Compte caisse non trouvé ou inactif', 404, 'CAISSE_NOT_FOUND');
            }

            // Vérifier solde suffisant
            if (compte.soldeActuel < dto.montant) {
                throw new AppError(
                    `Solde insuffisant. Disponible: ${compte.soldeActuel} FCFA`,
                    400,
                    'SOLDE_INSUFFISANT'
                );
            }

            // Calculer nouveau solde
            const nouveauSolde = compte.soldeActuel - dto.montant;

            // Créer mouvement
            const mouvement: MouvementCaisse = {
                compteCaisseId: dto.compteCaisseId,
                type: 'SORTIE',
                montant: dto.montant,
                motif: dto.motif,
                effectuePar: userId,
                dateMouvement: new Date(),
                soldeApresMouvement: nouveauSolde,
                etablissementId: etablissementId || compte.etablissementId,
            };

            // TODO: Sauvegarder dans transaction
            // await this.mouvementRepo.save(mouvement);
            
            // Mettre à jour solde caisse
            // compte.soldeActuel = nouveauSolde;
            // await this.caisseRepo.save(compte);

            logger.info(`[Trésorerie] Sortie caisse: -${dto.montant} FCFA - ${dto.motif}`);
            return mouvement;
        } catch (error) {
            logger.error('[Trésorerie] Erreur sortie caisse', error);
            throw error;
        }
    }

    /**
     * Obtenir le solde actuel d'une caisse
     */
    async getSoldeCaisse(compteCaisseId: string): Promise<number> {
        const compte = await this.caisseRepo.findOne({ 
            where: { id: compteCaisseId } 
        });
        
        if (!compte) {
            throw new AppError('Compte caisse non trouvé', 404, 'CAISSE_NOT_FOUND');
        }

        return compte.soldeActuel;
    }

    /**
     * Rapport journalier de caisse
     */
    async getRapportCaisse(
        date: Date,
        compteCaisseId?: string,
        etablissementId?: string
    ): Promise<{
        soldeInitial: number;
        totalEntrees: number;
        totalSorties: number;
        soldeFinal: number;
        mouvements: any[];
    }> {
        try {
            const dateDebut = new Date(date);
            dateDebut.setHours(0, 0, 0, 0);
            
            const dateFin = new Date(date);
            dateFin.setHours(23, 59, 59, 999);

            // TODO: Récupérer mouvements du jour
            // const mouvements = await this.mouvementRepo.find({
            //     where: {
            //         ...(compteCaisseId ? { compteCaisseId } : {}),
            //         etablissementId,
            //         dateMouvement: Between(dateDebut, dateFin),
            //     },
            //     order: { dateMouvement: 'ASC' },
            // });

            // Calculer totaux
            const totalEntrees = 0; // TODO: mouvements.filter(m => m.type === 'ENTREE').reduce((sum, m) => sum + m.montant, 0);
            const totalSorties = 0; // TODO: mouvements.filter(m => m.type === 'SORTIE').reduce((sum, m) => sum + m.montant, 0);

            return {
                soldeInitial: 0, // TODO: Calculer
                totalEntrees,
                totalSorties,
                soldeFinal: 0, // TODO: soldeInitial + totalEntrees - totalSorties
                mouvements: [], // TODO: mouvements
            };
        } catch (error) {
            logger.error('[Trésorerie] Erreur rapport caisse', error);
            throw error;
        }
    }

    // ==================================
    // GESTION BANQUE
    // ==================================

    /**
     * Réconciliation bancaire
     */
    async reconcilierBanque(
        compteBancaireId: string,
        releve: Array<{ date: Date; montant: number; libelle: string }>,
        userId: string
    ): Promise<{
        ecarts: any[];
        nombreOperationsReconciliees: number;
    }> {
        try {
            // TODO: Implémenter réconciliation
            // 1. Récupérer mouvements bancaires du compte
            // 2. Comparer avec relevé fourni
            // 3. Identifier écarts
            // 4. Créer ajustements si nécessaire

            logger.info(`[Trésorerie] Réconciliation bancaire effectuée pour compte ${compteBancaireId}`);
            
            return {
                ecarts: [],
                nombreOperationsReconciliees: 0,
            };
        } catch (error) {
            logger.error('[Trésorerie] Erreur réconciliation bancaire', error);
            throw error;
        }
    }

    /**
     * Obtenir le solde bancaire actuel
     */
    async getSoldeBanque(compteBancaireId: string): Promise<number> {
        const compte = await this.banqueRepo.findOne({ 
            where: { id: compteBancaireId } 
        });
        
        if (!compte) {
            throw new AppError('Compte bancaire non trouvé', 404, 'BANQUE_NOT_FOUND');
        }

        return compte.soldeActuel;
    }

    // ==================================
    // RAPPORTS DE TRÉSORERIE
    // ==================================

    /**
     * État de trésorerie global (caisse + banque)
     */
    async getEtatTresorerie(etablissementId: string): Promise<{
        totalCaisse: number;
        totalBanque: number;
        totalGeneral: number;
        dernierMouvement: Date | null;
    }> {
        try {
            // TODO: Calculer depuis les repositories
            const totalCaisse = 0;
            const totalBanque = 0;
            
            return {
                totalCaisse,
                totalBanque,
                totalGeneral: totalCaisse + totalBanque,
                dernierMouvement: null,
            };
        } catch (error) {
            logger.error('[Trésorerie] Erreur état trésorerie', error);
            throw error;
        }
    }

    /**
     * Historique des mouvements
     */
    async getHistoriqueMouvements(
        filters: {
            dateDebut?: Date;
            dateFin?: Date;
            type?: 'ENTREE' | 'SORTIE';
            compteCaisseId?: string;
            page?: number;
            limit?: number;
        },
        etablissementId: string
    ): Promise<{ data: any[]; total: number }> {
        try {
            // TODO: Implémenter avec query builder
            return { data: [], total: 0 };
        } catch (error) {
            logger.error('[Trésorerie] Erreur historique mouvements', error);
            throw error;
        }
    }

    // ==================================
    // SEUILS ET ALERTES
    // ==================================

    /**
     * Vérifier si solde en dessous du seuil minimum
     */
    async verifierSeuilMinimum(
        compteCaisseId: string,
        seuilMinimum: number
    ): Promise<boolean> {
        const solde = await this.getSoldeCaisse(compteCaisseId);
        return solde < seuilMinimum;
    }

    /**
     * Obtenir alertes de trésorerie
     */
    async getAlertesTresorerie(
        seuilMinimumCaisse: number,
        etablissementId: string
    ): Promise<Array<{ type: string; message: string; solde: number }>> {
        const alertes: Array<{ type: string; message: string; solde: number }> = [];

        // TODO: Vérifier tous les comptes caisse actifs
        // const comptes = await this.caisseRepo.find({
        //     where: { etablissementId, actif: true },
        // });

        // for (const compte of comptes) {
        //     if (compte.soldeActuel < seuilMinimumCaisse) {
        //         alertes.push({
        //             type: 'SOLDE_BAS',
        //             message: `Caisse "${compte.nom}": solde bas (${compte.soldeActuel} FCFA)`,
        //             solde: compte.soldeActuel,
        //         });
        //     }
        // }

        return alertes;
    }
}

// Singleton export
export const tresorerieService = new TresorerieService();
