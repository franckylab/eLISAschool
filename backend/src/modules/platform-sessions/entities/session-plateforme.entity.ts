/**
 * ==================================
 * eLISAschool - Entité Session Plateforme
 * ==================================
 * Version: 1.0.0
 *
 * Sessions actives des utilisateurs plateforme.
 * Limite 3 sessions LRU par utilisateur.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { UtilisateurPlateforme } from '@modules/utilisateurs-plateforme/entities';

@Entity('sessions_plateforme')
@Index(['token'], { unique: true })
@Index(['expiresAt'])
export class SessionPlateforme {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurPlateformeId!: string;

    @ManyToOne(() => UtilisateurPlateforme, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurPlateformeId' })
    utilisateurPlateforme!: UtilisateurPlateforme;

    @Column({ type: 'varchar', length: 500, unique: true })
    token!: string;

    @Column({ type: 'varchar', length: 45, nullable: true })
    ip!: string | null;

    @Column({ type: 'text', nullable: true })
    userAgent!: string | null;

    @Column({ type: 'timestamp' })
    expiresAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
