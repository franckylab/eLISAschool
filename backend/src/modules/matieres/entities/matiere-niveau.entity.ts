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
