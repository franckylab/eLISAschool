/**
 * ==================================
 * eLISAschool - Entité RemplacementHeureCours
 * ==================================
 * Gestion des remplacements d'enseignants avec workflow de validation.
 * Une demande de remplacement est liée à une HeureCours concrète.
 * Flux : DEMANDÉ → VALIDÉ → EXÉCUTÉ (ou REJETÉ / ANNULÉ)
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { HeureCours } from './heure-cours.entity';
import { MembrePersonnel } from './personnel.entity';
import { Etablissement } from '@modules/etablissement/entities';

// ─── Enums ─────────────────────────────────────────────────────

export enum StatutRemplacement {
    EN_ATTENTE = 'EN_ATTENTE',
    VALIDEE = 'VALIDEE',
    REJETEE = 'REJETEE',
    EXECUTEE = 'EXECUTEE',
    ANNULEE = 'ANNULEE',
}

// ─── Entité ────────────────────────────────────────────────────

@Entity('remplacements_heure_cours')
@Index(['etablissementId'])
@Index(['heureCoursId'])
@Index(['statut'])
@Index(['demandeurId'])
@Index(['remplacantId'])
export class RemplacementHeureCours {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Heure de cours à remplacer (FK → HeureCours) */
    @Column({ type: 'uuid' })
    heureCoursId!: string;

    @ManyToOne(() => HeureCours, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'heureCoursId' })
    heureCours?: HeureCours;

    /** Demandeur du remplacement (FK → MembrePersonnel) */
    @Column({ type: 'uuid' })
    demandeurId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'demandeurId' })
    demandeur?: MembrePersonnel;

    /** Remplaçant proposé ou affecté (nullable : proposé à la demande) */
    @Column({ type: 'uuid', nullable: true })
    remplacantId?: string | null;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'remplacantId' })
    remplacant?: MembrePersonnel;

    /** Motif du remplacement (obligatoire) */
    @Column({ type: 'text' })
    motif!: string;

    /** Statut du workflow de remplacement */
    @Column({ type: 'varchar', length: 30, default: StatutRemplacement.EN_ATTENTE })
    statut!: StatutRemplacement;

    /** Date de la demande */
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateDemande!: Date;

    /** Date de validation (nullable) */
    @Column({ type: 'timestamp', nullable: true })
    dateValidation?: Date | null;

    /** Date d'exécution effective (nullable) */
    @Column({ type: 'timestamp', nullable: true })
    dateExecution?: Date | null;

    /** Validateur (FK → MembrePersonnel, nullable) */
    @Column({ type: 'uuid', nullable: true })
    valideParId?: string | null;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'valideParId' })
    validePar?: MembrePersonnel;

    /** Commentaires (validation, rejet, annotation) */
    @Column({ type: 'text', nullable: true })
    commentaires?: string | null;

    /** Établissement (multi-tenancy) */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
