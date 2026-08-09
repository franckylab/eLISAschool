/**
 * ==================================
 * eLISAschool - Entité ProviderAssignment
 * ==================================
 * 
 * Assignment des providers aux plans/établissements.
 * Cascade : global → plan → établissement.
 * 
 * Lot D v7 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ProviderPaiement } from './provider-paiement.entity';
import { PlanAbonnement } from './plan-abonnement.entity';

export enum ScopeAssignment {
    GLOBAL = 'global',
    PLAN = 'plan',
    ETABLISSEMENT = 'etablissement',
}

@Entity('provider_assignments')
@Index(['providerId'])
@Index(['scope'])
export class ProviderAssignment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    providerId!: string;

    @ManyToOne(() => ProviderPaiement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'providerId' })
    provider!: ProviderPaiement;

    @Column({ type: 'varchar', length: 20, default: ScopeAssignment.GLOBAL })
    scope!: ScopeAssignment;

    @Column({ type: 'uuid', nullable: true })
    planId?: string;

    @ManyToOne(() => PlanAbonnement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'planId' })
    plan?: PlanAbonnement;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @Column({ type: 'int', default: 0 })
    priorite!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    creeAt!: Date;

    @UpdateDateColumn()
    majAt!: Date;
}
