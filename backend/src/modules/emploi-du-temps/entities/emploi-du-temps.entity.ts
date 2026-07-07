/**
 * ==================================
 * eLISAschool - Entité EmploiDuTemps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Séance d'emploi du temps (créneau horaire)
 * Généré automatiquement ou créé manuellement
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
import { ClasseAnnee } from '@modules/classes/entities';
import { Matiere } from '@modules/matieres/entities';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Salle } from '@modules/salles/entities';
import { AffectationMatiere } from '@modules/matieres/entities';
import { Periode } from '@modules/periodes/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Jours de la semaine
 */
export enum JourSemaine {
    LUNDI = 'LUNDI',
    MARDI = 'MARDI',
    MERCREDI = 'MERCREDI',
    JEUDI = 'JEUDI',
    VENDREDI = 'VENDREDI',
    SAMEDI = 'SAMEDI',
}

/**
 * Type de créneau
 */
export enum TypeCreneau {
    COURS = 'COURS',
    TD = 'TD',
    TP = 'TP',
    ETUDE = 'ETUDE',
    RECREATION = 'RECREATION',
}

@Entity('emploi_du_temps')
@Index(['classeAnneeId'])
@Index(['matiereId'])
@Index(['enseignantId'])
@Index(['salleId'])
@Index(['affectationMatiereId'])
@Index(['jour', 'heureDebut'])
@Index(['classeAnneeId', 'jour', 'heureDebut', 'heureFin'], { unique: true })
export class EmploiDuTemps {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    classeAnneeId!: string;

    @ManyToOne(() => ClasseAnnee)
    @JoinColumn({ name: 'classeAnneeId' })
    classeAnnee!: ClasseAnnee;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere!: Matiere;

    @Column({ type: 'uuid', nullable: true })
    affectationMatiereId?: string;

    @ManyToOne(() => AffectationMatiere, { nullable: true })
    @JoinColumn({ name: 'affectationMatiereId' })
    affectationMatiere?: AffectationMatiere;

    @Column({ type: 'uuid' })
    enseignantId!: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'enseignantId' })
    enseignant!: MembrePersonnel;

    @Column({ type: 'uuid', nullable: true })
    salleId?: string;

    @ManyToOne(() => Salle, { nullable: true })
    @JoinColumn({ name: 'salleId' })
    salle?: Salle;

    @Column({ type: 'varchar', length: 20, enum: JourSemaine })
    jour!: JourSemaine;

    @Column({ type: 'time' })
    heureDebut!: string;

    @Column({ type: 'time' })
    heureFin!: string;

    @Column({ type: 'varchar', length: 20, enum: TypeCreneau, default: TypeCreneau.COURS })
    typeCreneau!: TypeCreneau;

    /**
     * Période de validité du créneau
     */
    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    /**
     * Année scolaire concernée
     */
    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    /**
     * Établissement (multi-tenant)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    /**
     * Couleur pour affichage (optionnel)
     */
    @Column({ type: 'varchar', length: 7, nullable: true })
    couleur?: string;

    /**
     * Indique si ce créneau est actif
     */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Indique si ce créneau a été généré automatiquement
     */
    @Column({ type: 'boolean', default: false })
    genereAutomatiquement!: boolean;

    /**
     * Notes internes pour l'organisation
     */
    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    /**
     * Calcule la durée du créneau en minutes
     */
    get dureeMinutes(): number {
        const [h1, m1] = this.heureDebut.split(':').map(Number);
        const [h2, m2] = this.heureFin.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    }

    /**
     * Calcule la durée du créneau en heures
     */
    get dureeHeures(): number {
        return this.dureeMinutes / 60;
    }

    /**
     * Format lisible du créneau
     */
    get plageHoraire(): string {
        return `${this.heureDebut} - ${this.heureFin}`;
    }
}
