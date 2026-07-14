/**
 * ==================================
 * eLISAschool - Entité Poste
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente un poste/fonction au sein d'une unité organisationnelle.
 * Un poste est occupé par un membre du personnel et définit ses responsabilités.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { MembrePersonnel, TypePersonnel } from '@modules/personnel/entities';
import { UniteOrganisationnelle } from './unite-organisationnelle.entity';
import { Fonction } from '@modules/fonctions/entities';

/**
 * Type de poste
 */
export enum TypePoste {
    DIRECTION = 'DIRECTION',
    ENSEIGNANT = 'ENSEIGNANT',
    ADMINISTRATIF = 'ADMINISTRATIF',
    TECHNIQUE = 'TECHNIQUE',
    SERVICE = 'SERVICE',
    STAGE = 'STAGE',
    TEMPORAIRE = 'TEMPORAIRE',
    AUTRE = 'AUTRE',
}

/**
 * Niveau de responsabilité
 */
export enum NiveauResponsabiliteEnum {
    DIRECTION_GENERALE = 'DIRECTION_GENERALE',
    DIRECTION_ADJOINTE = 'DIRECTION_ADJOINTE',
    RESPONSABLE = 'RESPONSABLE',
    COORDINATEUR = 'COORDINATEUR',
    SUPERVISEUR = 'SUPERVISEUR',
    EXECUTANT = 'EXECUTANT',
    STAGIAIRE = 'STAGIAIRE',
}

/**
 * Statut du poste
 */
export enum StatutPoste {
    ACTIF = 'ACTIF',
    VACANT = 'VACANT',
    SUPPRIME = 'SUPPRIME',
    EN_ATTENTE = 'EN_ATTENTE',
}

/**
 * Entité Poste
 * Définit une fonction/position dans l'organigramme
 */
@Entity('postes')
@Index(['uniteOrganisationnelleId'])
@Index(['code'])
@Index(['type'])
@Index(['typePersonnelId'])
@Index(['statut'])
@Index(['fonctionId'])
@Index(['occupantsCount'])
export class Poste {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    intitulé!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    categoriePosteCode?: string;

    @Column({ type: 'uuid', nullable: true })
    fonctionId?: string;

    @ManyToOne(() => Fonction, { nullable: true })
    @JoinColumn({ name: 'fonctionId' })
    fonction?: Fonction;

    @Column({ type: 'varchar', length: 50, nullable: true })
    niveauResponsabiliteCode?: string;

    @Column({ type: 'enum', enum: TypePoste, default: TypePoste.ADMINISTRATIF })
    type!: TypePoste;

    @Column({ type: 'uuid', nullable: true })
    typePersonnelId?: string;

    @ManyToOne(() => TypePersonnel, { nullable: true })
    @JoinColumn({ name: 'typePersonnelId' })
    typePersonnel?: TypePersonnel;

    @Column({ type: 'enum', enum: NiveauResponsabiliteEnum, default: NiveauResponsabiliteEnum.EXECUTANT })
    niveauResponsabilite!: NiveauResponsabiliteEnum;

    @Column({ type: 'enum', enum: StatutPoste, default: StatutPoste.ACTIF })
    statut!: StatutPoste;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    // Référence à l'unité organisationnelle
    @Column({ type: 'uuid' })
    uniteOrganisationnelleId!: string;

    // Personne occupant le poste (peut être vide si poste vacant)
    @Column({ type: 'uuid', nullable: true })
    occupantId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'occupantId' })
    occupant?: MembrePersonnel;

    @Column({ type: 'varchar', length: 200, nullable: true })
    occupantNom?: string;

    // Informations complémentaires
    @Column({ type: 'int', default: 1 })
    nombrePostes!: number;

    @Column({ type: 'int', default: 0 })
    occupantsCount!: number;

    @Column({ type: 'varchar', length: 30, nullable: true })
    modeRemunerationDefaut?: string;

    @Column({ type: 'jsonb', nullable: true })
    competencesRequises?: string[];

    @Column({ type: 'jsonb', nullable: true })
    missions?: string[];

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => UniteOrganisationnelle, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'uniteOrganisationnelleId' })
    uniteOrganisationnelle?: UniteOrganisationnelle;
}
