/**
 * ==================================
 * eLISAschool - Entités Niveaux
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
    Index,
} from 'typeorm';
import { Cycle } from '@modules/cycles/entities';
import { ExamenNational } from '@modules/examens-nationaux/entities';
import { SousSysteme } from '@modules/etablissement/entities';

@Entity('niveaux')
@Index(['cycleId'])
export class Niveau {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // ex: 6ème, CP, Lower 6th

    @Column({ type: 'varchar', length: 50, nullable: true })
    code!: string; // ex: 6E, CP

    @Column({ type: 'uuid' })
    cycleId!: string;

    @ManyToOne(() => Cycle)
    @JoinColumn({ name: 'cycleId' })
    cycle?: Cycle;

    @Column({ type: 'uuid', nullable: true })
    examenNationalId?: string;

    @ManyToOne(() => ExamenNational, { nullable: true })
    @JoinColumn({ name: 'examenNationalId' })
    examenNational?: ExamenNational;

    @Column({ type: 'boolean', default: false })
    estClasseExamen!: boolean; // true pour CM2, 3ème, Terminale, etc.

    @Column({ type: 'enum', enum: SousSysteme, default: SousSysteme.FRANCOPHONE })
    sousSysteme!: SousSysteme;

    @Column({ type: 'int', default: 1 })
    ordre!: number; // Ordre dans le cycle

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
