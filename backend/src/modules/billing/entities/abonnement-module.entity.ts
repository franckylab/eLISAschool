/**
 * ==================================
 * eLISAschool - Entité AbonnementModule
 * ==================================
 * 
 * Lien entre un abonnement client et un module optionnel activé.
 * 
 * Phase 4.1 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbonnementClient } from './abonnement-client.entity';
import { ModuleOptionnel } from './module-optionnel.entity';

@Entity('abonnements_modules')
@Index(['abonnementId', 'moduleOptionnelId'], { unique: true })
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
