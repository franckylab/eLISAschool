/**
 * ==================================
 * eLISAschool - Entité Competence
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente les compétences dans l'Approche Par Compétences (APC)
 * Conformément aux programmes officiels du MINESEC
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
import { Niveau } from '@modules/niveaux/entities';
import { Matiere } from '@modules/matieres/entities';

@Entity('competences')
@Index(['niveauId'])
@Index(['matiereId'])
@Index(['niveauId', 'matiereId'])
export class Competence {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // "COMP_MATH_01", "COMP_SCI_02"

    @Column({ type: 'varchar', length: 200 })
    libelle!: string; // "Résoudre une équation du second degré"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 100 })
    domaine!: string; // "Mathématiques", "Sciences", "Langues", "Histoire-Géo"

    @Column({ type: 'uuid' })
    niveauId!: string;

    @ManyToOne(() => Niveau)
    @JoinColumn({ name: 'niveauId' })
    niveau?: Niveau;

    @Column({ type: 'uuid', nullable: true })
    matiereId?: string;

    @ManyToOne(() => Matiere, { nullable: true })
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'int', default: 1 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
