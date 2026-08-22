/**
 * ==================================
 * eLISAschool - Entité PackagePromotion (Refonte v4.0)
 * ==================================
 *
 * Package commercial : combo de packs quota avec remise spéciale.
 * Exemple : "Pack Stockage + SMS" → −25% sur le prix total du package.
 *
 * Un package référence N packs (min 2). Quand le tenant souscrit à tous
 * les packs du package, la remise package s'applique automatiquement
 * (ou via code coupon si défini).
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TypeRemisePackage {
    /** Pourcentage sur le prix total des packs du package */
    POURCENTAGE = 'POURCENTAGE',
    /** Montant fixe déduit */
    MONTANT_FIXE = 'MONTANT_FIXE',
}

@Entity('package_promotions')
@Index(['actif'])
@Index(['code'], { unique: true })
export class PackagePromotion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code unique du package (ex: 'PKG-STOCKAGE-SMS') */
    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    /** IDs des packs requis (minimum 2) */
    @Column({ type: 'uuid', array: true })
    packIds!: string[];

    /** Type de réduction du package */
    @Column({ type: 'varchar', length: 20, default: TypeRemisePackage.POURCENTAGE })
    typeRemise!: TypeRemisePackage;

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
