/**
 * ==================================
 * eLISAschool - Entité Membership
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Table pivot : associe une Identité à un contexte (Plateforme ou Établissement).
 * Une identité peut avoir N memberships (ex: admin plateforme + membre de 2 établissements).
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { Identite } from '@modules/identites/entities';
import { ContexteType } from '@shared/enums/roles.enum';

@Entity('memberships')
@Index(['identiteId', 'contexteType', 'contexteId'], { unique: true })
@Index(['contexteType', 'contexteId'])
@Index(['estActif'])
export class Membership {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    identiteId!: string;

    @ManyToOne(() => Identite)
    @JoinColumn({ name: 'identiteId' })
    identite!: Identite;

    @Column({ type: 'varchar', length: 20 })
    contexteType!: ContexteType;

    @Column({ type: 'uuid', nullable: true })
    contexteId!: string | null;

    /** Rôle dans le contexte (RolePlateforme si PLATEFORME, Role si ETABLISSEMENT) */
    @Column({ type: 'varchar', length: 50 })
    role!: string;

    /** Override RBAC — permissions personnalisées (JSON) */
    @Column({ type: 'jsonb', nullable: true })
    permissionsCustom!: Record<string, boolean> | null;

    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateActivation!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
