/**
 * ==================================
 * eLISAschool - Entité Unité Organisationnelle
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente une unité structurelle au sein d'un établissement :
 * départements, services, commissions, équipes, etc.
 * Supporte une hiérarchie en arbre (parent/enfant).
 * Rattachée directement à l'établissement (après fusion Organisation → Etablissement).
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { Poste } from './poste.entity';
import { NiveauOrganisation } from './niveau-organisation.entity';

/**
 * Type d'unité organisationnelle
 * Après refonte: POLE/FILIERE/CYCLE/SECTION supprimés, POLE_PEDAGOGIQUE ajouté.
 * Enum PostgreSQL — la migration 109 crée le nouvel enum et convertit les données.
 */
export enum TypeUniteOrganisationnelle {
    DIRECTION = 'DIRECTION',
    DEPARTEMENT = 'DEPARTEMENT',
    SERVICE = 'SERVICE',
    POLE_PEDAGOGIQUE = 'POLE_PEDAGOGIQUE',
    COMMISSION = 'COMMISSION',
    EQUIPE = 'EQUIPE',
    AUTRE = 'AUTRE',
}

/**
 * Valeurs valides pour le type d'unité organisationnelle
 */
export const TYPES_UNITE_VALIDES = Object.values(TypeUniteOrganisationnelle);

/**
 * Statut d'une unité organisationnelle
 */
export enum StatutUnite {
    ACTIF = 'ACTIF',
    EN_CREATION = 'EN_CREATION',
    EN_RESTRUCTURATION = 'EN_RESTRUCTURATION',
    ARCHIVE = 'ARCHIVE',
}

/**
 * Entité UniteOrganisationnelle
 * Permet de structurer l'établissement en unités hiérarchiques
 */
@Entity('unites_organisationnelles')
@Index(['etablissementId'])
@Index(['type'])
@Index(['parentId'])
@Index(['code'])
export class UniteOrganisationnelle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    usageUniteCode?: string;

    @Column({ type: 'uuid', nullable: true })
    niveauOrganisationId?: string;

    @Column({ type: 'enum', enum: TypeUniteOrganisationnelle, default: TypeUniteOrganisationnelle.SERVICE })
    type!: TypeUniteOrganisationnelle;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 30, default: StatutUnite.ACTIF })
    statut!: StatutUnite;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    // Référence à l'établissement (multi-tenancy)
    @Column({ type: 'uuid' })
    etablissementId!: string;

    // Auto-référence pour hiérarchie (parent/enfant)
    @Column({ type: 'uuid', nullable: true })
    parentId?: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'varchar', length: 200, nullable: true })
    responsableNom?: string;

    @Column({ type: 'uuid', nullable: true })
    responsableId?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    localisation?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    telephone?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    // Métadonnées JSON flexibles
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @ManyToOne(() => UniteOrganisationnelle, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent?: UniteOrganisationnelle;

    @OneToMany(() => UniteOrganisationnelle, (unite) => unite.parent)
    enfants?: UniteOrganisationnelle[];

    @ManyToOne(() => NiveauOrganisation, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'niveauOrganisationId' })
    niveauOrganisation?: NiveauOrganisation;

    @OneToMany(() => Poste, (poste) => poste.uniteOrganisationnelle)
    postes?: Poste[];
}
