/**
 * ==================================
 * eLISAschool - Entité Competence
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente les compétences dans l'Approche Par Compétences (APC)
 * Conformément aux programmes officiels du MINESEC
 * 
 * Changements v2.0:
 * - Ajout etablissementId pour support multi-tenant
 * - Chaque établissement peut avoir ses propres compétences
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
import { Etablissement } from '@modules/etablissement/entities';

@Entity('competences')
@Index(['niveauId'])
@Index(['matiereId'])
@Index(['etablissementId'])
@Index(['niveauId', 'matiereId', 'etablissementId'], { unique: true }) // Index composite unique multi-tenant
export class Competence {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50 })
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

    /**
     * Relation multi-tenant : chaque compétence appartient à un établissement.
     * Permet à chaque établissement d'adapter ses compétences APC.
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'int', default: 1 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
