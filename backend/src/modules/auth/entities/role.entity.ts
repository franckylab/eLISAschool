/**
 * ==================================
 * eLISAschool - Entité Role
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Rôles dynamiques stockés en base de données
 * pour le système RBAC avancé avec support d'héritage
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    ManyToOne,
    JoinTable,
    JoinColumn,
    Index,
} from 'typeorm';
import { Permission } from './permission.entity';

/**
 * Entité Role
 * Représente un rôle dans le système RBAC avec support d'héritage
 */
@Entity('roles')
@Index(['code'], { unique: true })
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // ex: "ENSEIGNANT", "ENSEIGNANT_PRINCIPAL", "ADMIN_CUSTOM"

    @Column({ type: 'varchar', length: 100 })
    libelle!: string; // ex: "Enseignant", "Enseignant Principal"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean; // true pour les 9 rôles par défaut (legacy)

    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    /**
     * Héritage de rôles
     * Un rôle peut hériter des permissions d'un rôle parent
     */
    @Column({ type: 'uuid', nullable: true })
    parentId?: string;

    @ManyToOne(() => Role, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent?: Role;

    /**
     * Scope établissement
     * null = rôle global, sinon limité à un établissement
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Relations
     */
    @ManyToMany(() => Permission, permission => permission.roles, { cascade: true })
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'roleId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
    })
    permissions!: Permission[];
}

// Export nommé pour TypeORM (détection automatique via glob pattern)
export { Role };

export default Role;
