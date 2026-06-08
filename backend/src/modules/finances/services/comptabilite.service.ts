/**
 * ==================================
 * eLISAschool - Service Comptabilité
 * ==================================
 * Version: 2.0.0 (avec entités réelles)
 * Auteur: xAI Éducation
 * 
 * Gestion comptable avec système OHADA
 * - Génération automatique des écritures comptables
 * - Balance comptable
 * - Rapport financier
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { 
    EcritureComptable, 
    TypeEcriture, 
    StatutEcriture,
    CompteCaisse,
    CompteBancaire
} from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export interface CreateEcritureDto {
    dateEcriture: Date;
    libelle: string;
    compteDebit: string;
    compteCredit: string;
    montantDebit: number;
    montantCredit: number;
    type: TypeEcriture;
    referenceExterne?: string;
    observations?: string;
    utilisateurId?: string;
}

export class ComptabiliteService {
    private ecritureRepo: Repository<EcritureComptable>;
    private compteCaisseRepo: Repository<CompteCaisse>;
    private compteBancaireRepo: Repository<CompteBancaire>;

    constructor() {
        this.ecritureRepo = AppDataSource.getRepository(EcritureComptable);
        this.compteCaisseRepo = AppDataSource.getRepository(CompteCaisse);
        this.compteBancaireRepo = AppDataSource.getRepository(CompteBancaire);
    }

    /**
     * Générer une écriture comptable pour un paiement
     */
    async genererEcriturePaiement(
        paiementId: string,
        montant: number,
        methodePaiement: string,
        eleveNom: string,
        etablissementId: string,
        utilisateurId?: string
    ): Promise<EcritureComptable> {
        const numeroPiece = await this.genererNumeroPiece(etablissementId);

        // Déterminer compte de débit selon méthode de paiement
        const compteDebit = methodePaiement === 'ESPECES' ? '531000' : '512000';
        
        // Crédit: Produits scolarité
        const compteCredit = '706000';

        const ecriture = this.ecritureRepo.create({
            numeroPiece,
            dateEcriture: new Date(),
            libelle: `Paiement scolarité - ${eleveNom}`,
            compteDebit,
            compteCredit,
            montantDebit: montant,
            montantCredit: montant,
            type: TypeEcriture.PAIEMENT,
            statut: StatutEcriture.VALIDE,
            referenceExterne: paiementId,
            etablissementId,
            utilisateurId: utilisateurId
        });

        const saved = await this.ecritureRepo.save(ecriture);
        logger.info(`[Comptabilité] Écriture générée: ${numeroPiece} - Paiement ${montant} FCFA`);
        return saved;
    }

    /**
     * Générer une écriture comptable pour une dépense
     */
    async genererEcritureDepense(
        depenseId: string,
        montantHT: number,
        montantTVA: number,
        montantTTC: number,
        compteCharge: string,
        libelle: string,
        etablissementId: string,
        methodePaiement: string,
        utilisateurId?: string
    ): Promise<EcritureComptable> {
        const numeroPiece = await this.genererNumeroPiece(etablissementId);

        // Débit: Charge selon catégorie
        // Débit: TVA déductible (si applicable)
        // Crédit: Fournisseurs
        const ecriture = this.ecritureRepo.create({
            numeroPiece,
            dateEcriture: new Date(),
            libelle: `Dépense - ${libelle}`,
            compteDebit: compteCharge,
            compteCredit: '401000', // Fournisseurs
            montantDebit: montantTTC,
            montantCredit: montantTTC,
            type: TypeEcriture.DEPENSE,
            statut: StatutEcriture.VALIDE,
            referenceExterne: depenseId,
            observations: montantTVA > 0 ? `TVA: ${montantTVA} FCFA` : undefined,
            etablissementId,
            utilisateurId: utilisateurId as any
        });

        const saved = await this.ecritureRepo.save(ecriture);
        logger.info(`[Comptabilité] Écriture générée: ${numeroPiece} - Dépense ${montantTTC} FCFA`);
        return saved;
    }

    /**
     * Créer une écriture manuelle
     */
    async creerEcritureManuelle(dto: CreateEcritureDto, etablissementId: string): Promise<EcritureComptable> {
        const numeroPiece = await this.genererNumeroPiece(etablissementId);

        // Vérifier équilibre débit/crédit
        if (dto.montantDebit !== dto.montantCredit) {
            throw new AppError(
                'L\'écriture doit être équilibrée (débit = crédit)',
                400,
                'ECRITURE_NON_EQUILIBREE'
            );
        }

        const ecriture = this.ecritureRepo.create({
            ...dto,
            numeroPiece,
            statut: StatutEcriture.BROUILLON,
            etablissementId
        });

        const saved = await this.ecritureRepo.save(ecriture);
        logger.info(`[Comptabilité] Écriture manuelle créée: ${numeroPiece}`);
        return saved;
    }

    /**
     * Valider une écriture
     */
    async validerEcriture(id: string, etablissementId: string): Promise<EcritureComptable> {
        const ecriture = await this.ecritureRepo.findOne({
            where: { id, etablissementId }
        });

        if (!ecriture) {
            throw new AppError('Écriture introuvable', 404, 'NOT_FOUND');
        }

        if (ecriture.statut !== StatutEcriture.BROUILLON) {
            throw new AppError(
                'Seules les écritures en brouillon peuvent être validées',
                400,
                'STATUT_INVALIDE'
            );
        }

        ecriture.statut = StatutEcriture.VALIDE;
        return this.ecritureRepo.save(ecriture);
    }

    /**
     * Annuler une écriture
     */
    async annulerEcriture(id: string, etablissementId: string): Promise<EcritureComptable> {
        const ecriture = await this.ecritureRepo.findOne({
            where: { id, etablissementId }
        });

        if (!ecriture) {
            throw new AppError('Écriture introuvable', 404, 'NOT_FOUND');
        }

        ecriture.statut = StatutEcriture.ANNULE;
        return this.ecritureRepo.save(ecriture);
    }

    /**
     * Lister les écritures avec filtres
     */
    async listerEcritures(
        etablissementId: string,
        filters?: {
            dateDebut?: Date;
            dateFin?: Date;
            type?: TypeEcriture;
            statut?: StatutEcriture;
            compteDebit?: string;
            compteCredit?: string;
        }
    ): Promise<EcritureComptable[]> {
        const query = this.ecritureRepo.createQueryBuilder('ecriture')
            .where('ecriture.etablissementId = :etablissementId', { etablissementId })
            .orderBy('ecriture.dateEcriture', 'DESC');

        if (filters?.dateDebut) {
            query.andWhere('ecriture.dateEcriture >= :dateDebut', { dateDebut: filters.dateDebut });
        }
        if (filters?.dateFin) {
            query.andWhere('ecriture.dateEcriture <= :dateFin', { dateFin: filters.dateFin });
        }
        if (filters?.type) {
            query.andWhere('ecriture.type = :type', { type: filters.type });
        }
        if (filters?.statut) {
            query.andWhere('ecriture.statut = :statut', { statut: filters.statut });
        }
        if (filters?.compteDebit) {
            query.andWhere('ecriture.compteDebit = :compteDebit', { compteDebit: filters.compteDebit });
        }
        if (filters?.compteCredit) {
            query.andWhere('ecriture.compteCredit = :compteCredit', { compteCredit: filters.compteCredit });
        }

        return query.getMany();
    }

    /**
     * Générer balance comptable
     */
    async genererBalance(
        etablissementId: string,
        dateDebut: Date,
        dateFin: Date
    ): Promise<{
        compte: string;
        totalDebit: number;
        totalCredit: number;
        solde: number;
    }[]> {
        const ecritures = await this.ecritureRepo.find({
            where: {
                etablissementId,
                statut: StatutEcriture.VALIDE,
                dateEcriture: Between(dateDebut, dateFin)
            }
        });

        // Agréger par compte
        const balance = new Map<string, { totalDebit: number; totalCredit: number }>();

        for (const ecriture of ecritures) {
            // Débit
            if (!balance.has(ecriture.compteDebit)) {
                balance.set(ecriture.compteDebit, { totalDebit: 0, totalCredit: 0 });
            }
            const debitAccount = balance.get(ecriture.compteDebit)!;
            debitAccount.totalDebit += Number(ecriture.montantDebit);

            // Crédit
            if (!balance.has(ecriture.compteCredit)) {
                balance.set(ecriture.compteCredit, { totalDebit: 0, totalCredit: 0 });
            }
            const creditAccount = balance.get(ecriture.compteCredit)!;
            creditAccount.totalCredit += Number(ecriture.montantCredit);
        }

        // Convertir en tableau
        return Array.from(balance.entries()).map(([compte, totals]) => ({
            compte,
            totalDebit: totals.totalDebit,
            totalCredit: totals.totalCredit,
            solde: totals.totalDebit - totals.totalCredit
        })).sort((a, b) => a.compte.localeCompare(b.compte));
    }

    /**
     * Rapport financier synthétique
     */
    async genererRapportFinancier(
        etablissementId: string,
        annee: number
    ): Promise<{
        totalProduits: number;
        totalCharges: number;
        resultat: number;
        ecrituresCount: number;
    }> {
        const dateDebut = new Date(`${annee}-01-01`);
        const dateFin = new Date(`${annee}-12-31`);

        const ecritures = await this.ecritureRepo.find({
            where: {
                etablissementId,
                statut: StatutEcriture.VALIDE,
                dateEcriture: Between(dateDebut, dateFin)
            }
        });

        let totalProduits = 0;
        let totalCharges = 0;

        for (const ecriture of ecritures) {
            // Produits (comptes 7xxxx)
            if (ecriture.compteCredit.startsWith('7')) {
                totalProduits += Number(ecriture.montantCredit);
            }
            // Charges (comptes 6xxxx)
            if (ecriture.compteDebit.startsWith('6')) {
                totalCharges += Number(ecriture.montantDebit);
            }
        }

        return {
            totalProduits,
            totalCharges,
            resultat: totalProduits - totalCharges,
            ecrituresCount: ecritures.length
        };
    }

    /**
     * Générer numéro de pièce unique
     */
    private async genererNumeroPiece(etablissementId: string): Promise<string> {
        const annee = new Date().getFullYear();
        
        const lastEcriture = await this.ecritureRepo.findOne({
            where: { etablissementId },
            order: { createdAt: 'DESC' }
        });

        let sequence = 1;
        if (lastEcriture && lastEcriture.numeroPiece) {
            const parts = lastEcriture.numeroPiece.split('-');
            sequence = parseInt(parts[2] || '0') + 1;
        }

        return `EC-${annee}-${String(sequence).padStart(5, '0')}`;
    }
}

// Export singleton
export const comptabiliteService = new ComptabiliteService();

// Import manquant
import { Between } from 'typeorm';
