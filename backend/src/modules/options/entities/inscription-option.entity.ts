/**
 * ==================================
 * eLISAschool - Entité Inscription Option
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gère les matières optionnelles choisies par les élèves
 * (Latin, Arts, LV3, Musique, etc.)
 * Particulièrement utile en Lycée (Première, Terminale)
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
import { Eleve } from '@modules/eleves/entities';
import { Matiere } from '@modules/matieres/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut de l'inscription à une option
 */
export enum StatutOption {
    ACTIVE = 'ACTIVE',
    ABANDONNEE = 'ABANDONNEE',
    EN_ATTENTE = 'EN_ATTENTE',
}

@Entity('inscriptions_options')
@Index(['eleveId'])
@Index(['matiereId'])
@Index(['anneeScolaireId'])
@Index(['etablissementId'])
@Index(['eleveId', 'anneeScolaireId', 'statut']) // Historique des options
export class InscriptionOption {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    @Column({ type: 'date' })
    dateInscription!: Date;

    @Column({ type: 'date', nullable: true })
    dateAbandon?: Date;

    @Column({ type: 'text', nullable: true })
    motifAbandon?: string;

    @Column({ type: 'varchar', length: 30, default: StatutOption.ACTIVE })
    statut!: StatutOption;

    @Column({ type: 'float', default: 1 })
    coefficient!: number; // Coefficient de l'option dans la moyenne

    @Column({ type: 'boolean', default: false })
    estValidée!: boolean; // Option validée par l'administration

    /**
     * Établissement de l'inscription (multi-tenancy)
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
