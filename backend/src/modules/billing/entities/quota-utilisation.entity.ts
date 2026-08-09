/**
 * ==================================
 * eLISAschool - Entité QuotaUtilisation
 * ==================================
 * 
 * Suit la consommation des quotas par établissement.
 * Permet de vérifier si un établissement a atteint ses limites.
 * 
 * Phase 4.3 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('quotas_utilisation')
@Index(['etablissementId', 'typeQuota'], { unique: true })
export class QuotaUtilisation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 50 })
    typeQuota!: string; // 'eleves', 'utilisateurs', 'classes', 'stockage_go', 'sms_mensuel'

    @Column({ type: 'int', default: 0 })
    utilisationActuelle!: number;

    @Column({ type: 'int', default: 0 })
    limiteMax!: number; // 0 = illimité

    @Column({ type: 'boolean', default: false })
    alerte80pourcent!: boolean; // Alerte envoyée à 80%

    @Column({ type: 'boolean', default: false })
    bloquer!: boolean; // Blocage à 100%

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
