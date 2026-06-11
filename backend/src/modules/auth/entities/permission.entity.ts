/**
 * ==================================
 * eLISAschool - Entité Permission
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Permissions granulaires stockées en base de données
 * pour le système RBAC dynamique
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    Index,
} from 'typeorm';
import { Role } from './role.entity';

/**
 * Entité Permission
 * Représente une permission granulaire dans le système RBAC
 */
@Entity('permissions')
@Index(['code'], { unique: true })
@Index(['module', 'action'])
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string; // ex: "notes:create", "eleves:view"

    @Column({ type: 'varchar', length: 255 })
    libelle!: string; // ex: "Créer des notes"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50 })
    module!: string; // ex: "notes", "eleves", "cantine"

    @Column({ type: 'varchar', length: 20 })
    action!: string; // ex: "view", "create", "edit", "delete", "manage"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Relations
     */
    @ManyToMany(() => Role, role => role.permissions)
    roles!: Role[];
}

// Export nommé pour TypeORM (détection automatique via glob pattern)
