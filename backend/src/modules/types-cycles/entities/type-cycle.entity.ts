/**
 * ==================================
 * eLISAschool - Entité TypeCycle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente les grands types d'enseignement (Maternelle, Primaire, Secondaire)
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Cycle } from '@modules/cycles/entities';

@Entity('types_cycles')
export class TypeCycle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    nom!: string; // "Enseignement Maternel", "Enseignement Primaire", etc.

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // "MATERNELLE", "PRIMAIRE", "SECONDAIRE_1", "SECONDAIRE_2"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0, name: 'dureeannees' })
    dureeAnnees!: number; // Durée en années (3, 6, 4, 3)

    @Column({ type: 'int', default: 1 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'varchar', length: 50, unique: true, name: 'diplomesanctionnant' })
    diplomeSanctionnant?: string; // "CEP", "BEPC", "BACCALAUREAT"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @OneToMany(() => Cycle, (cycle) => cycle.typeCycle)
    cycles?: Cycle[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
