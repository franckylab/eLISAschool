/**
 * ==================================
 * eLISAschool - Entité UtilisateurPermission
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Permissions personnalisées au niveau utilisateur
 * Permet d'ajouter (GRANTED) ou retirer (DENIED) des permissions spécifiques
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import Utilisateur from './utilisateur.entity';
import Permission from './permission.entity';

/**
 * Type d'attribution de permission
 */
export enum TypePermission {
    GRANTED = 'GRANTED',  // Permission accordée (ajout)
    DENIED = 'DENIED',    // Permission refusée (retrait/override)
}

/**
 * Entité UtilisateurPermission
 * Permission personnalisée pour un utilisateur spécifique
 */
@Entity('utilisateur_permissions')
@Index(['utilisateurId'])
@Index(['permissionId'])
@Index(['type'])
@Unique(['utilisateurId', 'permissionId'])
export class UtilisateurPermission {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @Column({ type: 'uuid' })
    permissionId!: string;

    /**
     * Type d'attribution :
     * - GRANTED : ajoute cette permission (en plus des rôles)
     * - DENIED : retire cette permission (même si le rôle l'accorde)
     */
    @Column({ type: 'enum', enum: TypePermission, default: TypePermission.GRANTED })
    type!: TypePermission;

    @Column({ type: 'text', nullable: true })
    motif?: string; // Raison de l'attribution/refus

    /**
     * Utilisateur qui a assigné cette permission
     */
    @Column({ type: 'uuid', nullable: true })
    attribuePar?: string;

    @CreateDateColumn({ type: 'timestamp' })
    dateAttribution!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    /**
     * Relations
     */
    @ManyToOne(() => Utilisateur, utilisateur => utilisateur.utilisateurPermissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permissionId' })
    permission!: Permission;
}

export default UtilisateurPermission;
