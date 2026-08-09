/**
 * ==================================
 * eLISAschool - Entité FeatureFlagTenant
 * ==================================
 * 
 * Override de feature flag par tenant (établissement).
 * Permet d'activer/désactiver des features individuellement.
 * 
 * Résolution: plan (défaut) → override tenant → override global
 * 
 * Phase 4.4 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('feature_flags_tenant')
@Index(['etablissementId', 'flagName'], { unique: true })
export class FeatureFlagTenant {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 100 })
    flagName!: string; // Ex: 'module_transport', 'export_pdf', 'gamification'

    @Column({ type: 'boolean' })
    enabled!: boolean;

    @Column({ type: 'varchar', length: 50, default: 'MANUAL' })
    source!: string; // 'MANUAL', 'PLAN', 'GLOBAL_OVERRIDE'

    @Column({ type: 'uuid', nullable: true })
    modifiePar?: string; // ID de l'utilisateur ayant fait le toggle

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
