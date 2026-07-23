/**
 * ==================================
 * eLISAschool - Entités Scoring Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Entités pour le système de scoring et classement du personnel:
 * - ScorePersonnel: Score agrégé par membre du personnel
 * - RegleScoringPersonnel: Règles configurables d'attribution de points
 * - HistoriqueScorePersonnel: Historique des modifications de scores
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
import { MembrePersonnel, TypePersonnel } from '@modules/personnel/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Periode } from '@modules/periodes/entities';
import { Utilisateur } from '@modules/auth/entities';
import { Matiere } from '@modules/matieres/entities';
import { Classe } from '@modules/classes/entities';

// =====================================================
// ENTITY 1: ScorePersonnel (scores agrégés)
// =====================================================

@Entity('scores_personnel')
@Index(['membrePersonnelId'])
@Index(['etablissementId'])
@Index(['anneeScolaireId'])
@Index(['periodeId'])
@Index(['typePersonnelId'])
@Index(['matiereId'])
@Index(['classeId'])
@Index(['scoreGlobal'])
@Index(['rangGlobal'])
@Index(['anneeScolaireId', 'membrePersonnelId'])
@Index(['typePersonnelId', 'scoreGlobal'])
@Index(['matiereId', 'scoreGlobal'])
@Index(['classeId', 'scoreGlobal'])
export class ScorePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    @Column({ type: 'uuid', nullable: true })
    typePersonnelId?: string;

    @ManyToOne(() => TypePersonnel, { nullable: true })
    @JoinColumn({ name: 'typePersonnelId' })
    typePersonnel?: TypePersonnel;

    @Column({ type: 'uuid', nullable: true })
    matiereId?: string;

    @ManyToOne(() => Matiere, { nullable: true })
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'uuid', nullable: true })
    classeId?: string;

    @ManyToOne(() => Classe, { nullable: true })
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    // Scores par catégorie
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    scoreGlobal!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    scoreAssiduite!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    scoreComportement!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    scorePerformance!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    scorePedagogie!: number;

    // Points
    @Column({ type: 'int', default: 0 })
    pointsPositifs!: number;

    @Column({ type: 'int', default: 0 })
    pointsNegatifs!: number;

    // Compteurs d'événements
    @Column({ type: 'int', default: 0 })
    nombreIncidents!: number;

    @Column({ type: 'int', default: 0 })
    nombreAbsences!: number;

    @Column({ type: 'int', default: 0 })
    nombreRetards!: number;

    @Column({ type: 'int', default: 0 })
    nombreEvaluations!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    noteMoyenneEvaluations?: number;

    // Classements (rangs)
    @Column({ type: 'int', nullable: true })
    rangGlobal?: number;

    @Column({ type: 'int', nullable: true })
    rangParCategorie?: number;

    @Column({ type: 'int', nullable: true })
    rangParMatiere?: number;

    @Column({ type: 'int', nullable: true })
    rangParClasse?: number;

    @Column({ type: 'timestamp with time zone', default: () => 'NOW()' })
    derniereMAJ!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// =====================================================
// ENTITY 2: RegleScoringPersonnel (règles configurables)
// =====================================================

@Entity('regles_scoring_personnel')
@Index(['etablissementId'])
@Index(['typeAction'])
@Index(['estActif'])
@Index(['categorieCible'])
@Index(['code', 'etablissementId'], { unique: true })
export class RegleScoringPersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'varchar', length: 100 })
    code!: string; // ABSENCE_NON_JUSTIFIEE, RETARD, EVALUATION_EXCELLENTE, etc.

    @Column({ type: 'varchar', length: 200 })
    libelle!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50 })
    typeAction!: string; // ASSEDUITE, COMPORTEMENT, PERFORMANCE, PEDAGOGIE

    @Column({ type: 'int' })
    pointsAttribues!: number; // Positif ou négatif

    @Column({ type: 'boolean', default: true })
    estAutomatique!: boolean;

    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    @Column({ type: 'int', default: 0 })
    priorite!: number;

    @Column({ type: 'simple-json', nullable: true })
    conditionsSupplementaires?: Record<string, any>;

    @Column({ type: 'varchar', length: 50, nullable: true })
    categorieCible?: string; // ENSEIGNANT, ADMIN, etc.

    @Column({ type: 'varchar', length: 50, nullable: true })
    typePersonnelCible?: string;

    @Column({ type: 'date', nullable: true })
    dateDebut?: Date;

    @Column({ type: 'date', nullable: true })
    dateFin?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// =====================================================
// ENTITY 3: HistoriqueScorePersonnel (traçabilité)
// =====================================================

export enum TypeModificationScore {
    ATTRIBUTION_POINTS = 'attribution_points',
    RESET_PERIODE = 'reset_periode',
    CALCUL_AUTOMATIQUE = 'calcul_automatique',
    CORRECTION_MANUELLE = 'correction_manuelle',
    INCIDENT = 'incident',
    ABSENCE = 'absence',
    EVALUATION = 'evaluation',
}

@Entity('historique_scores_personnel')
@Index(['scorePersonnelId'])
@Index(['membrePersonnelId'])
@Index(['etablissementId'])
@Index(['anneeScolaireId'])
@Index(['typeModification'])
@Index(['sourceModule', 'sourceId'])
@Index(['categorieScore'])
@Index(['createdAt'])
@Index(['membrePersonnelId', 'anneeScolaireId'])
export class HistoriqueScorePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    scorePersonnelId!: string;

    @ManyToOne(() => ScorePersonnel)
    @JoinColumn({ name: 'scorePersonnelId' })
    scorePersonnel?: ScorePersonnel;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    @Column({ type: 'varchar', length: 50 })
    typeModification!: TypeModificationScore;

    @Column({ type: 'varchar', length: 50, nullable: true })
    sourceModule?: string; // suivi-personnel, notes, etc.

    @Column({ type: 'uuid', nullable: true })
    sourceId?: string;

    @Column({ type: 'int', default: 0 })
    pointsAnciens!: number;

    @Column({ type: 'int' })
    pointsNouveaux!: number;

    @Column({ type: 'int' })
    pointsDelta!: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    categorieScore?: string; // assiduite, comportement, performance, pedagogie

    @Column({ type: 'text', nullable: true })
    raison?: string;

    @Column({ type: 'boolean', default: false })
    declencheurAutomatique!: boolean;

    @Column({ type: 'uuid', nullable: true })
    utilisateurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    @CreateDateColumn()
    createdAt!: Date;
}
