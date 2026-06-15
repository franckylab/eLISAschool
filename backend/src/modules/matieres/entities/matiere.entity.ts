/**
 * ==================================
 * eLISAschool - Entités Matières
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Changements v2.0:
 * - Ajout etablissementId pour support multi-tenant
 * - Chaque établissement choisit ses matières actives
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
import { Etablissement, SousSysteme } from '@modules/etablissement/entities';

@Entity('groupes_matieres')
export class GroupeMatiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // Scientifique, Littéraire, Groupe 1...

    @Column({ type: 'int', default: 1 })
    ordre!: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;
}

@Entity('matieres')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'])
export class Matiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    code!: string; // MATH, ENG...

    @Column({ type: 'varchar', length: 100, nullable: true })
    nomAnglais?: string;

    @Column({ type: 'varchar', length: 20, default: '#000000' })
    couleur!: string;

    /**
     * Relation multi-tenant : chaque matière appartient à un établissement.
     * Permet à chaque établissement d'avoir sa propre grille de matières.
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    /**
     * Sous-système éducatif pour les établissements biculturels.
     * NULL = matière commune aux deux systèmes (ex: Mathématiques, Sciences)
     * FRANCOPHONE = matière spécifique au système francophone (ex: Français)
     * ANGLOPHONE = matière spécifique au système anglophone (ex: English Language)
     */
    @Column({ type: 'enum', enum: SousSysteme, nullable: true })
    sousSysteme?: SousSysteme;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
