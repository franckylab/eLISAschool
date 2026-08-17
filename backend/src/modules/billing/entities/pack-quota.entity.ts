/**
 * ==================================
 * eLISAschool - Entité PackQuota
 * ==================================
 *
 * Achat de quotas supplémentaires au dépassement (Refonte v3,
 * migration 213). Le pack augmente le quota effectif de l'abonnement
 * actif pour la ressource concernée.
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum DureeValiditePack {
    /** Valable jusqu'à la fin du cycle de facturation courant */
    CYCLE_COURANT = 'CYCLE_COURANT',
    /** Ajout permanent au quota (ex: stockage) */
    ILLIMITE = 'ILLIMITE',
}

@Entity('packs_quota')
@Index(['ressource'])
export class PackQuota {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code unique du pack (ex: 'PACK_ELEVES_50') */
    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    /** Ressource de quota augmentée (clé du bloc plan.quotas) */
    @Column({ type: 'varchar', length: 100 })
    ressource!: string;

    /** Quantité ajoutée au quota effectif */
    @Column({ type: 'int' })
    quantite!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    prix!: number;

    @Column({ type: 'varchar', length: 10, default: 'XAF' })
    devise!: string;

    @Column({ type: 'varchar', length: 20, default: DureeValiditePack.CYCLE_COURANT })
    dureeValidite!: DureeValiditePack;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
