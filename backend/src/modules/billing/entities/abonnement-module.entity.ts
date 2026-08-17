/**
 * ==================================
 * eLISAschool - Entité AbonnementModule
 * ==================================
 *
 * Souscription d'un module en supplément (hors plan) par un tenant.
 * Refonte v3 (migration 213) : la relation pointait sur l'ex-table
 * modules_optionnels (supprimée) ; elle référence désormais le
 * catalogue unique modules_catalogue.
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbonnementClient } from './abonnement-client.entity';
import { ModuleCatalogue } from './module-catalogue.entity';

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

    /** ID du module dans modules_catalogue (ex-moduleOptionnelId, colonne conservée) */
    @Column({ type: 'uuid' })
    moduleOptionnelId!: string;

    @ManyToOne(() => ModuleCatalogue, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'moduleOptionnelId' })
    module!: ModuleCatalogue;

    /** P1.1 v7 — Isolation multi-tenant directe (évite JOIN sur abonnements_client) */
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
