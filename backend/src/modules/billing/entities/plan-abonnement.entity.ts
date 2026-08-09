/**
 * ==================================
 * eLISAschool - Entité PlanAbonnement
 * ==================================
 * 
 * Définit un plan d'abonnement plateforme (ex: Starter, Pro, Enterprise).
 * Chaque plan a un prix de base, des quotas max et des modules inclus.
 * 
 * Phase 4.1 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TrancheEleves } from './tranche-eleves.entity';
import { AbonnementClient } from './abonnement-client.entity';

export enum StatutPlan {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    ARRETE = 'ARRETE',
}

/** Mode de facturation des tranches — Lot B v7 */
export enum ModeFacturationTranches {
    /** Recomputation par nb élèves réel + prorata inter-cycle */
    AUTO = 'auto',
    /** Tranche souscrite manuellement, facturation fixe */
    DECLARATIF = 'declarative',
}

@Entity('plans_abonnement')
export class PlanAbonnement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    slug!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    prixBase!: number; // Prix mensuel de base en devise locale

    @Column({ type: 'varchar', length: 10, default: 'XAF' })
    devise!: string;

    @Column({ type: 'int' })
    maxEleves!: number; // Nombre max d'élèves inclus dans le prix de base

    @Column({ type: 'int', default: 0 })
    maxUtilisateurs!: number; // 0 = illimité

    @Column({ type: 'int', default: 0 })
    maxClasses!: number; // 0 = illimité

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    stockageMaxGo!: number; // Stockage max en Go

    @Column({ type: 'int', default: 0 })
    smsInclus!: number; // Nombre de SMS inclus par mois

    @Column({ type: 'simple-json', nullable: true })
    modulesInclus!: string[]; // Liste des slugs de modules inclus

    @Column({ type: 'simple-json', nullable: true })
    featureFlags!: Record<string, boolean>; // Feature flags activés par ce plan

    @Column({ type: 'enum', enum: StatutPlan, default: StatutPlan.ACTIF })
    statut!: StatutPlan;

    @Column({ type: 'boolean', default: true })
    visible!: boolean; // Visible dans le catalogue

    @Column({ type: 'int', default: 0 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'varchar', length: 50, nullable: true })
    badge?: string; // Ex: "Populaire", "Meilleur rapport qualité-prix"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /** [v5] Active la customisation des tranches par établissement */
    @Column({ type: 'boolean', default: true })
    tranchesConfigurables!: boolean;

    // ==========================================
    // Lot B v7 — Tranches hybride
    // ==========================================

    /** Mode de facturation des tranches : auto (recomputation) ou declaratif (souscription) */
    @Column({ type: 'varchar', length: 20, default: ModeFacturationTranches.AUTO })
    modeFacturationTranches!: ModeFacturationTranches;

    /** Tolérance de dépassement en % (ex: 10 = alerte à 110% du plafond) */
    @Column({ type: 'int', default: 10 })
    toleranceDepassement!: number;

    /** Prorata immédiat lors d'un changement de tranche en cours de cycle */
    @Column({ type: 'boolean', default: true })
    prorataImmediat!: boolean;

    /** Blocage au-delà du plafond (true = bloque, false = facture complémentaire) */
    @Column({ type: 'boolean', default: false })
    blocageAuDela!: boolean;

    /** Plafond max d'élèves (null = illimité). Au-delà → workflow critique. */
    @Column({ type: 'int', nullable: true, default: null })
    plafondMaxEleves?: number | null;

    // Relations
    @OneToMany(() => TrancheEleves, (tranche) => tranche.plan)
    tranches!: TrancheEleves[];

    @OneToMany(() => AbonnementClient, (abo) => abo.plan)
    abonnements!: AbonnementClient[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
