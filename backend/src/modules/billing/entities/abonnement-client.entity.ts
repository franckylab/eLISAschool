/**
 * ==================================
 * eLISAschool - Entité AbonnementClient
 * ==================================
 * 
 * Représente l'abonnement d'un établissement à un plan.
 * Gère le cycle de vie : ACTIF, EXPIRE, SUSPENDU, ANNULE.
 * 
 * Phase 4.1 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { PlanAbonnement } from './plan-abonnement.entity';
import { Facture } from './facture.entity';
import { AbonnementModule } from './abonnement-module.entity';

export enum StatutAbonnement {
    ACTIF = 'ACTIF',
    EXPIRE = 'EXPIRE',
    SUSPENDU = 'SUSPENDU',
    ANNULE = 'ANNULE',
    EN_ATTENTE = 'EN_ATTENTE',
}

export enum CycleFacturation {
    MENSUEL = 'MENSUEL',
    ANNUEL = 'ANNUEL',
}

@Entity('abonnements_client')
@Index(['etablissementId'])
@Index(['statut'])
@Index(['dateFin'])
export class AbonnementClient {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    @Column({ type: 'uuid' })
    planId!: string;

    @ManyToOne(() => PlanAbonnement, (plan) => plan.abonnements)
    @JoinColumn({ name: 'planId' })
    plan!: PlanAbonnement;

    @Column({ type: 'timestamp' })
    dateDebut!: Date;

    @Column({ type: 'timestamp' })
    dateFin!: Date;

    @Column({ type: 'enum', enum: StatutAbonnement, default: StatutAbonnement.EN_ATTENTE })
    statut!: StatutAbonnement;

    @Column({ type: 'enum', enum: CycleFacturation, default: CycleFacturation.MENSUEL })
    cycleFacturation!: CycleFacturation;

    @Column({ type: 'boolean', default: true })
    autoRenouvellement!: boolean;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantMensuel!: number; // Montant mensuel effectif (base + tranches)

    @Column({ type: 'int', default: 0 })
    nombreElevesActuel!: number; // Nombre d'élèves au dernier calcul

    @Column({ type: 'timestamp', nullable: true })
    dernierPaiement?: Date;

    @Column({ type: 'timestamp', nullable: true })
    prochaineFacturation?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    // Relations
    @OneToMany(() => Facture, (facture) => facture.abonnement)
    factures!: Facture[];

    @OneToMany(() => AbonnementModule, (am) => am.abonnement)
    modules!: AbonnementModule[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
