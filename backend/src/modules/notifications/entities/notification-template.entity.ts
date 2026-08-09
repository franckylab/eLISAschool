/**
 * ==================================
 * eLISAschool - Entité NotificationTemplate
 * ==================================
 * 
 * Templates de notifications avec variables dynamiques.
 * Support Handlebars/Mustache pour les variables.
 * 
 * Phase 8.3 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('notification_templates')
@Index(['etablissementId', 'type'], { unique: true })
export class NotificationTemplate {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string; // null = template global

    @Column({ type: 'varchar', length: 50 })
    type!: string; // 'bienvenue', 'facture', 'retard_paiement', 'alerte_quota', etc.

    @Column({ type: 'varchar', length: 20 })
    channel!: string; // 'email', 'sms', 'push', 'in-app'

    @Column({ type: 'varchar', length: 200 })
    sujet!: string; // Supporte les variables: {{etablissement.nom}}

    @Column({ type: 'text' })
    contenu!: string; // Template avec variables dynamiques

    @Column({ type: 'varchar', length: 50, default: 'fr' })
    langue!: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
