/**
 * ==================================
 * eLISAschool - Entité Workflow Validation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Entité générique pour gérer les workflows de validation multi-niveau
 * Réutilisable par tous les modules (notes, bulletins, cantine, transport, etc.)
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
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut du workflow de validation
 */
export enum StatutWorkflow {
    EN_COURS = 'EN_COURS',
    COMPLETEE = 'COMPLETEE',
    REJETEE = 'REJETEE',
    ANNULEE = 'ANNULEE',
}

/**
 * Décision de validation à un niveau donné
 */
export enum DecisionValidation {
    APPROUVE = 'APPROUVE',
    REJETE = 'REJETE',
}

/**
 * Entité WorkflowValidation
 * 
 * Cette entité permet de configurer et suivre des workflows de validation
 * avec plusieurs niveaux d'approbation pour n'importe quelle entité métier.
 * 
 * Exemple d'utilisation pour les notes :
 * - Niveau 1: ENSEIGNANT (saisie)
 * - Niveau 2: CHEF_ETABLISSEMENT (validation)
 * - Niveau 3: ADMIN (validation finale)
 */
@Entity('workflows_validation')
@Index(['module', 'entiteId'])
@Index(['statut', 'niveauActuel'])
@Index(['etablissementId'])
export class WorkflowValidation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Module concerné (notes, bulletins, cantine, transport, etc.)
     */
    @Column({ type: 'varchar', length: 50 })
    module!: string;

    /**
     * ID de l'entité métier à valider
     */
    @Column({ type: 'uuid' })
    entiteId!: string;

    /**
     * Type de l'entité (Note, Bulletin, InscriptionCantine, etc.)
     */
    @Column({ type: 'varchar', length: 100 })
    entiteType!: string;

    /**
     * Nombre de niveaux de validation requis
     */
    @Column({ type: 'int', default: 1 })
    niveauxRequis!: number;

    /**
     * Niveau actuel atteint
     */
    @Column({ type: 'int', default: 0 })
    niveauActuel!: number;

    /**
     * Statut du workflow
     */
    @Column({ type: 'enum', enum: StatutWorkflow, default: StatutWorkflow.EN_COURS })
    statut!: StatutWorkflow;

    /**
     * Configuration des rôles requis par niveau (JSON)
     * Exemple: {"1": "ENSEIGNANT", "2": "CHEF_ETABLISSEMENT", "3": "ADMIN"}
     */
    @Column({ type: 'simple-json', nullable: true })
    configRoles?: Record<string, string>;

    /**
     * Historique complet des validations (JSON)
     */
    @Column({ type: 'simple-json', nullable: true })
    historique?: ValidationNiveau[];

    /**
     * ID du dernier validateur
     */
    @Column({ type: 'uuid', nullable: true })
    dernierValidateurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'dernierValidateurId' })
    dernierValidateur?: Utilisateur;

    /**
     * Date de completion du workflow
     */
    @Column({ type: 'timestamp', nullable: true })
    dateCompletion?: Date;

    /**
     * Commentaire global (optionnel)
     */
    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    /**
     * Établissement (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * Interface pour un niveau de validation dans l'historique
 */
export interface ValidationNiveau {
    niveau: number;
    validateurId: string;
    validateurNom?: string;
    roleRequis: string;
    decision: DecisionValidation;
    commentaire?: string;
    dateValidation: string; // ISO string
}
