/**
 * eLISAschool - Module Personnel/RH
 * Entité Évaluation Enseignant
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { MembrePersonnel } from './personnel.entity';

@Entity('evaluations_enseignants')
@Index(['enseignantId'])
@Index(['dateEvaluation'])
@Index(['categorie'])
export class EvaluationEnseignant {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    enseignantId!: string;

    @ManyToOne(() => MembrePersonnel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'enseignantId' })
    enseignant?: MembrePersonnel;

    @Column({ type: 'uuid' })
    evaluateurId!: string;

    @Column({ type: 'date' })
    dateEvaluation!: Date;

    @Column({ type: 'varchar', length: 30 })
    categorie!: string; // PEDAGOGIQUE, DISCIPLINE, PONCTUALITE, COLLABORATION, INNOVATION

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    note!: number; // 0-20

    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    @Column({ type: 'text', nullable: true })
    planAction?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
