/**
 * ==================================
 * eLISAschool - Entité Note
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

/**
 * Type d'évaluation
 */
export enum TypeEvaluation {
    DEVOIR = 'DEVOIR',
    INTERROGATION = 'INTERROGATION',
    EXAMEN = 'EXAMEN',
    PROJET = 'PROJET',
    PARTICIPATION = 'PARTICIPATION',
    AUTRE = 'AUTRE',
}

/**
 * Statut de la note
 */
export enum StatutNote {
    BROUILLON = 'BROUILLON',
    VALIDEE = 'VALIDEE',
    PUBLIEE = 'PUBLIEE',
}

/**
 * Entité Note
 */
@Entity('notes')
export class Note {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Utilisateur;

    @Column({ type: 'uuid' })
    enseignantId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'enseignantId' })
    enseignant!: Utilisateur;

    @Column({ type: 'varchar', length: 100 })
    matiere!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    classe?: string;

    @Column({ type: 'enum', enum: TypeEvaluation, default: TypeEvaluation.DEVOIR })
    typeEvaluation!: TypeEvaluation;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    valeur!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
    bareme!: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 1 })
    coefficient!: number;

    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    trimestre?: string; // T1, T2, T3

    @Column({ type: 'varchar', length: 20, nullable: true })
    anneeScolaire?: string; // 2024-2025

    @Column({ type: 'date', nullable: true })
    dateEvaluation?: Date;

    @Column({ type: 'enum', enum: StatutNote, default: StatutNote.BROUILLON })
    statut!: StatutNote;

    @Column({ type: 'uuid', nullable: true })
    validateurId?: string;

    @Column({ type: 'timestamp', nullable: true })
    valideeAt?: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Calcule la note sur 20
     */
    get noteSur20(): number {
        return (this.valeur / this.bareme) * 20;
    }
}

export default Note;
