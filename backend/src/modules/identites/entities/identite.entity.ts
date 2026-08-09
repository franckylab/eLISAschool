/**
 * ==================================
 * eLISAschool - Entité Identité
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Source unique de vérité pour l'identité d'un utilisateur.
 * Une identité peut avoir N memberships (plateforme + établissements).
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, Index, OneToOne,
} from 'typeorm';
import { StatutIdentite } from '@shared/enums/roles.enum';

@Entity('identites')
@Index(['email'], { unique: true })
export class Identite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'boolean', default: false })
    emailVerifie!: boolean;

    @Column({ type: 'varchar', length: 255 })
    motDePasseHash!: string;

    @Column({ type: 'boolean', default: false })
    mfaActive!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    mfaSecret!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    derniereConnexion!: Date | null;

    @Column({ type: 'varchar', length: 20, default: StatutIdentite.ACTIF })
    statut!: StatutIdentite;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
