/**
 * eLISAschool - Module Personnel/RH
 * Entité Progression Programme
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { MembrePersonnel } from './personnel.entity';
import { ProgrammeChapitre } from '@modules/programmes/entities';

@Entity('progressions_programme')
@Index(['enseignantId'])
@Index(['matiereId'])
@Index(['classeId'])
@Index(['periodeId'])
export class ProgressionProgramme {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    enseignantId!: string;

    @ManyToOne(() => MembrePersonnel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'enseignantId' })
    enseignant?: MembrePersonnel;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @Column({ type: 'uuid' })
    classeId!: string;

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @Column({ type: 'uuid', nullable: true })
    programmeChapitreId?: string;

    @ManyToOne(() => ProgrammeChapitre, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'programmeChapitreId' })
    programmeChapitre?: ProgrammeChapitre;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    pourcentageRealise!: number; // 0-100

    @Column({ type: 'varchar', length: 30, default: 'LEGACY' })
    modeCalcul!: string; // LEGACY | CHAPITRE | MIXTE

    @Column({ type: 'varchar', length: 200 })
    chapitreCourant!: string;

    @Column({ type: 'date' })
    dateEvaluation!: Date;

    @Column({ type: 'text', nullable: true })
    remarques?: string;

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
