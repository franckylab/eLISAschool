/**
 * ==================================
 * eLISAschool - Entité Unité Organisationnelle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente une unité structurelle au sein d'une organisation :
 * départements, services, pôles, filières, cycles, etc.
 * Supporte une hiérarchie en arbre (parent/enfant).
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
import { Organisation } from './organisation.entity';
import { Poste } from './poste.entity';
import { NiveauOrganisation } from './niveau-organisation.entity';

/**
 * Type d'unité organisationnelle
 */
export enum TypeUniteOrganisationnelle {
    DIRECTION = 'DIRECTION',
    DEPARTEMENT = 'DEPARTEMENT',
    SERVICE = 'SERVICE',
    POLE = 'POLE',
    FILIERE = 'FILIERE',
    CYCLE = 'CYCLE',
    SECTION = 'SECTION',
    COMMISSION = 'COMMISSION',
    EQUIPE = 'EQUIPE',
    AUTRE = 'AUTRE',
}

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
@Index(['organisationId'])
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

    // Référence à l'organisation parente
    @Column({ type: 'uuid' })
    organisationId!: string;

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
    @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organisationId' })
    organisation?: Organisation;

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
