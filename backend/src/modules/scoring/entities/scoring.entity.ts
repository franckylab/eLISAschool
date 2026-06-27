/**
 * ==================================
 * eLISAschool - Entité ConfigurationScoring
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Configuration des critères de scoring pour les bulletins
 * Permet de personnaliser les calculs de moyennes, rangs, et appréciations
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
import { AnneeScolaire } from '@modules/annees-scolaires/entities';

/**
 * Méthode de calcul de la moyenne générale
 */
export enum MethodeCalculMoyenne {
    MOYENNE_SIMPLE = 'MOYENNE_SIMPLE', // Moyenne arithmétique
    MOYENNE_PONDEREE = 'MOYENNE_PONDEREE', // Pondérée par coefficients
    MOYENNE_COMPOSEE = 'MOYENNE_COMPOSEE', // Composition de moyennes
}

/**
 * Système de notation
 */
export enum SystemeNotation {
    SUR_20 = 'SUR_20',
    SUR_100 = 'SUR_100',
    LETTRES = 'LETTRES', // A, B, C, D, E, F
    POINTS = 'POINTS', // Points GPA
}

@Entity('configurations_scoring')
@Index(['etablissementId'])
@Index(['anneeScolaireId'])
@Index(['etablissementId', 'anneeScolaireId'], { unique: true })
export class ConfigurationScoring {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'uuid', nullable: true })
    anneeScolaireId?: string;

    @ManyToOne(() => AnneeScolaire, { nullable: true })
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    // Méthode de calcul
    @Column({
        type: 'varchar',
        length: 30,
        enum: MethodeCalculMoyenne,
        default: MethodeCalculMoyenne.MOYENNE_PONDEREE,
    })
    methodeCalcul!: MethodeCalculMoyenne;

    // Système de notation
    @Column({
        type: 'varchar',
        length: 20,
        enum: SystemeNotation,
        default: SystemeNotation.SUR_20,
    })
    systemeNotation!: SystemeNotation;

    // Configuration des notes
    @Column({ type: 'float', default: 0 })
    noteMinimale!: number;

    @Column({ type: 'float', default: 20 })
    noteMaximale!: number;

    @Column({ type: 'float', default: 10 })
    noteValidation!: number; // Note minimale pour valider

    // Configuration des coefficients
    @Column({ type: 'boolean', default: true })
    utiliserCoefficients!: boolean;

    @Column({ type: 'float', default: 1 })
    coefficientDefaut!: number;

    // Configuration des rangs
    @Column({ type: 'boolean', default: true })
    calculerRang!: boolean;

    @Column({ type: 'boolean', default: true })
    afficherRang!: boolean;

    // Configuration des mentions
    @Column({ type: 'boolean', default: true })
    utiliserMentions!: boolean;

    @Column({ type: 'simple-json', nullable: true })
    configurationMentions?: {
        mention: string;
        noteMin: number;
        noteMax: number;
        couleur?: string;
    }[];

    // Configuration des appréciations
    @Column({ type: 'boolean', default: true })
    genererAppreciationsAuto!: boolean;

    @Column({ type: 'text', nullable: true })
    modeleAppreciation?: string;

    // Configuration des moyennes de classe
    @Column({ type: 'boolean', default: true })
    calculerMoyenneClasse!: boolean;

    @Column({ type: 'boolean', default: true })
    afficherMoyenneClasse!: boolean;

    @Column({ type: 'boolean', default: true })
    afficherMoyenneMin!: boolean;

    @Column({ type: 'boolean', default: true })
    afficherMoyenneMax!: boolean;

    // Paramètres avancés
    @Column({ type: 'boolean', default: false })
    arrondirNotes!: boolean;

    @Column({ type: 'int', default: 2 })
    precisionDecimales!: number; // Nombre de décimales

    @Column({ type: 'boolean', default: false })
    supprimerNoteBasse!: boolean; // Supprimer la note la plus basse

    @Column({ type: 'int', default: 0 })
    nombreNotesSupprimees!: number; // Nombre de notes basses à supprimer

    // Activation
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
/**
 * ==================================
 * eLISAschool - Entités Scoring
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
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
