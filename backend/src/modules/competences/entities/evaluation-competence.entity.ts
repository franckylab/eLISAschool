/**
 * ==================================
 * eLISAschool - Entité EvaluationCompetence
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Évaluation des compétences (APC - Approche Par Compétences)
 * Liée à une note traditionnelle pour un système hybride
 * Respecte les exigences du MINESEC pour l'APC
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
import { Note } from '@modules/notes/entities';
import { Competence } from '@modules/competences/entities';

/**
 * Niveau de maîtrise d'une compétence (standard APC)
 */
export enum NiveauMaitrise {
    DEBUTANT = 'DEBUTANT',         // Niveau 1 - En cours d'acquisition
    EN_COURS = 'EN_COURS',         // Niveau 2 - Acquisition partielle
    ACQUIS = 'ACQUIS',             // Niveau 3 - Compétence acquise
    EXPERT = 'EXPERT',             // Niveau 4 - Maîtrise avancée
}

/**
 * Labels pour affichage
 */
export const NIVEAU_MAITRISE_LABELS: Record<NiveauMaitrise, string> = {
    [NiveauMaitrise.DEBUTANT]: 'Niveau 1 - Débutant',
    [NiveauMaitrise.EN_COURS]: 'Niveau 2 - En cours',
    [NiveauMaitrise.ACQUIS]: 'Niveau 3 - Acquis',
    [NiveauMaitrise.EXPERT]: 'Niveau 4 - Expert',
};

/**
 * Couleurs pour affichage visuel
 */
export const NIVEAU_MAITRISE_COLORS: Record<NiveauMaitrise, string> = {
    [NiveauMaitrise.DEBUTANT]: '#EF4444',   // Rouge
    [NiveauMaitrise.EN_COURS]: '#F59E0B',   // Orange
    [NiveauMaitrise.ACQUIS]: '#10B981',     // Vert
    [NiveauMaitrise.EXPERT]: '#3B82F6',     // Bleu
};

@Entity('evaluations_competences')
@Index(['noteId'])
@Index(['competenceId'])
@Index(['noteId', 'competenceId'], { unique: true })
export class EvaluationCompetence {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    noteId!: string;

    @ManyToOne(() => Note, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'noteId' })
    note!: Note;

    @Column({ type: 'uuid' })
    competenceId!: string;

    @ManyToOne(() => Competence)
    @JoinColumn({ name: 'competenceId' })
    competence!: Competence;

    /**
     * Niveau de maîtrise atteint par l'élève
     */
    @Column({ type: 'varchar', length: 20, enum: NiveauMaitrise })
    niveauMaitrise!: NiveauMaitrise;

    /**
     * Score numérique optionnel (ex: 2.5/4)
     * Permet un calcul plus fin que le niveau seul
     */
    @Column({ type: 'float', nullable: true })
    score?: number;

    /**
     * Observation détaillée du professeur
     */
    @Column({ type: 'text', nullable: true })
    observation?: string;

    /**
     * Indicateur de progression
     * true = l'élève est en progression dans cette compétence
     */
    @Column({ type: 'boolean', default: false })
    enProgression!: boolean;

    /**
     * Date d'évaluation de la compétence
     */
    @Column({ type: 'date', nullable: true })
    dateEvaluation?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    /**
     * Convertit le niveau de maîtrise en score numérique (sur 4)
     */
    get scoreNumerique(): number {
        switch (this.niveauMaitrise) {
            case NiveauMaitrise.DEBUTANT:
                return 1;
            case NiveauMaitrise.EN_COURS:
                return 2;
            case NiveauMaitrise.ACQUIS:
                return 3;
            case NiveauMaitrise.EXPERT:
                return 4;
            default:
                return 0;
        }
    }

    /**
     * Convertit le score numérique en pourcentage
     */
    get pourcentage(): number {
        const score = this.score ?? this.scoreNumerique;
        return (score / 4) * 100;
    }

    /**
     * Label lisible du niveau de maîtrise
     */
    get niveauLabel(): string {
        return NIVEAU_MAITRISE_LABELS[this.niveauMaitrise];
    }

    /**
     * Couleur associée au niveau
     */
    get niveauColor(): string {
        return NIVEAU_MAITRISE_COLORS[this.niveauMaitrise];
    }
}
