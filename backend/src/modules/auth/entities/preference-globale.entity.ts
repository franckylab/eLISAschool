/**
 * ==================================
 * eLISAschool - Entité Préférence Globale par Établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    Index, Unique,
} from 'typeorm';
import { CategoriePreference } from '@modules/auth/entities/preference-utilisateur.entity';

/**
 * Préférences globales configurables au niveau de l'établissement
 * Héritées par défaut par tous les utilisateurs de l'établissement
 */
@Entity('preferences_globales')
@Unique(['etablissementId', 'cle'])
@Index(['etablissementId'])
@Index(['categorie'])
export class PreferenceGlobale {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** ID de l'établissement */
    @Column({ type: 'uuid' })
    etablissementId!: string;

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

    /** Label affiché dans l'interface */
    @Column({ type: 'varchar', length: 200 })
    libelle!: string;

    /** Description de la préférence */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /** Est modifiable par les utilisateurs (false = imposée par l'établissement) */
    @Column({ type: 'boolean', default: true })
    estModifiableParUtilisateur!: boolean;

    /** Priorité d'affichage dans l'interface */
    @Column({ type: 'int', default: 0 })
    ordre!: number;

    /** Métadonnées JSON supplémentaires */
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    /** Date de création */
    @CreateDateColumn()
    createdAt!: Date;

    /** Date de dernière modification */
    @UpdateDateColumn()
    updatedAt!: Date;

    /** ID de l'utilisateur ayant modifié la préférence */
    @Column({ type: 'uuid', nullable: true })
    modifiePar!: string;
}
