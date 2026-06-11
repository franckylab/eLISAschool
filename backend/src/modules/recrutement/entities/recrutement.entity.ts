/**
 * ==================================
 * eLISAschool - Entités Recrutement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Entités pour le système de recrutement complet :
 * - OffreEmploi: Offres d'emploi publiées
 * - Candidature: Suivi des candidats dans le pipeline
 * - Entretien: Planification et évaluation des interviews
 * - Onboarding: Checklist d'intégration post-embauche
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
import { MembrePersonnel, TypePersonnel } from '@modules/personnel/entities';
import { UniteOrganisationnelle, Poste } from '@modules/organisation/entities';

// =====================================================
// ENUMS
// =====================================================

export enum StatutOffreEmploi {
    BROUILLON = 'BROUILLON',
    PUBLIEE = 'PUBLIEE',
    SUSPENDUE = 'SUSPENDUE',
    TERMINEE = 'TERMINEE',
    ANNULEE = 'ANNULEE',
}

export enum StatutCandidature {
    RECUE = 'RECUE',
    EN_COURS_EXAMEN = 'EN_COURS_EXAMEN',
    PRESLECTIONNEE = 'PRESLECTIONNEE',
    CONVOQUEE = 'CONVOQUEE',
    RETENUE = 'RETENUE',
    REFUSEE = 'REFUSEE',
    LISTE_ATTENTE = 'LISTE_ATTENTE',
}

export enum TypeEntretien {
    TELEPHONIQUE = 'TELEPHONIQUE',
    TECHNIQUE = 'TECHNIQUE',
    RH = 'RH',
    FINAL = 'FINAL',
    PANEL = 'PANEL',
}

export enum StatutEntretien {
    PLANIFIE = 'PLANIFIE',
    EN_COURS = 'EN_COURS',
    TERMINE = 'TERMINE',
    ANNULE = 'ANNULE',
    REPORTE = 'REPORTE',
}

export enum StatutOnboarding {
    EN_COURS = 'EN_COURS',
    TERMINE = 'TERMINE',
    EN_RETARD = 'EN_RETARD',
}

// =====================================================
// ENTITY 1: OffreEmploi
// =====================================================

@Entity('offres_emploi')
@Index(['etablissementId'])
@Index(['statut'])
@Index(['posteId'])
@Index(['uniteOrganisationnelleId'])
@Index(['datePublication'])
@Index(['dateLimite'])
export class OffreEmploi {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    posteId?: string;

    @ManyToOne(() => Poste, { nullable: true })
    @JoinColumn({ name: 'posteId' })
    poste?: Poste;

    @Column({ type: 'uuid', nullable: true })
    uniteOrganisationnelleId?: string;

    @ManyToOne(() => UniteOrganisationnelle, { nullable: true })
    @JoinColumn({ name: 'uniteOrganisationnelleId' })
    uniteOrganisationnelle?: UniteOrganisationnelle;

    @Column({ type: 'varchar', length: 200 })
    titre!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'text', nullable: true })
    missions?: string;

    @Column({ type: 'text', nullable: true })
    profilRecherche?: string;

    @Column({ type: 'text', nullable: true })
    competencesRequises?: string;

    @Column({ type: 'text', nullable: true })
    experienceRequise?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    niveauEtudeRequis?: string;

    @Column({ type: 'decimal', precision: 10, scale: 0, nullable: true })
    salaireMin?: number;

    @Column({ type: 'decimal', precision: 10, scale: 0, nullable: true })
    salaireMax?: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    typeContratPropose?: string;

    @Column({ type: 'varchar', length: 30, default: StatutOffreEmploi.BROUILLON })
    statut!: StatutOffreEmploi;

    @Column({ type: 'timestamp with time zone', nullable: true })
    datePublication?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    dateLimite?: Date;

    @Column({ type: 'int', default: 0 })
    nombrePostesDisponibles!: number;

    @Column({ type: 'int', default: 0 })
    nombreCandidatures!: number;

    @Column({ type: 'uuid' })
    publieParId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'publieParId' })
    publiePar?: MembrePersonnel;

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

// =====================================================
// ENTITY 2: Candidature
// =====================================================

@Entity('candidatures')
@Index(['offreEmploiId'])
@Index(['statut'])
@Index(['email'])
@Index(['telephone'])
@Index(['etablissementId'])
@Index(['createdAt'])
@Index(['offreEmploiId', 'statut'])
export class Candidature {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    offreEmploiId!: string;

    @ManyToOne(() => OffreEmploi)
    @JoinColumn({ name: 'offreEmploiId' })
    offreEmploi?: OffreEmploi;

    @Column({ type: 'varchar', length: 200 })
    nomComplet!: string;

    @Column({ type: 'varchar', length: 150 })
    email!: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephone?: string;

    @Column({ type: 'text', nullable: true })
    cvUrl?: string;

    @Column({ type: 'text', nullable: true })
    lettreMotivationUrl?: string;

    @Column({ type: 'text', nullable: true })
    portfolioUrl?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    niveauEtude?: string;

    @Column({ type: 'int', nullable: true })
    anneesExperience?: number;

    @Column({ type: 'text', nullable: true })
    competences?: string;

    @Column({ type: 'text', nullable: true })
    commentaires?: string;

    @Column({ type: 'varchar', length: 30, default: StatutCandidature.RECUE })
    statut!: StatutCandidature;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    noteEvaluation?: number;

    @Column({ type: 'text', nullable: true })
    evaluationCommentaire?: string;

    @Column({ type: 'uuid', nullable: true })
    examineParId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'examineParId' })
    examinePar?: MembrePersonnel;

    @Column({ type: 'uuid', nullable: true })
    membrePersonnelId?: string; // Si candidat recruté

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

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

// =====================================================
// ENTITY 3: Entretien
// =====================================================

@Entity('entretiens_recrutement')
@Index(['candidatureId'])
@Index(['dateEntretien'])
@Index(['type'])
@Index(['statut'])
@Index(['evaluateurId'])
@Index(['etablissementId'])
export class Entretien {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    candidatureId!: string;

    @ManyToOne(() => Candidature)
    @JoinColumn({ name: 'candidatureId' })
    candidature?: Candidature;

    @Column({ type: 'uuid' })
    offreEmploiId!: string;

    @ManyToOne(() => OffreEmploi)
    @JoinColumn({ name: 'offreEmploiId' })
    offreEmploi?: OffreEmploi;

    @Column({ type: 'varchar', length: 30 })
    type!: TypeEntretien;

    @Column({ type: 'timestamp with time zone' })
    dateEntretien!: Date;

    @Column({ type: 'time', nullable: true })
    heureDebut?: string;

    @Column({ type: 'time', nullable: true })
    heureFin?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    lieu?: string;

    @Column({ type: 'text', nullable: true })
    lienVideoconference?: string;

    @Column({ type: 'text', nullable: true })
    grilleEvaluation?: string;

    @Column({ type: 'text', nullable: true })
    compteRendu?: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    note?: number;

    @Column({ type: 'text', nullable: true })
    pointsFort?: string;

    @Column({ type: 'text', nullable: true })
    pointsAmeliorer?: string;

    @Column({ type: 'text', nullable: true })
    decision?: string;

    @Column({ type: 'varchar', length: 30, default: StatutEntretien.PLANIFIE })
    statut!: StatutEntretien;

    @Column({ type: 'uuid', nullable: true })
    evaluateurId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'evaluateurId' })
    evaluateur?: MembrePersonnel;

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

// =====================================================
// ENTITY 4: Onboarding (Checklist d'intégration)
// =====================================================

@Entity('onboarding_recrutement')
@Index(['membrePersonnelId'])
@Index(['statut'])
@Index(['dateDebut'])
@Index(['dateFinPrevu'])
@Index(['tuteurId'])
@Index(['etablissementId'])
export class Onboarding {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'uuid' })
    offreEmploiId!: string;

    @ManyToOne(() => OffreEmploi)
    @JoinColumn({ name: 'offreEmploiId' })
    offreEmploi?: OffreEmploi;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date', nullable: true })
    dateFinReel?: Date;

    @Column({ type: 'date' })
    dateFinPrevu!: Date;

    @Column({ type: 'varchar', length: 30, default: StatutOnboarding.EN_COURS })
    statut!: StatutOnboarding;

    @Column({ type: 'text', nullable: true })
    checklist?: string; // JSON: [{tache, fait, date}]

    @Column({ type: 'uuid', nullable: true })
    tuteurId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'tuteurId' })
    tuteur?: MembrePersonnel;

    @Column({ type: 'text', nullable: true })
    formationInitiale?: string;

    @Column({ type: 'text', nullable: true })
    equipementFourni?: string;

    @Column({ type: 'text', nullable: true })
    accesSystemes?: string;

    @Column({ type: 'text', nullable: true })
    commentaires?: string;

    @Column({ type: 'int', default: 0 })
    progressionPourcentage!: number; // 0-100

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
