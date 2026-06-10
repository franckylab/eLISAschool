/**
 * ==================================
 * eLISAschool - Entité Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente la structure organisationnelle globale d'un établissement.
 * Une organisation contient plusieurs unités organisationnelles (départements, services, pôles).
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';

/**
 * Type d'organisation
 */
export enum TypeOrganisation {
    ETABLISSEMENT_SCOLAIRE = 'ETABLISSEMENT_SCOLAIRE',
    GROUPE_SCOLAIRE = 'GROUPE_SCOLAIRE',
    ENTREPRISE = 'ENTREPRISE',
    ASSOCIATION = 'ASSOCIATION',
}

/**
 * Statut d'une organisation
 */
export enum StatutOrganisation {
    ACTIF = 'ACTIF',
    EN_CREATION = 'EN_CREATION',
    ARCHIVE = 'ARCHIVE',
}

/**
 * Entité Organisation
 * Structure de haut niveau qui chapeaute toutes les unités organisationnelles
 */
@Entity('organisations')
@Index(['etablissementId'])
@Index(['type'])
export class Organisation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: TypeOrganisation, default: TypeOrganisation.ETABLISSEMENT_SCOLAIRE })
    type!: TypeOrganisation;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logoUrl?: string;

    @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
    code?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    telephone?: string;

    @Column({ type: 'text', nullable: true })
    adresse?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    siteWeb?: string;

    @Column({ type: 'varchar', length: 30, default: StatutOrganisation.ACTIF })
    statut!: StatutOrganisation;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    // Référence à l'établissement (multi-tenancy)
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    // Métadonnées JSON flexibles
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Relations
    @OneToMany(() => UniteOrganisationnelle, (unite) => unite.organisation)
    unites?: UniteOrganisationnelle[];
}
