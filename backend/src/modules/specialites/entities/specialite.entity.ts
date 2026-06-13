/**
 * ==================================
 * eLISAschool - Entité Specialite
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente les spécialités/options au sein des filières techniques
 * (ex: F1 Mécanique option Maintenance Automobile, F2 Électrotechnique option Électronique)
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

@Entity('specialites')
@Index(['filiereId'])
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

    @Column({ type: 'int', default: 1 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
