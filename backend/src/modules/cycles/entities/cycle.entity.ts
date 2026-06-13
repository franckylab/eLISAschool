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
    Index,
} from 'typeorm';
import { Niveau } from '@modules/niveaux/entities';

@Entity('cycles')
export class Cycle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    nom!: string; // "Enseignement Maternel", "Enseignement Primaire", etc.

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // "MATERNELLE", "PRIMAIRE", "COLLEGE", "LYCEE"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'int', default: 0, name: 'dureeannees' })
    dureeAnnees!: number; // Durée en années (3, 6, 4, 3)

    @Column({ type: 'varchar', length: 50, nullable: true, name: 'diplomesanctionnant' })
    diplomeSanctionnant?: string; // "CEP", "BEPC", "BACCALAUREAT"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @OneToMany(() => Niveau, (niveau) => niveau.cycle)
    niveaux?: Niveau[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
