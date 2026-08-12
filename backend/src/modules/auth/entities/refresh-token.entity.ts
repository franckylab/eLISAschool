/**
 * ==================================
 * eLISAschool - Entité Token de Rafraîchissement
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Durcissement v9 — Refresh Token Rotation (family-based)
 * - familleId : identifie la famille de tokens (détection compromission)
 * - tokenPrecedent : chaîne de rotation (chaque token pointe vers le précédent)
 * - Détection réutilisation : si token révoqué est réutilisé → toute la famille est révoquée
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

/**
 * Entité RefreshToken
 * Gestion des tokens de rafraîchissement avec rotation par famille.
 */
@Entity('refresh_tokens')
@Index(['familleId'])
@Index(['plane'])
@Index(['utilisateurId', 'plane'])
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    // ==================================
    // ADR-005 (v11) — Sessions unifiées tenant/platform
    // ==================================

    /**
     * Discriminateur de plan : 'tenant' ou 'platform'.
     * Permet de séparer les sessions par plan dans une table unique.
     */
    @Column({ type: 'varchar', length: 10, default: 'tenant' })
    plane!: 'tenant' | 'platform';

    @Column({ type: 'varchar', length: 500, unique: true })
    token!: string;

    @Column({ type: 'varchar', length: 45, nullable: true })
    adresseIp?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    userAgent?: string;

    @Column({ type: 'timestamp' })
    expireAt!: Date;

    @Column({ type: 'boolean', default: false })
    revoque!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    revoqueAt?: Date;

    /**
     * Durcissement v9 — Identifiant de famille de rotation.
     * Tous les tokens d'une même session de rotation partagent le même familleId.
     */
    @Column({ type: 'uuid', nullable: true })
    familleId?: string;

    /**
     * Durcissement v9 — Token précédent dans la chaîne de rotation.
     * Permet de détecter la réutilisation d'un token déjà révoqué.
     */
    @Column({ type: 'uuid', nullable: true })
    tokenPrecedentId?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    /**
     * Vérifie si le token est expiré
     */
    estExpire(): boolean {
        return new Date() > this.expireAt;
    }

    /**
     * Vérifie si le token est valide (non révoqué et non expiré)
     */
    estValide(): boolean {
        return !this.revoque && !this.estExpire();
    }
}

// Export nommé pour TypeORM (détection automatique via glob pattern)
