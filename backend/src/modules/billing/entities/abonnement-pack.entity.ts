/**
 * ==================================
 * eLISAschool - Entité AbonnementPack
 * ==================================
 *
 * Souscription d'un pack de quota à un abonnement (Refonte v3,
 * migration 213). Le pack augmente le quota effectif de l'abonnement
 * actif pour la ressource concernée.
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbonnementClient } from './abonnement-client.entity';
import { PackQuota } from './pack-quota.entity';

@Entity('abonnements_packs')
@Index(['abonnementId'])
export class AbonnementPack {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    abonnementId!: string;

    @ManyToOne(() => AbonnementClient, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'abonnementId' })
    abonnement!: AbonnementClient;

    @Column({ type: 'uuid' })
    packId!: string;

    @ManyToOne(() => PackQuota, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'packId' })
    pack!: PackQuota;

    @Column({ type: 'timestamp', default: () => 'now()' })
    dateSouscription!: Date;

    /** Fin de validité (null = illimité) */
    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    /** Montant facturé au prorata du cycle restant */
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    montantFacture!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
