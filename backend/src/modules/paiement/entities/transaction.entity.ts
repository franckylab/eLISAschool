/**
 * ==================================
 * eLISAschool - Entité Transaction
 * ==================================
 * 
 * Enregistre chaque transaction de paiement.
 * Liée à une facture d'abonnement.
 * 
 * Phase 5.1 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

export enum StatutTransaction {
    INITIEE = 'INITIEE',
    EN_ATTENTE = 'EN_ATTENTE',
    REUSSIE = 'REUSSIE',
    ECHEC = 'ECHEC',
    EXPIREE = 'EXPIREE',
    REMBOURSEE = 'REMBOURSEE',
}

export enum TypeTransaction {
    PAIEMENT = 'PAIEMENT',
    REMBOURSEMENT = 'REMBOURSEMENT',
}

@Entity('transactions')
@Index(['reference'])
@Index(['etablissementId'])
@Index(['provider', 'referenceProvider'])
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    reference!: string; // Référence interne unique (idempotence key)

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'uuid', nullable: true })
    factureId?: string; // Lien vers la facture billing

    @Column({ type: 'enum', enum: TypeTransaction, default: TypeTransaction.PAIEMENT })
    type!: TypeTransaction;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montant!: number;

    @Column({ type: 'varchar', length: 10, default: 'XAF' })
    devise!: string;

    @Column({ type: 'varchar', length: 50 })
    provider!: string; // 'mtn-momo', 'orange-money', 'stripe', etc.

    @Column({ type: 'varchar', length: 200, nullable: true })
    referenceProvider?: string; // Référence côté provider

    @Column({ type: 'varchar', length: 50 })
    methodePaiement!: string; // 'mobile_money', 'card', 'bank_transfer'

    @Column({ type: 'enum', enum: StatutTransaction, default: StatutTransaction.INITIEE })
    statut!: StatutTransaction;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    metadata?: string; // JSON: données provider, logs, etc.

    @Column({ type: 'varchar', length: 500, nullable: true })
    urlPaiement?: string; // URL de redirection pour paiement web

    @Column({ type: 'int', default: 0 })
    tentatives!: number; // Nombre de tentatives (retry)

    @Column({ type: 'timestamp', nullable: true })
    datePaiement?: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateExpiration?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
