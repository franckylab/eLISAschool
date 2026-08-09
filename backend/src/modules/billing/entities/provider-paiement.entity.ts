/**
 * ==================================
 * eLISAschool - Entité ProviderPaiement
 * ==================================
 * 
 * Provider de paiement centralisé (plateforme).
 * Les credentials sont chiffrés AES-256-GCM avant stockage.
 * 
 * Lot D v7 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TypeProviderPaiement {
    MOBILE_MONEY = 'mobile_money',
    CARD = 'card',
    BANK_TRANSFER = 'bank_transfer',
    MIXED = 'mixed',
}

@Entity('providers_paiement')
@Index(['slug'], { unique: true })
@Index(['actif'])
export class ProviderPaiement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    slug!: string;

    @Column({ type: 'varchar', length: 30 })
    type!: TypeProviderPaiement;

    @Column({ type: 'varchar', length: 200, nullable: true })
    icone?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    /** Canaux supportés : ["mtn_momo", "orange_money", "wave", "paystack", "flutterwave", "stripe", "manuel"] */
    @Column({ type: 'simple-json', default: '[]' })
    canaux!: string[];

    /** Credentials chiffrés AES-256-GCM (JSON.stringify → encrypt) */
    @Column({ type: 'text' })
    credentials!: string;

    /** Secret webhook chiffré AES-256-GCM */
    @Column({ type: 'text', nullable: true })
    webhookSecret?: string;

    @Column({ type: 'boolean', default: true })
    sandbox!: boolean;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /** Métadonnées supplémentaires (URLs API, etc.) */
    @Column({ type: 'simple-json', nullable: true })
    metadata?: Record<string, any>;

    @Column({ type: 'uuid', nullable: true })
    creePar?: string;

    @CreateDateColumn()
    creeAt!: Date;

    @UpdateDateColumn()
    majAt!: Date;
}
