/**
 * ==================================
 * eLISAschool - Entité PaiementAbonnement
 * ==================================
 * 
 * Enregistre les paiements reçus pour les factures plateforme.
 * Distinct du module finances (paiements élèves).
 * 
 * Phase 4.1 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Facture } from './facture.entity';

export enum StatutPaiementAbonnement {
    EN_ATTENTE = 'EN_ATTENTE',
    REUSSI = 'REUSSI',
    ECHEC = 'ECHEC',
    REMBOURSE = 'REMBOURSE',
}

@Entity('paiements_abonnement')
@Index(['factureId'])
@Index(['referenceProvider'])
export class PaiementAbonnement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    factureId!: string;

    @ManyToOne(() => Facture, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'factureId' })
    facture!: Facture;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montant!: number;

    @Column({ type: 'varchar', length: 50 })
    methodePaiement!: string; // 'MTN_MOMO', 'ORANGE_MONEY', 'CARTE', 'VIREMENT'

    @Column({ type: 'varchar', length: 50 })
    provider!: string; // Nom du provider utilisé

    @Column({ type: 'varchar', length: 200, nullable: true })
    referenceProvider?: string; // Référence côté provider

    @Column({ type: 'enum', enum: StatutPaiementAbonnement, default: StatutPaiementAbonnement.EN_ATTENTE })
    statut!: StatutPaiementAbonnement;

    @Column({ type: 'timestamp', nullable: true })
    datePaiement?: Date;

    @Column({ type: 'text', nullable: true })
    metadata?: string; // JSON avec données supplémentaires

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
