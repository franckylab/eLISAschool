/**
 * ==================================
 * eLISAschool - Entité FeatureFlagDefinition
 * ==================================
 * Registre centralisé des feature flags — source unique de vérité.
 * Contient les métadonnées de chaque flag : label, description,
 * catégorie, type, rollout %, segments, expiration.
 * 
 * Migration 210 — Refonte Feature Flags
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// =============================================
// Enums
// =============================================

export enum CategorieFlag {
    GENERAL = 'general',
    BILLING = 'billing',
    INTEGRATION = 'integration',
    SECURITY = 'security',
    UX = 'ux',
    PEDAGOGIE = 'pedagogie',
}

export enum TypeFlag {
    RELEASE = 'release',       // Flag de déploiement (temporaire)
    OPS = 'ops',               // Flag opérationnel (kill switch)
    EXPERIMENT = 'experiment', // Flag d'expérimentation (A/B testing)
    PERMISSION = 'permission', // Flag de permission (lié au plan)
}

// =============================================
// Entité
// =============================================

@Entity('feature_flag_definitions')
@Index(['cle'], { unique: true })
@Index(['categorie'])
@Index(['type'])
@Index(['estActif'])
export class FeatureFlagDefinition {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    cle!: string; // Ex: 'export_pdf', 'multi_etablissement'

    @Column({ type: 'varchar', length: 150 })
    label!: string; // Ex: 'Export PDF', 'Multi-établissement'

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50, default: CategorieFlag.GENERAL })
    categorie!: CategorieFlag;

    @Column({ type: 'varchar', length: 30, default: TypeFlag.RELEASE })
    type!: TypeFlag;

    @Column({ type: 'boolean', default: false })
    valeurDefaut!: boolean;

    @Column({ type: 'varchar', length: 50, nullable: true })
    planMinimal?: string; // Slug du plan minimal requis (ex: 'starter', 'pro')

    @Column({ type: 'int', default: 100 })
    rolloutPercentage!: number; // 0-100 pour progressive rollout

    @Column({ type: 'jsonb', default: '[]' })
    segments!: Array<{ champ: string; operateur: string; valeur: string }>;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean; // Non supprimable si true

    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    expiresAt?: Date; // Alertes si dépassé

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
