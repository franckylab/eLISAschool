/**
 * ==================================
 * eLISAschool - Entité Specialite
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente les spécialités/options au sein des filières techniques
 * (ex: F1 Mécanique option Maintenance Automobile, F2 Électrotechnique option Électronique)
 * 
 * Changements v2.0:
 * - Ajout etablissementId pour support multi-tenant
 * - Chaque établissement choisit ses spécialités par filière
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
import { Filiere } from '@modules/filieres/entities';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('specialites')
@Index(['filiereId'])
@Index(['etablissementId'])
@Index(['filiereId', 'etablissementId']) // Index composite multi-tenant
export class Specialite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // "Maintenance Automobile", "Électrotechnique Industrielle"

    @Column({ type: 'varchar', length: 50 })
    code!: string; // "MA", "EI", "GENIE_CIVIL_BAT"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid' })
    filiereId!: string;

    @ManyToOne(() => Filiere)
    @JoinColumn({ name: 'filiereId' })
    filiere?: Filiere;

    /**
     * Relation multi-tenant : chaque spécialité appartient à un établissement.
     * Permet à chaque établissement d'offrir des spécialités différentes.
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
