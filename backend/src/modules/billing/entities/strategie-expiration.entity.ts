/**
 * ==================================
 * eLISAschool - Entité StrategieExpiration
 * ==================================
 *
 * Stratégie d'expiration d'abonnement : phases configurables de
 * dégradation gracieuse (Refonte v3, migration 213). Remplace le
 * calendrier 15j/15j/archivage hardcodé du moteur v2.
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ComportementPhase {
    /** Lecture seule : GET OK, mutations bloquées */
    READ_ONLY = 'READ_ONLY',
    /** Verrouillé : tous les modules non critiques bloqués */
    LOCKED = 'LOCKED',
    /** Archivé : données conservées, modules invisibles */
    ARCHIVED = 'ARCHIVED',
}

/** Phase de dégradation — jours null = durée illimitée (dernière phase) */
export interface PhaseExpiration {
    nom: string;
    jours: number | null;
    comportement: ComportementPhase;
}

@Entity('strategies_expiration')
export class StrategieExpiration {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code unique (ex: 'standard') */
    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    /** Phases ordonnées de dégradation */
    @Column({ type: 'jsonb', default: [] })
    phases!: PhaseExpiration[];

    /** Slug du plan concerné (null = stratégie générique) */
    @Column({ type: 'varchar', length: 100, nullable: true })
    planSlug?: string;

    /** Stratégie appliquée par défaut */
    @Column({ type: 'boolean', default: false })
    estDefaut!: boolean;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
