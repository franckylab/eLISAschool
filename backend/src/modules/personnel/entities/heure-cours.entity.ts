/**
 * ==================================
 * eLISAschool - Entité Heure de Cours
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
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
@Index(['etablissementId'])
@Index(['enseignantId', 'date', 'heureDebut']) // Index composite pour détection conflits
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

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @ManyToOne(() => Periode)
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'time' })
    heureDebut!: string;

    @Column({ type: 'time' })
    heureFin!: string;

    @Column({ type: 'varchar', length: 30, default: StatutEffectue.PLANIFIE })
    statutEffectue!: StatutEffectue;

    @Column({ type: 'varchar', length: 100, nullable: true })
    salle?: string | null;

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
