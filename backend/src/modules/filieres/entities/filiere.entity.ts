/**
 * ==================================
 * eLISAschool - Entité Filière
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente les filières/spécialités du 2nd cycle du secondaire
 * (Scientifique, Littéraire, Technique, etc.)
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
import { Cycle } from '@modules/cycles/entities';
import { SousSysteme } from '@modules/etablissement/entities';

@Entity('filieres')
@Index(['cycleId'])
export class Filiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // "Série C - Mathématiques et Physique", "Sciences", etc.

    @Column({ type: 'varchar', length: 50 })
    code!: string; // "C", "D", "E", "A", "SCIENCES", "LETTRES"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid' })
    cycleId!: string;

    @ManyToOne(() => Cycle)
    @JoinColumn({ name: 'cycleId' })
    cycle?: Cycle;

    @Column({ type: 'enum', enum: SousSysteme, default: SousSysteme.FRANCOPHONE, name: 'soussysteme' })
    sousSysteme!: SousSysteme;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
