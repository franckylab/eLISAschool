/**
 * ==================================
 * eLISAschool - Entité UsageMeter
 * ==================================
 * 
 * Compteur d'utilisation par module par établissement par période.
 * Incrémenté à chaque opération (création élève, export PDF, etc.)
 * Permet le suivi de consommation pour les quotas et la facturation.
 * 
 * Phase B.1 — Refonte SaaS v2
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('usage_meters')
@Index(['etablissementId', 'moduleNom', 'periode'], { unique: true })
@Index(['etablissementId'])
@Index(['periode'])
export class UsageMeter {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    /** Nom du module (ex: 'eleves', 'export_pdf', 'sms', 'bulletins') */
    @Column({ type: 'varchar', length: 100 })
    moduleNom!: string;

    /** Consommation actuelle pour la période */
    @Column({ type: 'int', default: 0 })
    consommation!: number;

    /** Période au format YYYY-MM (ex: '2025-01') */
    @Column({ type: 'varchar', length: 7 })
    periode!: string;

    /** Limite max pour cette période (0 = illimité) */
    @Column({ type: 'int', default: 0 })
    limiteMax!: number;

    /** Alerte 80% envoyée */
    @Column({ type: 'boolean', default: false })
    alerte80Envoyee!: boolean;

    /** Blocage actif (quota dépassé) */
    @Column({ type: 'boolean', default: false })
    bloque!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
