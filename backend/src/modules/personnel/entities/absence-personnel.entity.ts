/**
 * ==================================
 * eLISAschool - Entité Absence Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { MembrePersonnel } from './personnel.entity';
import { Etablissement } from '@modules/etablissement/entities';

export enum TypeAbsencePersonnel {
    MALADIE = 'MALADIE',
    RETARD = 'RETARD',
    ABSENCE_NON_JUSTIFIEE = 'ABSENCE_NON_JUSTIFIEE',
    ABSENCE_JUSTIFIEE = 'ABSENCE_JUSTIFIEE',
    CONGES = 'CONGES',
    AUTRE = 'AUTRE',
}

export enum StatutJustification {
    NON_JUSTIFIE = 'NON_JUSTIFIE',
    EN_COURS = 'EN_COURS',
    JUSTIFIE = 'JUSTIFIE',
    REFUSE = 'REFUSE',
}

@Entity('absences_personnel')
@Index(['membrePersonnelId'])
@Index(['date'])
@Index(['type'])
@Index(['etablissementId'])
export class AbsencePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'varchar', length: 50 })
    type!: TypeAbsencePersonnel;

    @Column({ type: 'varchar', length: 30, default: StatutJustification.NON_JUSTIFIE })
    statutJustification!: StatutJustification;

    @Column({ type: 'time', nullable: true })
    heureDebut?: string | null;

    @Column({ type: 'time', nullable: true })
    heureFin?: string | null;

    @Column({ type: 'text', nullable: true })
    motif?: string | null;

    @Column({ type: 'text', nullable: true })
    justification?: string | null;

    @Column({ type: 'varchar', length: 200, nullable: true })
    justificatifUrl?: string | null;

    @Column({ type: 'uuid', nullable: true })
    valideParId?: string | null;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;
}
