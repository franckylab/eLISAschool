/**
 * ==================================
 * eLISAschool - Entités du module Sondage
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
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Utilisateur } from '@modules/utilisateurs/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut d'un sondage
 */
export enum StatutSondage {
    BROUILLON = 'brouillon',
    ACTIF = 'actif',
    FERME = 'ferme',
    PROGRAMME = 'programme',
    EXPIRE = 'expire',
}

/**
 * Niveau d'accès aux analyses
 */
export enum NiveauAccesAnalyses {
    AUTEUR_SEUL = 'auteur_seul',
    TOUS_PARTICIPANTS = 'tous_participants',
    PERSONNALISE = 'personnalise',
}

/**
 * Visibilité d'un template
 */
export enum VisibiliteTemplate {
    PRIVE = 'prive',
    ETABLISSEMENT = 'etablissement',
    SYSTEME = 'systeme',
}

/**
 * TemplateSondage - Modèle réutilisable de sondage
 */
@Entity('templates_sondage')
@Index(['etablissementId'])
@Index(['createurId'])
@Index(['visibilite'])
export class TemplateSondage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 200 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text' })
    question!: string;

    @Column({ type: 'jsonb', nullable: true })
    options?: Array<{ texte: string; ordre?: number }>;

    @Column({ type: 'jsonb', nullable: true })
    parametres?: {
        estAnonyme?: boolean;
        choixMultiple?: boolean;
        dureeLimite?: string;
    };

    @Column({ type: 'varchar', length: 50, nullable: true })
    categorie?: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: VisibiliteTemplate.PRIVE,
    })
    visibilite!: VisibiliteTemplate;

    @Column({ type: 'varchar', length: 100, nullable: true })
    tags?: string;

    @Column({ type: 'boolean', default: false })
    estTemplateSysteme!: boolean;

    @Column({ type: 'int', default: 0 })
    utilisationCount!: number;

    // Relations
    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'createurId' })
    createur?: Utilisateur;

    @Column({ type: 'uuid', nullable: true })
    createurId?: string;

    @ManyToOne(() => Etablissement, { nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * Sondage - Un sondage envoyé aux utilisateurs
 */
@Entity('sondages')
@Index(['etablissementId'])
@Index(['auteurId'])
@Index(['statut'])
@Index(['dateProgrammation'])
export class Sondage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    question!: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: StatutSondage.ACTIF,
    })
    statut!: StatutSondage;

    @Column({ type: 'boolean', default: false })
    estAnonyme!: boolean;

    @Column({ type: 'boolean', default: false })
    choixMultiple!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    dateLimite?: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateProgrammation?: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateFermeture?: Date;

    @Column({ type: 'int', default: 0 })
    nombreDestinataires!: number;

    @Column({ type: 'int', default: 0 })
    nombreVotes!: number;

    @Column({
        type: 'varchar',
        length: 30,
        default: NiveauAccesAnalyses.AUTEUR_SEUL,
    })
    niveauAccesAnalyses!: NiveauAccesAnalyses;

    @Column({ type: 'uuid', array: true, nullable: true })
    utilisateursAutorisesAnalyses?: string[];

    @Column({ type: 'boolean', default: false })
    creerConversation!: boolean;

    @Column({ type: 'uuid', nullable: true })
    templateId?: string;

    @Column({ type: 'text', nullable: true })
    modeDestinataires?: string; // 'individuel' ou 'conversation_groupe'

    // Relations
    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'auteurId' })
    auteur?: Utilisateur;

    @Column({ type: 'uuid' })
    auteurId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @OneToMany(() => SondageOption, (option) => option.sondage, { cascade: true })
    options?: SondageOption[];

    @OneToMany(() => Vote, (vote) => vote.sondage)
    votes?: Vote[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * SondageOption - Options de réponse d'un sondage
 */
@Entity('sondage_options')
@Index(['sondageId'])
export class SondageOption {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    texte!: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'int', default: 0 })
    nombreVotes!: number;

    // Relations
    @ManyToOne(() => Sondage, (sondage) => sondage.options, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sondageId' })
    sondage!: Sondage;

    @Column({ type: 'uuid' })
    sondageId!: string;

    @CreateDateColumn()
    createdAt!: Date;
}

/**
 * Vote - Vote d'un utilisateur sur une option
 */
@Entity('sondage_votes')
@Index(['sondageId'])
@Index(['utilisateurId'])
@Index(['optionId'])
@Index(['sondageId', 'utilisateurId'], { unique: true })
export class Vote {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Relations
    @ManyToOne(() => Sondage, (sondage) => sondage.votes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sondageId' })
    sondage!: Sondage;

    @Column({ type: 'uuid' })
    sondageId!: string;

    @ManyToOne(() => SondageOption, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'optionId' })
    option!: SondageOption;

    @Column({ type: 'uuid' })
    optionId!: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    @Column({ type: 'uuid', nullable: true })
    utilisateurId?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
