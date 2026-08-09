/**
 * ==================================
 * eLISAschool - Entité PaiementWebhook
 * ==================================
 * 
 * Traçabilité des webhooks reçus des providers.
 * Permet le traitement idempotent.
 * 
 * Phase 5.5 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum StatutWebhook {
    RECU = 'RECU',
    TRAITE = 'TRAITE',
    ERREUR = 'ERREUR',
    IGNORE = 'IGNORE', // Doublon idempotent
}

@Entity('paiement_webhooks')
@Index(['provider', 'webhookId'], { unique: true })
@Index(['transactionId'])
export class PaiementWebhook {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50 })
    provider!: string;

    @Column({ type: 'varchar', length: 200 })
    webhookId!: string; // ID unique du webhook (pour idempotence)

    @Column({ type: 'uuid', nullable: true })
    transactionId?: string;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @Column({ type: 'enum', enum: StatutWebhook, default: StatutWebhook.RECU })
    statut!: StatutWebhook;

    @Column({ type: 'text' })
    payload!: string; // JSON brut du webhook

    @Column({ type: 'text', nullable: true })
    signature?: string; // Signature cryptographique

    @Column({ type: 'boolean', default: false })
    signatureValide!: boolean;

    @Column({ type: 'text', nullable: true })
    erreur?: string; // Message d'erreur si traitement échoué

    @Column({ type: 'int', default: 0 })
    tentativesTraitement!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
