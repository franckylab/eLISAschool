/**
 * ==================================
 * eLISAschool - Entité RemiseAbonnement
 * ==================================
 *
 * Remise commerciale sur abonnement SaaS avec stratégie d'application
 * (Refonte v3, migration 213). CRUD complet côté plateforme.
 *
 * v3.1 — Colonnes conditionnelles (conditionElevesMin, conditionAncienneteMois)
 *        + plafond global 40% appliqué par le moteur.
 *
 * Version: 3.1.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TypeRemise {
    /** Pourcentage du montant (0-100) */
    POURCENTAGE = 'POURCENTAGE',
    /** Montant fixe déduit en devise */
    MONTANT_FIXE = 'MONTANT_FIXE',
}

export enum DureeApplicationRemise {
    /** Uniquement la première facture */
    PREMIERE_FACTURE = 'PREMIERE_FACTURE',
    /** Pendant N cycles (champ nbCycles) */
    N_CYCLES = 'N_CYCLES',
    /** Tant que l'abonnement vit */
    PERMANENTE = 'PERMANENTE',
}

export enum CibleRemise {
    /** Tous les abonnements */
    GLOBAL = 'GLOBAL',
    /** Un plan précis (cibleId = planId) */
    PLAN = 'PLAN',
    /** Un établissement précis (cibleId = etablissementId) */
    TENANT = 'TENANT',
    /** Un cycle précis (cibleCycle = code du cycle) */
    CYCLE = 'CYCLE',
}

/**
 * @deprecated Supprimée en v4.0 (migration 216). Table renommée _legacy_remises_abonnement.
 * Utiliser PromotionEntity + BundlePromotionEntity à la place.
 * Conservée uniquement pour rollback et compatibilité lecture seule.
 */
@Entity('_legacy_remises_abonnement')
@Index(['cible', 'cibleId'])
@Index(['actif'])
export class RemiseAbonnement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code interne unique de la remise */
    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    @Column({ type: 'varchar', length: 20, default: TypeRemise.POURCENTAGE })
    typeRemise!: TypeRemise;

    /** Valeur : % (0-100) ou montant fixe en devise */
    @Column({ type: 'decimal', precision: 12, scale: 2 })
    valeur!: number;

    @Column({ type: 'varchar', length: 30, default: DureeApplicationRemise.PREMIERE_FACTURE })
    dureeApplication!: DureeApplicationRemise;

    /** Nombre de cycles (si dureeApplication = N_CYCLES) */
    @Column({ type: 'int', nullable: true })
    nbCycles?: number;

    @Column({ type: 'varchar', length: 20, default: CibleRemise.GLOBAL })
    cible!: CibleRemise;

    /** ID de la cible (planId, etablissementId…) selon cible */
    @Column({ type: 'uuid', nullable: true })
    cibleId?: string;

    /** Code cycle visé (si cible = CYCLE) */
    @Column({ type: 'varchar', length: 30, nullable: true })
    cibleCycle?: string;

    @Column({ type: 'timestamp', default: () => 'now()' })
    dateDebut!: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    /** Nombre maximum d'utilisations (null = illimité) */
    @Column({ type: 'int', nullable: true })
    maxUtilisations?: number;

    @Column({ type: 'int', default: 0 })
    utilisations!: number;

    /** Cumulable avec d'autres remises (sinon la plus prioritaire gagne seule) */
    @Column({ type: 'boolean', default: false })
    cumulable!: boolean;

    /** Ordre d'application — les plus grandes priorités d'abord */
    @Column({ type: 'int', default: 0 })
    priorite!: number;

    /** Code coupon saisissable par le tenant (null = application automatique) */
    @Column({ type: 'varchar', length: 100, nullable: true })
    codeCoupon?: string;

    /** Nombre minimum d'élèves pour que la remise s'applique (null = pas de condition) */
    @Column({ type: 'int', nullable: true })
    conditionElevesMin?: number;

    /** Ancienneté minimum en mois pour que la remise s'applique (null = pas de condition) */
    @Column({ type: 'int', nullable: true })
    conditionAncienneteMois?: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
