/**
 * ==================================
 * eLISAschool - Entité Affectation Poste
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Trace l'historique des affectations d'un membre du personnel à un poste.
 * Permet de suivre les mutations, promotions et transferts avec traçabilité complète.
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
import { MembrePersonnel } from './personnel.entity';
import { ContratPersonnel } from './contrat-personnel.entity';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut d'une affectation
 */
export enum StatutAffectation {
    ACTIF = 'ACTIF',
    TERMINE = 'TERMINE',
    EN_ATTENTE = 'EN_ATTENTE',
    SUSPENDU = 'SUSPENDU',
}

/**
 * Type de mutation
 */
export enum TypeMutation {
    NOUVELLE = 'NOUVELLE', // Première affectation
    PROMOTION = 'PROMOTION', // Avancement
    TRANSFERT = 'TRANSFERT', // Changement de poste/service
    INTERIM = 'INTERIM', // Remplacement temporaire
    REINTEGRATION = 'REINTEGRATION', // Retour après congé
}

@Entity('affectations_postes')
@Index(['membrePersonnelId'])
@Index(['posteId'])
@Index(['contratId'])
@Index(['statut'])
@Index(['etablissementId'])
@Index(['membrePersonnelId', 'dateDebut', 'dateFin']) // Pour recherche historique
@Index(['posteId', 'statut']) // Pour postes vacants/occupés
export class AffectationPoste {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'uuid' })
    posteId!: string;

    @ManyToOne(() => Poste, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'posteId' })
    poste?: Poste;

    @Column({ type: 'uuid', nullable: true })
    contratId?: string;

    @ManyToOne(() => ContratPersonnel, { nullable: true })
    @JoinColumn({ name: 'contratId' })
    contrat?: ContratPersonnel;

    @Column({ type: 'uuid', nullable: true })
    uniteOrganisationnelleId?: string;

    @ManyToOne(() => UniteOrganisationnelle, { nullable: true })
    @JoinColumn({ name: 'uniteOrganisationnelleId' })
    uniteOrganisationnelle?: UniteOrganisationnelle;

    // Dates de l'affectation
    @Column({ type: 'timestamp', default: () => 'NOW()' })
    dateDebut!: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    // Statut et type
    @Column({ type: 'varchar', length: 30, default: StatutAffectation.ACTIF })
    statut!: StatutAffectation;

    @Column({ type: 'varchar', length: 30, default: TypeMutation.NOUVELLE })
    typeMutation!: TypeMutation;

    // Informations financières
    @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true })
    salaireAssocie?: number;

    // Traçabilité
    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    @Column({ type: 'uuid', nullable: true })
    valideParId?: string;

    @Column({ type: 'timestamp', nullable: true })
    dateValidation?: Date;

    // Multi-tenancy
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
