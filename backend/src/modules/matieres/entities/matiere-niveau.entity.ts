/**
 * ==================================
 * eLISAschool - Entités Matière-Niveau (Programme)
 * ==================================
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
 * Statut du programme matière-niveau (support workflow de validation)
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
@Index(['matiereId', 'niveauId', 'filiereId', 'periodeId'], { unique: true }) // Unicité par matière+niveau+filière+période
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

    // Système Francophone
    @Column({ type: 'float', default: 1 })
    coefficient!: number;

    // Système Anglophone (ou LMD)
    @Column({ type: 'float', nullable: true })
    credits?: number; // Correspond aux "Credits" du système anglophone

    @Column({ type: 'int', default: 20 })
    bareme!: number; // Sur 20 ou Sur 100...

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
