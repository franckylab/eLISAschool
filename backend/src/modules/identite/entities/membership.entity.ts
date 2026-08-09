/**
 * ==================================
 * eLISAschool - Entité Membership
 * ==================================
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 *
 * Pivot identité × contexte (plateforme OU établissement).
 * Permet le multi-rôle et multi-établissement.
 * Inspiré du modèle Auth0 Organizations (member × org × role).
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { Identite } from './identite.entity';
import { ContexteType } from '@shared/enums/platform-roles.enum';

/**
 * Entité Membership — pivot identité × contexte.
 * Table : memberships
 *
 * Contrainte unique : une identité ne peut avoir qu'un seul membership
 * par couple (contexteType, contexteId).
 */
@Entity('memberships')
@Unique('uq_membership_identite_contexte', ['identiteId', 'contexteType', 'contexteId'])
export class Membership {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    @Index()
    identiteId!: string;

    @Column({ type: 'varchar', length: 20 })
    @Index()
    contexteType!: ContexteType;

    @Column({ type: 'uuid', nullable: true })
    @Index()
    contexteId?: string;

    @Column({ type: 'varchar', length: 50 })
    @Index()
    role!: string;

    @Column({ type: 'jsonb', nullable: true })
    permissionsCustom?: Record<string, boolean>;

    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    @Column({ type: 'timestamp', default: () => 'NOW()' })
    dateActivation!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // =============================================
    // Relations
    // =============================================

    @ManyToOne(() => Identite, identite => identite.memberships, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'identiteId' })
    identite!: Identite;
}
