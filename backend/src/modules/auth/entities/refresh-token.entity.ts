/**
 * ==================================
 * eLISAschool - Entité Token de Rafraîchissement
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

/**
 * Entité RefreshToken
 * Gestion des tokens de rafraîchissement pour la session
 */
@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

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

export default RefreshToken;
