/**
 * ==================================
 * eLISAschool - Entité TrancheEleves
 * ==================================
 * 
 * Définit les tranches de pricing supplémentaire par nombre d'élèves.
 * Ex: 301-800 élèves = +15000/mois, 801-1200 = +20000/mois.
 * 
 * Phase 4.1 — Refonte SaaS
 * Phase B.3 — Refonte SaaS v2 (ordre, etablissementId)
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PlanAbonnement } from './plan-abonnement.entity';

@Entity('tranches_eleves')
@Index(['planId', 'minEleves'], { unique: true })
@Index(['ordre'])
export class TrancheEleves {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    planId!: string;

    @ManyToOne(() => PlanAbonnement, (plan) => plan.tranches, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'planId' })
    plan!: PlanAbonnement;

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
    label?: string; // Ex: "Tranche 301-800 élèves"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /** [v5] Indique si cette tranche est customisable par l’établissement */
    @Column({ type: 'boolean', default: false })
    estCustomisable!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
