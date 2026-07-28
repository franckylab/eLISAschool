/**
 * ==================================
 * eLISAschool - Grille Matière par Niveau (curriculum)
 * ==================================
 *
 * RÔLE : Définit la grille curriculaire — quelles matières sont enseignées
 * à quel niveau. Chaque entrée MatiereNiveau peut être rattachée à un
 * ProgrammePedagogique via ProgrammeMatiere (relation 1:1 en pratique).
 *
 * Les champs coefficient/volumeHoraire/obligatoire servent de FALLBACK
 * quand ProgrammeMatiere ne définit pas de valeur. La chaîne de résolution:
 *   ProgrammeMatiere (primaire)
 *       → MatiereNiveau (fallback)
 *           → ConfigurationMatiereClasse (override par classe)
 *
 * Plusieurs MatiereNiveau peuvent exister pour le même (matiereId, niveauId)
 * afin de permettre des programmes différents (ex: Scientifique, Littéraire).
 * Chacun est lié à un unique programme via la contrainte d'unicité sur
 * ProgrammeMatiere.matiereNiveauId.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { Matiere, GroupeMatiere } from './matiere.entity';
import { Niveau } from '@modules/niveaux/entities';
import { Filiere } from '@modules/filieres/entities';
import { Periode } from '@modules/periodes/entities';

/**
 * Statut de la grille matière-niveau (support workflow de validation)
 */
export enum StatutMatiereNiveau {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIF = 'INACTIF',
}

@Entity('matieres_niveaux')
@Index(['niveauId'])
@Index(['matiereId'])
@Index(['filiereId'])
@Index(['niveauId', 'filiereId']) // Index composite pour filtrage par filière
@Index('idx_matieres_niveaux_matiere_niveau_filiere_periode', ['matiereId', 'niveauId', 'filiereId', 'periodeId']) // Non-unique
export class MatiereNiveau {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'uuid' })
    niveauId!: string;

    @ManyToOne(() => Niveau)
    @JoinColumn({ name: 'niveauId' })
    niveau?: Niveau;

    @Column({ type: 'uuid', nullable: true })
    groupeId?: string;

    @ManyToOne(() => GroupeMatiere)
    @JoinColumn({ name: 'groupeId' })
    groupe?: GroupeMatiere;

    /**
     * Filière optionnelle : si NULL, la matière s'applique à toutes les filières du niveau.
     * Si défini, la matière est spécifique à cette filière.
     * Ex: Physique avancée uniquement en Série C
     */
    @Column({ type: 'uuid', nullable: true })
    filiereId?: string;

    @ManyToOne(() => Filiere, { nullable: true })
    @JoinColumn({ name: 'filiereId' })
    filiere?: Filiere;

    /**
     * Période de validité de ce programme matière-niveau
     */
    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    /**
     * Dates de validité (auto-peuplées depuis l'année scolaire si periodeId défini)
     */
    @Column({ type: 'date', nullable: true })
    dateDebut?: string;

    @Column({ type: 'date', nullable: true })
    dateFin?: string;

    @Column({ type: 'float', default: 1 })
    coefficient!: number;

    @Column({ type: 'int', default: 20 })
    bareme!: number;

    /**
     * Volume horaire hebdomadaire en **minutes/semaine** (source unique de vérité — refonte EDT v4.0).
     * Exemple : 240 = 4h/semaine. Utilisé par ConflitDetectionService (dépassement volume)
     * et EmploiDuTempsService.genererEmploiDuTemps (nombre de créneaux à placer).
     * Toujours comparer en minutes, jamais convertir en heures avant comparaison.
     */
    @Column({ type: 'int', nullable: true })
    volumeHoraire?: number;

    @Column({ type: 'boolean', default: true })
    obligatoire!: boolean;

    /**
     * Statut du programme (support workflow de validation)
     */
    @Column({ type: 'varchar', length: 30, default: StatutMatiereNiveau.ACTIF })
    statut!: StatutMatiereNiveau;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
