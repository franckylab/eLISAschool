/**
 * ==================================
 * eLISAschool - Entité HierarchiePersonnel
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Trace les liens hiérarchiques entre membres du personnel.
 * Permet de construire l'organigramme dynamique et de gérer les relations
 * de subordination/supervision.
 *
 * Sémantique des colonnes :
 * - personnelId / superieurId : relations personne → personne (MembrePersonnel)
 * - posteId / superieurPosteId : relations poste → poste (Poste — organigramme, templates, seeds)
 *
 * Refonte v4.0 :
 * - typeRelationId (FK) → typeRelation (varchar enum : DIRECT, FONCTIONNEL)
 * - uniteOrganisationnelleId supprimé (redondant avec Poste)
 * - superieurPosteId ajouté (le poste supérieur n'est plus stocké dans superieurId)
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

/**
 * Statut de la relation hiérarchique (enum fermé — non modifiable)
 */
export enum StatutRelation {
    ACTIVE = 'ACTIVE',
    HISTORIQUE = 'HISTORIQUE',
    PLANIFIEE = 'PLANIFIEE',
}

/**
 * Type de relation hiérarchique (enum varchar — remplace la table TypeRelationHierarchique)
 */
export enum TypeRelationHierarchique {
    DIRECT = 'DIRECT',
    FONCTIONNEL = 'FONCTIONNEL',
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
@Index(['superieurPosteId'])
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

    // Supérieur hiérarchique — personne (nullable)
    @Column({ type: 'uuid', nullable: true })
    superieurId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'superieurId' })
    superieur?: MembrePersonnel;

    // Type de relation (enum varchar — remplace la FK TypeRelationHierarchique)
    @Column({ type: 'varchar', length: 30, default: TypeRelationHierarchique.DIRECT })
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

    // Référence au poste subordonné (FK — permet de lier sans personnel assigné)
    @ManyToOne(() => Poste, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'posteId' })
    poste?: Poste;

    // Poste supérieur hiérarchique (relations poste → poste : organigramme, templates, seeds)
    @Column({ type: 'uuid', nullable: true })
    superieurPosteId?: string;

    @ManyToOne(() => Poste, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'superieurPosteId' })
    superieurPoste?: Poste;

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
