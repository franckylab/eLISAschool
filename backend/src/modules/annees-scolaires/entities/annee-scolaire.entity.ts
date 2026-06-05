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
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('annees_scolaires')
@Index(['etablissementId'])
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

    /**
     * Établissement de l'année scolaire (multi-tenancy)
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @ManyToOne(() => Etablissement, { nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
