/**
 * ==================================
 * eLISAschool - Entité CreditNote
 * ==================================
 * 
 * Avoir (credit note) lié à une facture.
 * Permet d'émettre un avoir partiel ou total sur une facture existante.
 * Conforme OHADA : numéro séquentiel, TVA séparée, mentions légales.
 * 
 * Phase B.1 — Refonte SaaS v2
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Facture } from './facture.entity';

export enum StatutCreditNote {
    BROUILLON = 'BROUILLON',
    EMIS = 'EMIS',
    UTILISE = 'UTILISE',
    ANNULE = 'ANNULE',
}

@Entity('credit_notes')
@Index(['factureId'])
@Index(['etablissementId'])
@Index(['numero'], { unique: true })
export class CreditNote {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Numéro séquentiel OHADA (ex: 'AV-2025-0001') */
    @Column({ type: 'varchar', length: 50, unique: true })
    numero!: string;

    @Column({ type: 'uuid' })
    factureId!: string;

    @ManyToOne(() => Facture, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'factureId' })
    facture!: Facture;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    /** Montant HT de l'avoir */
    @Column({ type: 'int' })
    montantHT!: number;

    /** Montant TVA de l'avoir */
    @Column({ type: 'int', default: 0 })
    montantTVA!: number;

    /** Montant TTC de l'avoir */
    @Column({ type: 'int' })
    montantTTC!: number;

    /** Raison de l'avoir */
    @Column({ type: 'text' })
    raison!: string;

    @Column({ type: 'enum', enum: StatutCreditNote, default: StatutCreditNote.BROUILLON })
    statut!: StatutCreditNote;

    /** Date d'émission */
    @Column({ type: 'date' })
    dateEmission!: Date;

    /** Mentions légales OHADA */
    @Column({ type: 'text', nullable: true })
    mentionsLegales?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
