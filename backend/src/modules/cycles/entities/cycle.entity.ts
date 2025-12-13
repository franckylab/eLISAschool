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
} from 'typeorm';
import { CycleScolaire } from '@modules/etablissement/entities';

@Entity('cycles')
export class Cycle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'enum', enum: CycleScolaire })
    code!: CycleScolaire;

    @Column({ type: 'int', default: 1 })
    ordre!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
