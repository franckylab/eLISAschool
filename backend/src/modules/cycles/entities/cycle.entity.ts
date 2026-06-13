/**
 * ==================================
 * eLISAschool - Entités Cycles
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { TypeCycle } from '@modules/types-cycles/entities';
import { Niveau } from '@modules/niveaux/entities';

@Entity('cycles')
@Index(['typeCycleId'])
export class Cycle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // "Cycle Maternel", "Cycle Primaire", etc.

    @Column({ type: 'varchar', length: 50 })
    code!: string; // "CYCLE_MATERNEL", "CYCLE_PRIMAIRE", etc.

    @Column({ type: 'uuid', nullable: true })
    typeCycleId!: string;

    @ManyToOne(() => TypeCycle, (typeCycle) => typeCycle.cycles)
    @JoinColumn({ name: 'typeCycleId' })
    typeCycle?: TypeCycle;

    @OneToMany(() => Niveau, (niveau) => niveau.cycle)
    niveaux?: Niveau[];

    @Column({ type: 'int', default: 1 })
    ordre!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
