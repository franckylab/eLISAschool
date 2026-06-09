/**
 * ==================================
 * eLISAschool - Entité Paramètre Système
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Stockage hybride des paramètres en base de données
 * avec distinction entre paramètres statiques (.env) et dynamiques (DB)
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

/**
 * Catégorie de paramètre
 */
export enum CategorieParametre {
    /** Paramètres système (ne pas modifier en runtime) */
    SYSTEME = 'SYSTEME',
    /** Paramètres de sécurité */
    SECURITE = 'SECURITE',
    /** Paramètres d'établissement */
    ETABLISSEMENT = 'ETABLISSEMENT',
    /** Paramètres de module */
    MODULE = 'MODULE',
    /** Paramètres de thème/UI */
    THEME = 'THEME',
    /** Paramètres de notification */
    NOTIFICATION = 'NOTIFICATION',
    /** Paramètres régionaux */
    REGIONAL = 'REGIONAL',
    /** Paramètres personnalisés */
    CUSTOM = 'CUSTOM',
}

/**
 * Type de valeur du paramètre
 */
export enum TypeValeurParametre {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    JSON = 'JSON',
    ARRAY = 'ARRAY',
}

/**
 * Entité ParametreSysteme
 * Stocke les paramètres de configuration en base de données
 */
@Entity('parametres_systeme')
@Index(['cle', 'etablissementId'], { unique: true })
@Index(['categorie'])
@Index(['module'])
@Index(['etablissementId'])
export class ParametreSysteme {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Clé unique du paramètre (ex: 'auth.session_duration') */
    @Column({ type: 'varchar', length: 255, unique: true })
    cle!: string;

    /** Valeur du paramètre (stockée en JSON string) */
    @Column({ type: 'text' })
    valeur!: string;

    /** Type de la valeur */
    @Column({ type: 'enum', enum: TypeValeurParametre, default: TypeValeurParametre.STRING })
    typeValeur!: TypeValeurParametre;

    /** Catégorie du paramètre */
    @Column({ type: 'enum', enum: CategorieParametre, default: CategorieParametre.CUSTOM })
    categorie!: CategorieParametre;

    /** Module associé (null = global) */
    @Column({ type: 'varchar', length: 100, nullable: true })
    module?: string;

    /**
     * ID de l'établissement pour le scopage multi-tenant.
     * NULL = paramètre global (default pour tous les établissements)
     * UUID = override spécifique à cet établissement
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    /** Description du paramètre */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /** Valeur par défaut (pour référence) */
    @Column({ type: 'text', nullable: true })
    valeurDefaut?: string;

    /** Peut être modifié sans redémarrage */
    @Column({ type: 'boolean', default: true })
    modifiableRuntime!: boolean;

    /** Visible dans l'interface admin */
    @Column({ type: 'boolean', default: true })
    visible!: boolean;

    /** Ordre d'affichage */
    @Column({ type: 'int', default: 0 })
    ordre!: number;

    /** Validation (regex pattern) */
    @Column({ type: 'varchar', length: 500, nullable: true })
    validation?: string;

    /** Options pour les selects */
    @Column({ type: 'simple-json', nullable: true })
    options?: { value: string; label: string }[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

export default ParametreSysteme;
