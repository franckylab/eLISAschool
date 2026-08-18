/**
 * ==================================
 * eLISAschool - Entité Promotion (Refonte v4.0)
 * ==================================
 *
 * Promotion commerciale unifiée avec système de scope multi-cible :
 *   - PLAN   : remise sur le forfait plan (base + élèves sup.)
 *   - PACK   : remise sur un pack quota spécifique ou ressource
 *   - MODULE : remise sur un module supplémentaire (ou gratuité N mois)
 *   - BUNDLE : remise sur un combo de packs ( BundlePromotion )
 *
 * Moteur en cascade 5 phases (plan → packs → quota → modules → gratuités),
 * chaque scope a son propre plafond (40% sur plan, pas de plafond sur options).
 *
 * Type GRATUITE : module offert temporairement (dureeApplication = N_MOIS_GRATUIT).
 * Conditions JSONB : nombreElevesMin, ancienneteMois, plansRequis, packsRequis, etc.
 *
 * Remplace l'ancienne entité RemiseAbonnement (migration 215).
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// =============================================
// ENUMS
// =============================================

export enum TypePromotion {
    /** Pourcentage du montant (0-100) */
    POURCENTAGE = 'POURCENTAGE',
    /** Montant fixe déduit en devise */
    MONTANT_FIXE = 'MONTANT_FIXE',
    /** Accès gratuit temporaire (module offert N mois) */
    GRATUITE = 'GRATUITE',
}

export enum ScopePromotion {
    /** Remise sur le forfait plan (base + élèves sup.) */
    PLAN = 'PLAN',
    /** Remise sur un pack quota */
    PACK = 'PACK',
    /** Remise sur un module supplémentaire */
    MODULE = 'MODULE',
    /** Remise sur un bundle de packs */
    BUNDLE = 'BUNDLE',
    /** Remise sur une ressource quota spécifique (élèves, stockage, SMS…) */
    QUOTA = 'QUOTA',
}

export enum DureeApplicationPromotion {
    /** Uniquement la première facture */
    PREMIERE_FACTURE = 'PREMIERE_FACTURE',
    /** Pendant N cycles (champ nbCycles) */
    N_CYCLES = 'N_CYCLES',
    /** Tant que l'abonnement vit */
    PERMANENTE = 'PERMANENTE',
    /** Pendant N mois (pour gratuités modules) */
    N_MOIS_GRATUIT = 'N_MOIS_GRATUIT',
}

// =============================================
// TYPES JSONB
// =============================================

/** Conditions d'éligibilité d'une promotion */
export interface ConditionsPromotion {
    /** Nombre minimum d'élèves */
    nombreElevesMin?: number;
    /** Ancienneté minimum en mois révolus */
    ancienneteMois?: number;
    /** Plans requis pour être éligible (IDs, vide = tous) */
    plansRequis?: string[];
    /** Packs déjà souscrits requis (IDs, pour cross-sell pack→pack) */
    packsRequis?: string[];
    /** Modules déjà souscrits requis (IDs) */
    modulesRequis?: string[];
    /** Ressource ciblée pour scope=PACK (ex: 'stockageGo', 'eleves', 'sms') */
    ressourceCible?: string;
    /** Nombre max de cycles pour N_CYCLES */
    nbCycles?: number;
    /** Nombre de mois de gratuité pour type=GRATUITE */
    dureeGratuiteMois?: number;
}

/** Palier de volume pour dégressivité */
export interface PalierVolume {
    /** Quantité minimum (ex: 50 élèves) */
    min: number;
    /** Quantité maximum (null = illimité) */
    max: number | null;
    /** Valeur du palier (% ou montant fixe) */
    valeur: number;
}

/** Configuration additionnelle selon le type */
export interface ConfigPromotion {
    /** Prix original du bundle (pour affichage économie) */
    prixOriginalBundle?: number;
    /** Réduction fixe sur le bundle en devise */
    reductionBundle?: number;
    /** Description longue / note interne */
    noteInterne?: string;
    /** Paliers de volume pour dégressivité (scope=QUOTA ou PACK) */
    paliersVolume?: PalierVolume[];
    /** Ressource ciblée pour scope=QUOTA (ex: 'eleves', 'stockageGo', 'sms') */
    quotaRessource?: string;
    /** Type de déclencheur automatique */
    typeAutomatique?: TypeAutoPromotion;
    /** Configuration du déclencheur (jours essai, mois fidélité, etc.) */
    declencheur?: Record<string, unknown>;
}

/** Types de promotions automatiques contextuelles */
export enum TypeAutoPromotion {
    /** Aucune — promotion manuelle (défaut) */
    MANUELLE = 'MANUELLE',
    /** Nouveau client (premier abonnement) */
    NOUVEAU_CLIENT = 'NOUVEAU_CLIENT',
    /** Fidélité (ancienneté minimum) */
    FIDELITE = 'FIDELITE',
    /** Upgrade de plan (cross-sell) */
    UPGRADE = 'UPGRADE',
    /** Cross-sell pack→pack ou module→module */
    CROSS_SELL = 'CROSS_SELL',
    /** Free trial module premium (N mois) */
    FREE_TRIAL = 'FREE_TRIAL',
}

// =============================================
// ENTITÉ
// =============================================

@Entity('promotions')
@Index(['scope', 'cibleId'])
@Index(['actif'])
@Index(['codeCoupon'], { where: '"codeCoupon" IS NOT NULL' })
export class Promotion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code interne unique */
    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    /** Type de réduction appliquée */
    @Column({ type: 'varchar', length: 20, default: TypePromotion.POURCENTAGE })
    typePromotion!: TypePromotion;

    /** Scope — sur quoi la promotion s'applique */
    @Column({ type: 'varchar', length: 20, default: ScopePromotion.PLAN })
    scope!: ScopePromotion;

    /** ID de la cible selon le scope (planId, packId, moduleId, bundleId) */
    @Column({ type: 'uuid', nullable: true })
    cibleId?: string;

    /** Ressource ciblée pour scope=PACK (ex: 'stockageGo') — null = tous les packs */
    @Column({ type: 'varchar', length: 100, nullable: true })
    cibleRessource?: string;

    /** Valeur : % (0-100) ou montant fixe en devise */
    @Column({ type: 'decimal', precision: 12, scale: 2 })
    valeur!: number;

    /** Durée d'application */
    @Column({ type: 'varchar', length: 30, default: DureeApplicationPromotion.PREMIERE_FACTURE })
    dureeApplication!: DureeApplicationPromotion;

    /** Conditions d'éligibilité (JSONB) */
    @Column({ type: 'jsonb', nullable: true })
    conditions?: ConditionsPromotion;

    /** Configuration additionnelle (JSONB) */
    @Column({ type: 'jsonb', nullable: true })
    config?: ConfigPromotion;

    /** Cumulable avec d'autres promotions du même scope */
    @Column({ type: 'boolean', default: false })
    cumulable!: boolean;

    /** Priorité d'application (plus grand = appliqué en premier) */
    @Column({ type: 'int', default: 0 })
    priorite!: number;

    /** Code coupon saisissable (null = application automatique) */
    @Column({ type: 'varchar', length: 100, nullable: true })
    codeCoupon?: string;

    /** Nombre maximum d'utilisations (null = illimité) */
    @Column({ type: 'int', nullable: true })
    maxUtilisations?: number;

    /** Compteur d'utilisations effectives */
    @Column({ type: 'int', default: 0 })
    utilisations!: number;

    /** Date de début de validité */
    @Column({ type: 'timestamp', default: () => 'now()' })
    dateDebut!: Date;

    /** Date de fin de validité (null = pas de fin) */
    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    /** Activation/désactivation */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /** Promotion programmée (activée automatiquement à dateProgrammation) */
    @Column({ type: 'boolean', default: false })
    estProgrammee!: boolean;

    /** Date d'activation programmée (null = non programmée) */
    @Column({ type: 'timestamp', nullable: true })
    dateProgrammation?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
