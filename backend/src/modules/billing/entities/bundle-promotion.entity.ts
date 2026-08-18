/**
 * ==================================
 * eLISAschool - Entité BundlePromotion (Refonte v4.0)
 * ==================================
 *
 * Bundle commercial : combo de packs quota avec remise spéciale.
 * Exemple : "Pack Stockage + SMS" → −25% sur le prix total du bundle.
 *
 * Un bundle référence N packs (min 2). Quand le tenant souscrit à tous
 * les packs du bundle, la remise bundle s'applique automatiquement
 * (ou via code coupon si défini).
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TypeRemiseBundle {
    /** Pourcentage sur le prix total des packs du bundle */
    POURCENTAGE = 'POURCENTAGE',
    /** Montant fixe déduit */
    MONTANT_FIXE = 'MONTANT_FIXE',
}

@Entity('bundle_promotions')
@Index(['actif'])
@Index(['code'], { unique: true })
export class BundlePromotion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code unique du bundle (ex: 'BUNDLE-STOCKAGE-SMS') */
    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    /** IDs des packs requis (minimum 2) */
    @Column({ type: 'uuid', array: true })
    packIds!: string[];

    /** Type de réduction du bundle */
    @Column({ type: 'varchar', length: 20, default: TypeRemiseBundle.POURCENTAGE })
    typeRemise!: TypeRemiseBundle;

    /** Valeur : % (0-100) ou montant fixe en devise */
    @Column({ type: 'decimal', precision: 12, scale: 2 })
    valeur!: number;

    /** Code coupon optionnel (null = application auto si tous packs présents) */
    @Column({ type: 'varchar', length: 100, nullable: true })
    codeCoupon?: string;

    /** Date de début de validité */
    @Column({ type: 'timestamp', default: () => 'now()' })
    dateDebut!: Date;

    /** Date de fin de validité (null = pas de fin) */
    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    /** Nombre max d'utilisations (null = illimité) */
    @Column({ type: 'int', nullable: true })
    maxUtilisations?: number;

    @Column({ type: 'int', default: 0 })
    utilisations!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /** Priorité (plus grand = appliqué en premier) */
    @Column({ type: 'int', default: 0 })
    priorite!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
