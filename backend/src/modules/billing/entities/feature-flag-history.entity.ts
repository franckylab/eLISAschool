/**
 * ==================================
 * eLISAschool - Entité FeatureFlagHistory
 * ==================================
 * Journal d'audit des modifications de feature flags.
 * Permet la traçabilité complète : qui a toggled quoi, quand,
 * ancienne/nouvelle valeur, et commentaire optionnel.
 * 
 * Migration 210 — Refonte Feature Flags
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { FeatureFlagDefinition } from './feature-flag-definition.entity';

// =============================================
// Enums
// =============================================

export enum ActionFeatureFlag {
    CREATE = 'CREATE',
    TOGGLE_ON = 'TOGGLE_ON',
    TOGGLE_OFF = 'TOGGLE_OFF',
    DELETE = 'DELETE',
    ROLLOUT_CHANGE = 'ROLLOUT_CHANGE',
    SEGMENT_CHANGE = 'SEGMENT_CHANGE',
    EXPIRE = 'EXPIRE',
    RESET = 'RESET',
}

// =============================================
// Entité
// =============================================

@Entity('feature_flags_history')
@Index(['flagDefinitionId'])
@Index(['etablissementId'])
@Index(['createdAt'])
@Index(['action'])
export class FeatureFlagHistory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => FeatureFlagDefinition, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'flagDefinitionId' })
    flagDefinition?: FeatureFlagDefinition;

    @Column({ type: 'uuid', nullable: true })
    flagDefinitionId?: string;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @Column({ type: 'varchar', length: 30 })
    action!: ActionFeatureFlag;

    @Column({ type: 'text', nullable: true })
    ancienneValeur?: string;

    @Column({ type: 'text', nullable: true })
    nouvelleValeur?: string;

    @Column({ type: 'uuid', nullable: true })
    modifiePar?: string; // ID utilisateur ayant fait le changement

    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
