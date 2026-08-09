/**
 * ==================================
 * eLISAschool - Entité TrancheSupplement
 * ==================================
 * 
 * Override de tranches de pricing par établissement.
 * Permet à un établissement de customiser ses tranches
 * (montant, bornes) indépendamment du plan.
 * 
 * Cascade de résolution :
 *   1. TrancheSupplement (établissement) → priorité 1
 *   2. TrancheEleves (plan) → priorité 2
 *   3. Tranches système (défaut global) → fallback
 * 
 * Phase 3.1 — Refonte SaaS v5
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tranches_supplement')
@Index(['etablissementId', 'ordre'], { unique: true })
export class TrancheSupplement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    /** Ordre d'affichage / traitement (1 = première tranche) */
    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'int' })
    minEleves!: number; // Borne inférieure (exclusive)

    @Column({ type: 'int', nullable: true })
    maxEleves!: number | null; // Borne supérieure (inclusive), null = illimité

    @Column({ type: 'int' })
    montantSupplementaire!: number; // Montant ajouté au prix de base (en XAF/XOF entiers)

    @Column({ type: 'varchar', length: 100, nullable: true })
    label?: string; // Ex: "Tranche custom 301-800 élèves"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /** ID de la tranche plan originale (pour référence) */
    @Column({ type: 'uuid', nullable: true })
    trancheOriginaleId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
