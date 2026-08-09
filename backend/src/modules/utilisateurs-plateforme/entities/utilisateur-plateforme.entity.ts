/**
 * ==================================
 * eLISAschool - Entité Utilisateur Plateforme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Admin/opérateur de la plateforme (Control Plane).
 * Lié à une Identité globale via identiteId (OneToOne).
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, Index, OneToOne, JoinColumn,
} from 'typeorm';
import { Identite } from '@modules/identites/entities';
import { RolePlateforme } from '@shared/enums/roles.enum';

@Entity('utilisateurs_plateforme')
@Index(['rolePlateforme'])
@Index(['estActif'])
export class UtilisateurPlateforme {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    identiteId!: string;

    @OneToOne(() => Identite)
    @JoinColumn({ name: 'identiteId' })
    identite!: Identite;

    @Column({ type: 'varchar', length: 30 })
    rolePlateforme!: RolePlateforme;

    @Column({ type: 'varchar', length: 100 })
    prenom!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    dernierAcces!: Date | null;

    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
