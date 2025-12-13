/**
 * ==================================
 * eLISAschool - Entités Scoring
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
    Index,
} from 'typeorm';

/**
 * Type d'indicateur de scoring
 */
export enum TypeIndicateur {
    ACADEMIQUE = 'ACADEMIQUE',
    COMPORTEMENT = 'COMPORTEMENT',
    ASSIDUITE = 'ASSIDUITE',
    PARTICIPATION = 'PARTICIPATION',
    GLOBAL = 'GLOBAL',
}

/**
 * Score d'un élève
 */
@Entity('scores_eleves')
@Index(['eleveId', 'type'])
@Index(['periodeId', 'type'])
export class ScoreEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @Column({ type: 'enum', enum: TypeIndicateur })
    type!: TypeIndicateur;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    score!: number;

    @Column({ type: 'int', nullable: true })
    rang?: number;

    @Column({ type: 'simple-json', nullable: true })
    details?: Record<string, number>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * Historique des scores
 */
@Entity('historique_scores')
@Index(['eleveId', 'date'])
export class HistoriqueScore {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @Column({ type: 'enum', enum: TypeIndicateur })
    type!: TypeIndicateur;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    score!: number;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    raison?: string;

    @CreateDateColumn()
    createdAt!: Date;
}

/**
 * Règle de scoring
 */
@Entity('regles_scoring')
export class RegleScoring {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: TypeIndicateur })
    type!: TypeIndicateur;

    @Column({ type: 'varchar', length: 100 })
    evenement!: string; // ex: 'presence', 'note_>=_16', 'participation_club'

    @Column({ type: 'int' })
    points!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

export default { ScoreEleve, HistoriqueScore, RegleScoring, TypeIndicateur };
