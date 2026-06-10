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
import { UniteOrganisationnelle } from './unite-organisationnelle.entity';

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
export enum NiveauResponsabilite {
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
@Index(['statut'])
export class Poste {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    intitulé!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'enum', enum: TypePoste, default: TypePoste.ADMINISTRATIF })
    type!: TypePoste;

    @Column({ type: 'enum', enum: NiveauResponsabilite, default: NiveauResponsabilite.EXECUTANT })
    niveauResponsabilite!: NiveauResponsabilite;

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

    @Column({ type: 'varchar', length: 200, nullable: true })
    occupantNom?: string;

    // Informations complémentaires
    @Column({ type: 'int', default: 1 })
    nombrePostes!: number;

    @Column({ type: 'uuid', nullable: true })
    superviseurId?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    superviseurNom?: string;

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
