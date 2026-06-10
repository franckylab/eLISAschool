/**
 * ==================================
 * eLISAschool - Entité Préférences Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Stockage des préférences individuelles de chaque utilisateur
 * avec valeurs par défaut, reset et héritage de la config globale
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

/**
 * Catégories de préférences
 */
export enum CategoriePreference {
    AFFICHAGE = 'AFFICHAGE',
    NOTIFICATIONS = 'NOTIFICATIONS',
    LANGUE = 'LANGUE',
    ACCESSIBILITE = 'ACCESSIBILITE',
    MESSAGERIE = 'MESSAGERIE',
    TABLEAU_BORD = 'TABLEAU_BORD',
    SECURITE = 'SECURITE',
    PERSONNALISATION = 'PERSONNALISATION',
}

/**
 * Entité PreferenceUtilisateur
 * Stocke les préférences individuelles avec override de la config globale
 */
@Entity('preferences_utilisateur')
@Index(['utilisateurId', 'cle'], { unique: true })
@Index(['utilisateurId', 'categorie'])
@Index(['categorie', 'updatedAt']) // Pour tri par catégorie récent
@Index(['heriteGlobal', 'utilisateurId']) // Pour filtre héritage
export class PreferenceUtilisateur {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    /** Clé de la préférence (ex: 'theme', 'langue', 'notifications.email') */
    @Column({ type: 'varchar', length: 100 })
    cle!: string;

    /** Valeur de la préférence */
    @Column({ type: 'text' })
    valeur!: string;

    /** Type de la valeur */
    @Column({ type: 'varchar', length: 20, default: 'string' })
    typeValeur!: string;

    /** Catégorie de la préférence */
    @Column({ type: 'varchar', length: 50, enum: CategoriePreference, default: CategoriePreference.PERSONNALISATION })
    categorie!: CategoriePreference;

    /** Valeur par défaut du système */
    @Column({ type: 'text', nullable: true })
    valeurDefaut?: string;

    /** Hérite de la config globale (false = override utilisateur) */
    @Column({ type: 'boolean', default: false })
    heriteGlobal!: boolean;

    /** Description */
    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

export default PreferenceUtilisateur;
