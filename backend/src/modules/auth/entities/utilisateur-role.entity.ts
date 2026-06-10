/**
 * ==================================
 * eLISAschool - Entité UtilisateurRole
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Table de jointure pour le support multi-rôles
 * Permet d'assigner plusieurs rôles à un utilisateur
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
import { Utilisateur } from './utilisateur.entity';
import { Role } from './role.entity';

/**
 * Entité UtilisateurRole
 * Association entre un utilisateur et un rôle (principal ou secondaire)
 */
@Entity('utilisateur_roles')
@Index(['utilisateurId'])
@Index(['roleId'])
@Index(['estPrincipal'])
@Unique(['utilisateurId', 'roleId'])
export class UtilisateurRole {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @Column({ type: 'uuid' })
    roleId!: string;

    /**
     * Indique si c'est le rôle principal de l'utilisateur
     * Un utilisateur ne peut avoir qu'un seul rôle principal
     */
    @Column({ type: 'boolean', default: false })
    estPrincipal!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    dateAttribution!: Date;

    /**
     * Utilisateur qui a assigné ce rôle
     */
    @Column({ type: 'uuid', nullable: true })
    attribuePar?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    /**
     * Relations
     */
    @ManyToOne(() => Utilisateur, utilisateur => utilisateur.utilisateurRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    role!: Role;
}

// Export nommé pour TypeORM (détection automatique via glob pattern)
export { UtilisateurRole };

export default UtilisateurRole;
