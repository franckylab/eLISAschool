/**
 * ==================================
 * eLISAschool - Entité Notification
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

/**
 * Type de notification
 */
export enum TypeNotification {
    PUSH = 'PUSH',
    EMAIL = 'EMAIL',
    IN_APP = 'IN_APP',
    SMS = 'SMS',
}

/**
 * Statut de notification
 */
export enum StatutNotification {
    EN_ATTENTE = 'EN_ATTENTE',
    ENVOYEE = 'ENVOYEE',
    LUE = 'LUE',
    ECHEC = 'ECHEC',
}

/**
 * Priorité de notification
 */
export enum PrioriteNotification {
    BASSE = 'BASSE',
    NORMALE = 'NORMALE',
    HAUTE = 'HAUTE',
    URGENTE = 'URGENTE',
}

/**
 * Entité Notification
 */
@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    destinataireId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'destinataireId' })
    destinataire!: Utilisateur;

    @Column({ type: 'uuid', nullable: true })
    expediteurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'expediteurId' })
    expediteur?: Utilisateur;

    @Column({ type: 'varchar', length: 255 })
    titre!: string;

    @Column({ type: 'text' })
    contenu!: string;

    @Column({ type: 'enum', enum: TypeNotification, default: TypeNotification.IN_APP })
    type!: TypeNotification;

    @Column({ type: 'enum', enum: StatutNotification, default: StatutNotification.EN_ATTENTE })
    statut!: StatutNotification;

    @Column({ type: 'enum', enum: PrioriteNotification, default: PrioriteNotification.NORMALE })
    priorite!: PrioriteNotification;

    @Column({ type: 'varchar', length: 100, nullable: true })
    categorie?: string; // notes, paiement, presence, etc.

    @Column({ type: 'varchar', length: 500, nullable: true })
    lienAction?: string; // URL pour action

    @Column({ type: 'simple-json', nullable: true })
    metadata?: Record<string, any>;

    @Column({ type: 'timestamp', nullable: true })
    lueAt?: Date;

    @Column({ type: 'timestamp', nullable: true })
    envoyeeAt?: Date;

    @Column({ type: 'timestamp', nullable: true })
    programmeePour?: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}

export default Notification;
