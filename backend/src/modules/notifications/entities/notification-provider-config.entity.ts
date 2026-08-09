/**
 * ==================================
 * eLISAschool - Entité NotificationProviderConfig
 * ==================================
 * 
 * Configuration des providers de notification par tenant.
 * Chaque établissement configure ses propres providers (email, SMS, push).
 * 
 * Phase 8.3 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('notification_provider_configs')
@Index(['etablissementId', 'channel'], { unique: true })
export class NotificationProviderConfig {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 20 })
    channel!: string; // 'email', 'sms', 'push', 'in-app'

    @Column({ type: 'varchar', length: 50 })
    providerName!: string; // 'smtp', 'sendgrid', 'twilio', 'firebase', etc.

    @Column({ type: 'text' })
    credentials!: string; // JSON chiffré AES-256

    @Column({ type: 'boolean', default: false })
    actif!: boolean;

    @Column({ type: 'boolean', default: false })
    sandbox!: boolean;

    @Column({ type: 'text', nullable: true })
    metadata?: string; // JSON: from_email, templates, etc.

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
