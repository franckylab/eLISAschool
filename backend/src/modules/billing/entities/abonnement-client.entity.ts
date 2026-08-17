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
    ESSAI = 'ESSAI',
    EXPIRE = 'EXPIRE',
    SUSPENDU = 'SUSPENDU',
    ANNULE = 'ANNULE',
    EN_ATTENTE = 'EN_ATTENTE',
}

/** Cycles de facturation — Refonte v3 : codes pilotés par la table cycles_facturation */
export enum CycleFacturation {
    MENSUEL = 'MENSUEL',
    TRIMESTRIEL = 'TRIMESTRIEL',
    SEMESTRIEL = 'SEMESTRIEL',
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

    /** Cycle de facturation — varchar pour supporter les cycles DB configurables (v3) */
    @Column({ type: 'varchar', length: 30, default: CycleFacturation.MENSUEL })
    cycleFacturation!: CycleFacturation;

    @Column({ type: 'boolean', default: true })
    autoRenouvellement!: boolean;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantMensuel!: number; // Montant mensuel effectif (formule v3 : base + prix/élève + packs − remises)

    @Column({ type: 'int', default: 0 })
    nombreElevesActuel!: number; // Nombre d'élèves au dernier calcul

    @Column({ type: 'timestamp', nullable: true })
    dernierPaiement?: Date;

    @Column({ type: 'timestamp', nullable: true })
    prochaineFacturation?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    /** Date de fin de période d'essai (14 jours après création) */
    @Column({ type: 'timestamp', nullable: true })
    periodeEssaiFin?: Date;

    /** Date réelle d'expiration (J0 dégradation) — trackée séparément de dateFin */
    @Column({ type: 'timestamp', nullable: true })
    dateExpirationReelle?: Date;

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
