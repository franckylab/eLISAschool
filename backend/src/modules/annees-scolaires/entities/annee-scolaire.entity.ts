/**
 * ==================================
 * eLISAschool - Entités Années Scolaires
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('annees_scolaires')
export class AnneeScolaire {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    libelle!: string; // ex: 2024-2025

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date' })
    dateFin!: Date;

    @Column({ type: 'boolean', default: false })
    enCours!: boolean;

    @Column({ type: 'boolean', default: false })
    cloturee!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
