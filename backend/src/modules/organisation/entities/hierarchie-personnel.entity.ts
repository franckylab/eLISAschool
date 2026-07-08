/**
 * ==================================
 * eLISAschool - Entité HierarchiePersonnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Trace les liens hiérarchiques entre membres du personnel.
 * Permet de construire l'organigramme dynamique et de gérer les relations
 * de subordination/supervision.
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
import { Etablissement } from '@modules/etablissement/entities';
import { Poste } from './poste.entity';

/**
 * Type de relation hiérarchique
 */
export enum TypeRelationHierarchique {
    SUPERVISE_DIRECT = 'SUPERVISE_DIRECT',
    SUPERVISE_INDIRECT = 'SUPERVISE_INDIRECT',
    RATTACHEMENT_FONCTIONNEL = 'RATTACHEMENT_FONCTIONNEL',
    COLLABORATION = 'COLLABORATION',
    REMPLACEMENT = 'REPLACEMENT',
    INTERIM = 'INTERIM',
}

/**
 * Statut de la relation hiérarchique
 */
export enum StatutRelation {
    ACTIVE = 'ACTIVE',
    HISTORIQUE = 'HISTORIQUE',
    PLANIFIEE = 'PLANIFIEE',
}

/**
 * Entité HierarchiePersonnel
 * Modélise les relations de subordination dans l'organisation
 */
@Entity('hierarchie_personnel')
@Index(['personnelId'])
@Index(['superieurId'])
@Index(['typeRelation'])
@Index(['posteId'])
@Index(['etablissementId'])
export class HierarchiePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Personne subordonnée (nullable — peut être une hiérarchie de poste avant assignation)
    @Column({ type: 'uuid', nullable: true })
    personnelId?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    personnelNom?: string;

    // Supérieur hiérarchique (nullable)
    @Column({ type: 'uuid', nullable: true })
    superieurId?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    superieurNom?: string;

    // Type de relation
    @Column({ type: 'enum', enum: TypeRelationHierarchique, default: TypeRelationHierarchique.SUPERVISE_DIRECT })
    typeRelation!: TypeRelationHierarchique;

    @Column({ type: 'enum', enum: StatutRelation, default: StatutRelation.ACTIVE })
    statut!: StatutRelation;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    // Contexte — multi-tenant
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string | null;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement | null;

    @Column({ type: 'uuid', nullable: true })
    posteId?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    posteIntitule?: string;

    @Column({ type: 'uuid', nullable: true })
    uniteOrganisationnelleId?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    uniteNom?: string;

    // Référence au poste (FK — permet de lier sans personnel assigné)
    @ManyToOne(() => Poste, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'posteId' })
    poste?: Poste;

    // Dates de validité de la relation
    @Column({ type: 'timestamp', nullable: true })
    dateDebut?: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
