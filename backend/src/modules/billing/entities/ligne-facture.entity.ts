/**
 * ==================================
 * eLISAschool - Entité LigneFacture
 * ==================================
 * 
 * Détail d'une ligne de facture (base, tranche, option, pénalité).
 * 
 * Phase 4.1 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Facture } from './facture.entity';

export enum TypeLigneFacture {
    BASE = 'BASE',
    TRANCHE = 'TRANCHE',
    OPTION = 'OPTION',
    PENALITE = 'PENALITE',
    REMISE = 'REMISE',
    PRORATA = 'PRORATA',
}

@Entity('lignes_facture')
@Index(['factureId'])
export class LigneFacture {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    factureId!: string;

    @ManyToOne(() => Facture, (facture) => facture.lignes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'factureId' })
    facture!: Facture;

    @Column({ type: 'varchar', length: 200 })
    description!: string;

    @Column({ type: 'enum', enum: TypeLigneFacture })
    type!: TypeLigneFacture;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montant!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
    quantite!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    total!: number; // montant * quantite

    @Column({ type: 'int', default: 0 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'uuid', nullable: true })
    referenceId?: string; // ID de l'entité liée (trancheId, moduleId, etc.)
}
