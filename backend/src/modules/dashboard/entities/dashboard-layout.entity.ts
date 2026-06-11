/**
 * ==================================
 * eLISAschool - Entité DashboardLayout
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Stocke la configuration des layouts de dashboard par utilisateur
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

export interface WidgetLayoutConfig {
    id: string;
    visible: boolean;
    ordre: number;
    position: { x: number; y: number };
    taille: { width: number; height: number };
    config?: Record<string, any>;
}

@Entity('dashboard_layouts')
@Index(['utilisateurId'])
@Index(['utilisateurId', 'etablissementId'])
@Index(['actif'])
export class DashboardLayout {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string; // null = layout global

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'simple-json', default: '[]' })
    widgets!: WidgetLayoutConfig[];

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
