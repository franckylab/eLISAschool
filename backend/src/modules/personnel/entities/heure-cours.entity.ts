/**
 * ==================================
 * eLISAschool - Entité Heure de Cours
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { MembrePersonnel } from './personnel.entity';
import { Classe, ClasseAnnee } from '@modules/classes/entities';
import { Matiere } from '@modules/matieres/entities';
import { Periode } from '@modules/periodes/entities';
import { Salle } from '@modules/salles/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { AffectationMatiere } from '@modules/matieres/entities';
import { CreneauHoraire, TypeCreneau } from '@modules/emploi-du-temps/entities';

/**
 * Statut d'exécution du cours
 */
export enum StatutEffectue {
    PLANIFIE = 'PLANIFIE',
    EFFECTUE = 'EFFECTUE',
    ANNULE = 'ANNULE',
    REMPLACE = 'REMPLACE',
}

@Entity('heures_cours')
@Index(['enseignantId'])
@Index(['classeAnneeId'])
@Index(['date'])
@Index(['periodeId'])
@Index(['salleId'])
@Index(['etablissementId'])
@Index(['enseignantId', 'date', 'heureDebut']) // Index composite pour détection conflits
@Index(['classeAnneeId', 'date', 'heureDebut']) // Conflits de classe
@Index(['salleId', 'date', 'heureDebut']) // Conflits de salle
export class HeureCours {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    enseignantId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'enseignantId' })
    enseignant?: MembrePersonnel;

    @Column({ type: 'uuid' })
    classeAnneeId!: string;

    @ManyToOne(() => ClasseAnnee)
    @JoinColumn({ name: 'classeAnneeId' })
    classeAnnee?: ClasseAnnee;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    @Column({ type: 'uuid', nullable: true })
    salleId?: string;

    @ManyToOne(() => Salle, { nullable: true })
    @JoinColumn({ name: 'salleId' })
    salle?: Salle;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'time' })
    heureDebut!: string;

    @Column({ type: 'time' })
    heureFin!: string;

    @Column({ type: 'varchar', length: 20, default: StatutEffectue.PLANIFIE })
    statutEffectue!: StatutEffectue;

    /**
     * Type de créneau (COURS, TP, TD, etc.) — copié depuis le CreneauHoraire
     * lors de la génération. Permet de distinguer la nature du cours concret.
     */
    @Column({ type: 'varchar', length: 20, default: TypeCreneau.COURS })
    typeCreneau!: TypeCreneau;

    @Column({ type: 'text', nullable: true })
    commentaire?: string; // Observations, remplacement, annulation

    @Column({ type: 'uuid', nullable: true })
    remplacantId?: string | null;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'remplacantId' })
    remplacant?: MembrePersonnel;

    /**
     * Établissement du cours (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'uuid', nullable: true })
    affectationMatiereId?: string;

    @ManyToOne(() => AffectationMatiere, { nullable: true })
    @JoinColumn({ name: 'affectationMatiereId' })
    affectationMatiere?: AffectationMatiere;

    @Column({ type: 'uuid', nullable: true })
    creneauId?: string;

    @ManyToOne(() => CreneauHoraire, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'creneauId' })
    creneau?: CreneauHoraire;

    @CreateDateColumn()
    createdAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
