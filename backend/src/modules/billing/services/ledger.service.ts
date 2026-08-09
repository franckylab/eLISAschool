/**
 * ==================================
 * eLISAschool - Service Ledger Double Entrée
 * ==================================
 * 
 * Comptabilité OHADA en partie double.
 * Chaque transaction génère un débit et un crédit équilibrés.
 * Export CSV/PDF pour conformité comptable.
 * 
 * Phase B.5 — Refonte SaaS v2
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import {
    TransactionLedger,
    TypeTransactionLedger,
    SensEcriture,
} from '../entities/transaction-ledger.entity';

export interface EcritureComptable {
    compteDebit: string;
    compteCredit: string;
    montant: number;
    libelle: string;
    typeTransaction: TypeTransactionLedger;
    referenceId?: string;
}

export interface RapportComptable {
    periode: string;
    etablissementId: string;
    totalDebits: number;
    totalCredits: number;
    solde: number;
    ecritures: TransactionLedger[];
}

// Comptes OHADA standard
export const COMPTES_OHADA = {
    CLIENTS: '411',           // Créances clients
    CLIENTS_DOUTEUX: '414',   // Créances douteuses
    BANQUE: '521',            // Banque
    CAISSE: '571',            // Caisse
    PRODUITS_SERVICES: '706', // Prestations de services
    TVA_COLLECTEE: '443',     // TVA collectée
    TVA_DEDUCTIBLE: '445',    // TVA déductible
    CHARGES_FINANCIERES: '661', // Charges financières
    PENALITES: '658',          // Autres charges
} as const;

export class LedgerService {
    private ledgerRepo: Repository<TransactionLedger>;

    constructor() {
        this.ledgerRepo = AppDataSource.getRepository(TransactionLedger);
    }

    /**
     * Enregistre une écriture en partie double.
     * Débit sur un compte + Crédit sur un autre = toujours équilibré.
     */
    async enregistrerEcriture(
        etablissementId: string,
        ecriture: EcritureComptable,
        factureId?: string
    ): Promise<{ debit: TransactionLedger; credit: TransactionLedger }> {
        const now = new Date();
        const periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Numéro séquentiel OHADA
        const numeroEcriture = await this.genererNumeroEcriture(periode);

        // Calculer le solde cumulé
        const dernierSolde = await this.getDernierSolde(etablissementId);

        // Écriture DÉBIT
        const debit = this.ledgerRepo.create({
            numeroEcriture: `${numeroEcriture}-D`,
            etablissementId,
            factureId,
            typeTransaction: ecriture.typeTransaction,
            sens: SensEcriture.DEBIT,
            compteComptable: ecriture.compteDebit,
            libelle: ecriture.libelle,
            montant: ecriture.montant,
            soldeCumule: dernierSolde + ecriture.montant,
            periode,
            dateEcriture: now,
            referenceId: ecriture.referenceId,
        });

        // Écriture CRÉDIT
        const credit = this.ledgerRepo.create({
            numeroEcriture: `${numeroEcriture}-C`,
            etablissementId,
            factureId,
            typeTransaction: ecriture.typeTransaction,
            sens: SensEcriture.CREDIT,
            compteComptable: ecriture.compteCredit,
            libelle: ecriture.libelle,
            montant: ecriture.montant,
            soldeCumule: dernierSolde + ecriture.montant,
            periode,
            dateEcriture: now,
            referenceId: ecriture.referenceId,
        });

        const [savedDebit, savedCredit] = await this.ledgerRepo.save([debit, credit]);

        logger.info(
            `[Ledger] Écriture ${numeroEcriture} — ${ecriture.libelle} ` +
            `— ${ecriture.montant} XAF — D:${ecriture.compteDebit} C:${ecriture.compteCredit}`
        );

        return { debit: savedDebit, credit: savedCredit };
    }

    /**
     * Enregistre la facturation (débit client, crédit produit).
     */
    async enregistrerFacturation(
        etablissementId: string,
        factureId: string,
        montantHT: number,
        montantTVA: number,
        libelle: string
    ): Promise<void> {
        // Débit client (411) pour le montant TTC
        const montantTTC = montantHT + montantTVA;

        await this.enregistrerEcriture(
            etablissementId,
            {
                compteDebit: COMPTES_OHADA.CLIENTS,
                compteCredit: COMPTES_OHADA.PRODUITS_SERVICES,
                montant: montantHT,
                libelle: `Facturation — ${libelle}`,
                typeTransaction: TypeTransactionLedger.FACTURATION,
                referenceId: factureId,
            },
            factureId
        );

        // TVA collectée (443)
        if (montantTVA > 0) {
            await this.enregistrerEcriture(
                etablissementId,
                {
                    compteDebit: COMPTES_OHADA.CLIENTS,
                    compteCredit: COMPTES_OHADA.TVA_COLLECTEE,
                    montant: montantTVA,
                    libelle: `TVA sur ${libelle}`,
                    typeTransaction: TypeTransactionLedger.FACTURATION,
                    referenceId: factureId,
                },
                factureId
            );
        }
    }

    /**
     * Enregistre un paiement (débit banque, crédit client).
     */
    async enregistrerPaiement(
        etablissementId: string,
        factureId: string,
        montant: number,
        libelle: string
    ): Promise<void> {
        await this.enregistrerEcriture(
            etablissementId,
            {
                compteDebit: COMPTES_OHADA.BANQUE,
                compteCredit: COMPTES_OHADA.CLIENTS,
                montant,
                libelle: `Paiement — ${libelle}`,
                typeTransaction: TypeTransactionLedger.PAIEMENT,
                referenceId: factureId,
            },
            factureId
        );
    }

    /**
     * Enregistre un avoir (débit produit, crédit client).
     */
    async enregistrerAvoir(
        etablissementId: string,
        factureId: string,
        montant: number,
        libelle: string
    ): Promise<void> {
        await this.enregistrerEcriture(
            etablissementId,
            {
                compteDebit: COMPTES_OHADA.PRODUITS_SERVICES,
                compteCredit: COMPTES_OHADA.CLIENTS,
                montant,
                libelle: `Avoir — ${libelle}`,
                typeTransaction: TypeTransactionLedger.AVOIR,
                referenceId: factureId,
            },
            factureId
        );
    }

    /**
     * Génère un rapport comptable pour une période donnée.
     */
    async getRapportComptable(
        etablissementId: string,
        periode: string
    ): Promise<RapportComptable> {
        const ecritures = await this.ledgerRepo.find({
            where: { etablissementId, periode },
            order: { dateEcriture: 'ASC', numeroEcriture: 'ASC' },
        });

        let totalDebits = 0;
        let totalCredits = 0;

        for (const ecriture of ecritures) {
            if (ecriture.sens === SensEcriture.DEBIT) {
                totalDebits += ecriture.montant;
            } else {
                totalCredits += ecriture.montant;
            }
        }

        return {
            periode,
            etablissementId,
            totalDebits,
            totalCredits,
            solde: totalDebits - totalCredits,
            ecritures,
        };
    }

    /**
     * Exporte le rapport en format CSV.
     */
    async exporterCSV(etablissementId: string, periode: string): Promise<string> {
        const rapport = await this.getRapportComptable(etablissementId, periode);

        const header = 'Date;N° Écriture;Type;Sens;Compte;Libellé;Montant (XAF);Solde Cumulé\n';
        const rows = rapport.ecritures.map((e) =>
            `${e.dateEcriture};${e.numeroEcriture};${e.typeTransaction};${e.sens};${e.compteComptable};${e.libelle};${e.montant};${e.soldeCumule}`
        ).join('\n');

        const footer = `\n;;;;;;TOTAL DÉBIT: ${rapport.totalDebits};TOTAL CRÉDIT: ${rapport.totalCredits};SOLDE: ${rapport.solde}`;

        return header + rows + footer;
    }

    /**
     * Génère un numéro d'écriture séquentiel OHADA.
     */
    private async genererNumeroEcriture(periode: string): Promise<string> {
        const year = periode.split('-')[0];
        const prefix = `JRN-${year}`;

        const lastEcriture = await this.ledgerRepo
            .createQueryBuilder('l')
            .where('l.numeroEcriture LIKE :prefix', { prefix: `${prefix}-%` })
            .orderBy('l.createdAt', 'DESC')
            .getOne();

        let sequence = 1;
        if (lastEcriture) {
            const parts = lastEcriture.numeroEcriture.split('-');
            const lastSeq = parseInt(parts[parts.length - 1].replace(/-[DC]$/, ''), 10);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }

        return `${prefix}-${String(sequence).padStart(6, '0')}`;
    }

    /**
     * Récupère le dernier solde cumulé pour un établissement.
     */
    private async getDernierSolde(etablissementId: string): Promise<number> {
        const result = await this.ledgerRepo
            .createQueryBuilder('l')
            .select('l.soldeCumule', 'dernierSolde')
            .where('l.etablissementId = :etablissementId', { etablissementId })
            .orderBy('l.createdAt', 'DESC')
            .limit(1)
            .getRawOne();

        return result?.dernierSolde || 0;
    }
}

export default LedgerService;
