/**
 * ==================================
 * eLISAschool - Entité ProviderConfig
 * ==================================
 * 
 * Configuration des providers de paiement par tenant.
 * Les secrets sont chiffrés (AES-256) avant stockage.
 * 
 * Phase 5.3 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('provider_configs')
@Index(['etablissementId', 'providerName'], { unique: true })
export class ProviderConfig {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 50 })
    providerName!: string; // 'mtn-momo', 'orange-money', 'stripe', 'paypal', 'flutterwave', 'paystack'

    @Column({ type: 'varchar', length: 50 })
    channel!: string; // 'mobile_money', 'card', 'bank_transfer'

    @Column({ type: 'text' })
    credentials!: string; // JSON chiffré AES-256 (clés API, secrets)

    @Column({ type: 'boolean', default: false })
    sandbox!: boolean; // Mode test

    @Column({ type: 'boolean', default: false })
    actif!: boolean;

    @Column({ type: 'varchar', length: 100, nullable: true })
    webhookSecret?: string; // Secret pour vérifier les webhooks entrants

    @Column({ type: 'text', nullable: true })
    metadata?: string; // JSON avec infos supplémentaires

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
