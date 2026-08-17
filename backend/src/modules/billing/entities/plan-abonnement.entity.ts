/**
 * ==================================
 * eLISAschool - Entité PlanAbonnement (v3)
 * ==================================
 *
 * Plan d'abonnement plateforme 100% piloté par données JSONB.
 * Refonte v3 (migration 213) : les colonnes dures (maxEleves, maxClasses,
 * tolérance, blocage…) sont remplacées par 3 blocs configurables :
 *   - tarification : prixBase, prixParEleve, elevesInclusGratuits, paliers
 *   - quotas       : eleves, utilisateurs, classes, stockageGo, sms, …
 *   - entitlements : modules[] et fonctionnalites[] inclus
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AbonnementClient } from './abonnement-client.entity';

export enum StatutPlan {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    ARRETE = 'ARRETE',
}

/** Palier de prix unitaire dégressif (remplace les tranches plates) */
export interface PalierTarification {
    /** Seuil d'élèves à partir duquel le prix unitaire s'applique */
    seuilEleves: number;
    /** Prix par élève au-delà du seuil */
    prixParEleve: number;
}

/** Bloc tarification — formule : prixBase + max(0, nbÉlèves − franchise) × prixParEleve */
export interface TarificationPlan {
    /** Forfait socle mensuel */
    prixBase: number;
    /** Montant unitaire par élève au-delà de la franchise */
    prixParEleve: number;
    /** Nombre d'élèves gratuits (franchise) */
    elevesInclusGratuits: number;
    /** Paliers dégressifs optionnels (triés par seuilEleves croissant) */
    paliers?: PalierTarification[];
}

/** Bloc quotas — clés libres, extensibles sans migration */
export interface QuotasPlan {
    /** 0 = illimité */
    eleves?: number;
    utilisateurs?: number;
    classes?: number;
    stockageGo?: number;
    sms?: number;
    [ressource: string]: number | undefined;
}

/** Bloc droits d'accès inclus dans le plan */
export interface EntitlementsPlan {
    /** Codes modules inclus (alignés modules_catalogue.code) */
    modules: string[];
    /** Codes fonctionnalités incluses (feature_flag_definitions.cle) */
    fonctionnalites: string[];
}

/** Configuration d'essai propre au plan */
export interface EssaiPlan {
    autorise: boolean;
    /** Override de la durée plateforme (jours) */
    dureeJours?: number;
    /** Quotas réduits pendant l'essai */
    quotasReduits?: boolean;
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
    prixBase!: number; // Prix mensuel de base (miroir de tarification.prixBase)

    @Column({ type: 'varchar', length: 10, default: 'XAF' })
    devise!: string;

    /** Rang ordinal du plan — remplace les rangs hardcodés du moteur v2 */
    @Column({ type: 'int', default: 0 })
    rang!: number;

    /** Plan attribué automatiquement en mode d'onboarding PLAN_DEFAUT (un seul à true) */
    @Column({ type: 'boolean', default: false })
    estParDefaut!: boolean;

    /** Visible dans la grille publique de souscription tenant */
    @Column({ type: 'boolean', default: true })
    visiblePubliquement!: boolean;

    /** Bloc tarification v3 (prix/élève + franchise + paliers) */
    @Column({ type: 'jsonb', default: {} })
    tarification!: TarificationPlan;

    /** Bloc quotas v3 — métriques libres et extensibles */
    @Column({ type: 'jsonb', default: {} })
    quotas!: QuotasPlan;

    /** Bloc droits inclus v3 (modules + fonctionnalités) */
    @Column({ type: 'jsonb', default: {} })
    entitlements!: EntitlementsPlan;

    /** Codes de cycles de facturation autorisés (réf. cycles_facturation.code) */
    @Column({ type: 'jsonb', default: ['MENSUEL', 'ANNUEL'] })
    cyclesAutorises!: string[];

    /** Configuration d'essai du plan */
    @Column({ type: 'jsonb', default: { autorise: false } })
    essai!: EssaiPlan;

    @Column({ type: 'enum', enum: StatutPlan, default: StatutPlan.ACTIF })
    statut!: StatutPlan;

    @Column({ type: 'boolean', default: true })
    visible!: boolean; // Visible dans le catalogue plateforme

    @Column({ type: 'int', default: 0 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'varchar', length: 50, nullable: true })
    badge?: string; // Ex: "Populaire", "Meilleur rapport qualité-prix"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    // Relations
    @OneToMany(() => AbonnementClient, (abo) => abo.plan)
    abonnements!: AbonnementClient[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
