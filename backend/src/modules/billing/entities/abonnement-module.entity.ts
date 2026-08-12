/**
 * ==================================
 * eLISAschool - Entité AbonnementModule
 * ==================================
 * 
 * Lien entre un abonnement client et un module optionnel activé.
 * 
 * Phase 4.1 — Refonte SaaS
 * v7 P1.1 — Ajout etablissementId pour isolation multi-tenant directe
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbonnementClient } from './abonnement-client.entity';
import { ModuleOptionnel } from './module-optionnel.entity';

@Entity('abonnements_modules')
@Index(['abonnementId', 'moduleOptionnelId'], { unique: true })
@Index(['etablissementId']) // P1.1 v7 — Index multi-tenant
export class AbonnementModule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    abonnementId!: string;

    @ManyToOne(() => AbonnementClient, (abo) => abo.modules, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'abonnementId' })
    abonnement!: AbonnementClient;

    @Column({ type: 'uuid' })
    moduleOptionnelId!: string;

    @ManyToOne(() => ModuleOptionnel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'moduleOptionnelId' })
    moduleOptionnel!: ModuleOptionnel;

    /** P1.1 v7 — Isolation multi-tenant directe ( évite JOIN sur abonnements_client) */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    dateActivation?: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateDesactivation?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
