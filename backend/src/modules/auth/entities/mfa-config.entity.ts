/**
 * ==================================
 * eLISAschool - Entité MfaConfig
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Stocke la configuration MFA (TOTP) par utilisateur :
 * - secret hashé (jamais en clair)
 * - backup codes hashés
 * - statut d'activation
 *
 * Phase P1 — Refonte SaaS v6
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

@Entity('mfa_configs')
@Index(['utilisateurId'], { unique: true })
export class MfaConfig {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', unique: true })
    utilisateurId!: string;

    @Column({ type: 'varchar', length: 255 })
    secretHash!: string;

    /** JSON array de backup codes hashés, sérialisé */
    @Column({ type: 'text' })
    backupCodesHash!: string;

    @Column({ type: 'boolean', default: false })
    actif!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    derniereVerification?: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @OneToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;
}
