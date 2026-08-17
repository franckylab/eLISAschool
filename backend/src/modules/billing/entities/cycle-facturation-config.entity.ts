/**
 * ==================================
 * eLISAschool - Entité CycleFacturationConfig
 * ==================================
 *
 * Cycle de facturation configurable en base (remplace l'enum dur
 * MENSUEL/ANNUEL — Refonte v3, migration 213).
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cycles_facturation')
export class CycleFacturationConfig {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code unique du cycle (ex: 'MENSUEL', 'ANNUEL') — référencé par abonnements_client.cycleFacturation */
    @Column({ type: 'varchar', length: 30, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    nomEn?: string;

    /** Durée du cycle en mois */
    @Column({ type: 'int', default: 1 })
    dureeMois!: number;

    /** Remise appliquée pour ce cycle (ex: 10 = -10% sur l'annuel) */
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    remisePourcent!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
