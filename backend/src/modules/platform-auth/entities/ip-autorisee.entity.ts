/**
 * ==================================
 * eLISAschool - Entité IP Autorisée
 * ==================================
 * Durcissement v9 — IP Allowlist Plateforme
 *
 * Permet de restreindre l'accès aux routes plateforme (/api/platform/*)
 * à une liste d'adresses IP approuvées.
 *
 * Si la liste est vide → pas de restriction (backward compat).
 * Si la liste contient des IPs → seules ces IPs sont autorisées.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('ip_autorisees')
@Index(['ip'], { unique: true })
export class IpAutorisee {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Adresse IP (varchar 45 pour supporter IPv6) */
    @Column({ type: 'varchar', length: 45 })
    ip!: string;

    /** Label descriptif (ex: "Bureau Paris", "Datacenter") */
    @Column({ type: 'varchar', length: 100, nullable: true })
    label?: string;

    /** IP active ou désactivée */
    @Column({ type: 'boolean', default: true })
    active!: boolean;

    /** Date d'expiration optionnelle (null = permanente) */
    @Column({ type: 'timestamp', nullable: true })
    expireAt?: Date;

    /** Utilisateur plateforme qui a créé cette entrée */
    @Column({ type: 'uuid', nullable: true })
    createdBy?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Vérifie si l'IP est encore valide (active + non expirée)
     */
    estValide(): boolean {
        if (!this.active) return false;
        if (this.expireAt && new Date() > this.expireAt) return false;
        return true;
    }
}

// Export nommé pour TypeORM
