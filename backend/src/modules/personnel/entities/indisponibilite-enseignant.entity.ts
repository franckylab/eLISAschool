/**
 * ==================================
 * eLISAschool - Entité Indisponibilité Enseignant
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gère les indisponibilités des enseignants :
 * - Congés (maladie, maternité, formation)
 * - Absences ponctuelles
 * - Créneaux non disponibles (récurrents ou ponctuels)
 * Utilisé par le service de validation de l'emploi du temps
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
import { MembrePersonnel } from '@modules/personnel/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Type d'indisponibilité
 */
export enum TypeIndisponibilite {
    CONGE_MALADIE = 'CONGE_MALADIE',
    CONGE_MATERNITE = 'CONGE_MATERNITE',
    CONGE_ANNUEL = 'CONGE_ANNUEL',
    FORMATION = 'FORMATION',
    MISSION = 'MISSION',
    ABSENCE_PONCTUELLE = 'ABSENCE_PONCTUELLE',
    INDISPONIBILITE_RECURRENT = 'INDISPONIBILITE_RECURRENT', // Ex: Pas disponible le lundi matin
    AUTRE = 'AUTRE',
}

/**
 * Fréquence pour les indisponibilités récurrentes
 */
export enum FrequenceRecurrence {
    AUCUNE = 'AUCUNE',
    HEBDOMADAIRE = 'HEBDOMADAIRE',
    MENSUELLE = 'MENSUELLE',
}

@Entity('indisponibilites_enseignants')
@Index(['enseignantId'])
@Index(['etablissementId'])
@Index(['dateDebut', 'dateFin'])
@Index(['typeIndisponibilite'])
@Index(['enseignantId', 'dateDebut', 'dateFin']) // Pour détection de conflits
export class IndisponibiliteEnseignant {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    enseignantId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'enseignantId' })
    enseignant?: MembrePersonnel;

    @Column({ type: 'varchar', length: 50, default: TypeIndisponibilite.AUTRE })
    typeIndisponibilite!: TypeIndisponibilite;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date' })
    dateFin!: Date;

    @Column({ type: 'time', nullable: true })
    heureDebut?: string; // Pour indisponibilité partielle (ex: 08:00-10:00)

    @Column({ type: 'time', nullable: true })
    heureFin?: string;

    @Column({ type: 'varchar', length: 50, default: FrequenceRecurrence.AUCUNE })
    frequenceRecurrence!: FrequenceRecurrence;

    @Column({ type: 'simple-json', nullable: true })
    joursRecurrence?: string[]; // ['LUNDI', 'MARDI'] pour récurrent hebdomadaire

    @Column({ type: 'text', nullable: true })
    motif!: string;

    @Column({ type: 'boolean', default: true })
    estValidée!: boolean; // Validée par l'administration

    @Column({ type: 'uuid', nullable: true })
    valideePar?: string;

    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    /**
     * Établissement de l'indisponibilité (multi-tenancy)
     */
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
