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
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { MembrePersonnel } from './personnel.entity';
import { Classe } from '@modules/classes/entities';
import { Matiere } from '@modules/matieres/entities';
import { Periode } from '@modules/periodes/entities';
import { Salle } from '@modules/salles/entities';
import { Etablissement } from '@modules/etablissement/entities';

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
@Index(['classeId'])
@Index(['date'])
@Index(['periodeId'])
@Index(['salleId'])
@Index(['etablissementId'])
@Index(['enseignantId', 'date', 'heureDebut']) // Index composite pour détection conflits
@Index(['classeId', 'date', 'heureDebut']) // Conflits de classe
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
    classeId!: string;

    @ManyToOne(() => Classe)
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'uuid' })
    periodeId!: string;

    @ManyToOne(() => Periode)
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

    @Column({ type: 'varchar', length: 30, default: StatutEffectue.PLANIFIE })
    statutEffectue!: StatutEffectue;

    @Column({ type: 'varchar', length: 100, nullable: true })
    salleObsolète?: string | null; // @deprecated Utiliser salleId à la place

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

    @CreateDateColumn()
    createdAt!: Date;
}
