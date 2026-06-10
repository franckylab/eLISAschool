/**
 * ==================================
 * eLISAschool - Entité Préférences par Rôle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Description: Préférences par défaut pour chaque rôle d'utilisateur
 */

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    Index, Unique, ManyToOne, JoinColumn,
} from 'typeorm';
import Role from '@modules/auth/entities/role.entity';
import { CategoriePreference } from '@modules/auth/entities/preference-utilisateur.entity';

/**
 * Préférences configurables au niveau du rôle
 * Servent de valeurs par défaut pour tous les utilisateurs ayant ce rôle
 */
@Entity('preferences_role')
@Unique(['roleId', 'cle'])
@Index(['roleId'])
@Index(['cle'])
export class PreferenceRole {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** ID du rôle */
    @Column({ type: 'uuid' })
    roleId!: string;

    /** Rôle associé */
    @ManyToOne(() => Role)
    @JoinColumn({ name: 'roleId' })
    role!: Role;

    /** Clé de préférence (ex: theme, langue) */
    @Column({ type: 'varchar', length: 100 })
    cle!: string;

    /** Valeur de la préférence */
    @Column({ type: 'text' })
    valeur!: string;

    /** Type de valeur */
    @Column({
        type: 'varchar',
        length: 20,
        default: 'string',
    })
    typeValeur!: 'string' | 'number' | 'boolean' | 'json';

    /** Catégorie de la préférence */
    @Column({
        type: 'varchar',
        length: 30,
    })
    categorie!: CategoriePreference;

    /** Est modifiable par l'utilisateur (false = imposée par le rôle) */
    @Column({ type: 'boolean', default: true })
    estModifiableParUtilisateur!: boolean;

    /** Description de la préférence */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /** Date de création */
    @CreateDateColumn()
    createdAt!: Date;

    /** Date de dernière modification */
    @UpdateDateColumn()
    updatedAt!: Date;
}
