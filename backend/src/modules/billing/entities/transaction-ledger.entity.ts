/**
 * ==================================
 * eLISAschool - Entité TransactionLedger
 * ==================================
 * 
 * Ledger double entrée pour la comptabilité OHADA.
 * Chaque paiement génère une écriture débit (plateforme) + crédit (établissement).
 * Le solde cumulé permet le suivi en temps réel.
 * 
 * Phase B.5 — Refonte SaaS v2
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum TypeTransactionLedger {
    FACTURATION = 'FACTURATION',
    PAIEMENT = 'PAIEMENT',
    AVOIR = 'AVOIR',
    REMBOURSEMENT = 'REMBOURSEMENT',
    AJUSTEMENT = 'AJUSTEMENT',
    PENALITE_RETARD = 'PENALITE_RETARD',
}

export enum SensEcriture {
    DEBIT = 'DEBIT',
    CREDIT = 'CREDIT',
}

@Entity('transactions_ledger')
@Index(['etablissementId'])
@Index(['factureId'])
@Index(['dateEcriture'])
@Index(['typeTransaction'])
@Index(['etablissementId', 'periode'], { unique: false })
export class TransactionLedger {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Numéro séquentiel OHADA (ex: 'JRN-2025-000001') */
    @Column({ type: 'varchar', length: 50, unique: true })
    numeroEcriture!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'uuid', nullable: true })
    factureId?: string;

    @Column({ type: 'enum', enum: TypeTransactionLedger })
    typeTransaction!: TypeTransactionLedger;

    @Column({ type: 'enum', enum: SensEcriture })
    sens!: SensEcriture;

    /** Compte comptable OHADA (ex: '411-CLIENTS', '521-BANQUE') */
    @Column({ type: 'varchar', length: 20 })
    compteComptable!: string;

    /** Libellé de l'écriture */
    @Column({ type: 'varchar', length: 255 })
    libelle!: string;

    /** Montant en XAF/XOF (entiers, pas de float) */
    @Column({ type: 'int' })
    montant!: number;

    /** Solde cumulé après cette écriture */
    @Column({ type: 'int', default: 0 })
    soldeCumule!: number;

    /** Période comptable YYYY-MM */
    @Column({ type: 'varchar', length: 7 })
    periode!: string;

    @Column({ type: 'date' })
    dateEcriture!: Date;

    /** Référence au document source (facture, paiement, avoir) */
    @Column({ type: 'uuid', nullable: true })
    referenceId?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
