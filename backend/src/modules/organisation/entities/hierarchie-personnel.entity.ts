/**
 * ==================================
 * eLISAschool - Entité HierarchiePersonnel
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Trace les liens hiérarchiques entre membres du personnel.
 * Permet de construire l'organigramme dynamique et de gérer les relations
 * de subordination/supervision.
 *
 * Refonte v2.0 :
 * - typeRelation : FK vers TypeRelationHierarchique (remplace l'enum PostgreSQL)
 * - FK ajoutées vers membres_personnel et unites_organisationnelles
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
import { MembrePersonnel } from '@modules/personnel/entities';
import { Poste } from './poste.entity';
import { TypeRelationHierarchique } from './type-relation-hierarchique.entity';

/**
 * Statut de la relation hiérarchique (enum fermé — non modifiable)
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
@Index(['typeRelationId'])
@Index(['posteId'])
@Index(['etablissementId'])
export class HierarchiePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Personne subordonnée (nullable — peut être une hiérarchie de poste avant assignation)
    @Column({ type: 'uuid', nullable: true })
    personnelId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'personnelId' })
    personnel?: MembrePersonnel;

    // Supérieur hiérarchique (nullable)
    @Column({ type: 'uuid', nullable: true })
    superieurId?: string;

    // FK vers TypeRelationHierarchique (remplace l'enum PostgreSQL)
    @Column({ type: 'uuid', nullable: true })
    typeRelationId?: string;

    @ManyToOne(() => TypeRelationHierarchique, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'typeRelationId' })
    typeRelation?: TypeRelationHierarchique;

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

    @Column({ type: 'uuid', nullable: true })
    uniteOrganisationnelleId?: string;

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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
