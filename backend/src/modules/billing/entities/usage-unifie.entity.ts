/**
 * ==================================
 * eLISAschool - Entité UsageUnifie
 * ==================================
 *
 * Table d'usage unique fusionnant les anciens doublons
 * quotas_utilisation (stocks) et usage_meters (compteurs périodiques).
 * Refonte v3, migration 213.
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum SourceUsage {
    /** Stock issu de l'ex-quota_utilisation (ressources structurelles : eleves, classes…) */
    QUOTA = 'QUOTA',
    /** Compteur périodique issu de l'ex-usage_meter (SMS, exports…) */
    METER = 'METER',
}

@Entity('usage_unifie')
@Index(['etablissementId', 'ressource', 'periode'], { unique: true })
@Index(['etablissementId'])
export class UsageUnifie {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    /** Ressource mesurée (clé du bloc plan.quotas : eleves, sms, export_pdf…) */
    @Column({ type: 'varchar', length: 100 })
    ressource!: string;

    /** Période 'YYYY-MM' pour les compteurs, 'GLOBAL' pour les stocks */
    @Column({ type: 'varchar', length: 7, default: 'GLOBAL' })
    periode!: string;

    @Column({ type: 'int', default: 0 })
    consommation!: number;

    @Column({ type: 'varchar', length: 30, default: SourceUsage.QUOTA })
    source!: SourceUsage;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
