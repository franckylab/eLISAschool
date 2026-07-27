/**
 * ==================================
 * eLISAschool - Entité Cotisation
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Cotisations sociales (CNPS, AMO, IRPP, etc.)
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { numericTransformer } from '@common/utils/numeric-transformer.util';
import { Etablissement } from '@modules/etablissement/entities';

export enum TypeCotisation {
    PATRONALE = 'PATRONALE',
    SALARIALE = 'SALARIALE',
    MIXTE = 'MIXTE',
}

@Entity('cotisations')
@Index(['code', 'etablissementId'], { unique: true })
@Index(['etablissementId'])
@Index(['actif'])
export class Cotisation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 20 })
    code!: string; // CNPS, AMO, IRPP, etc.

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 20 })
    type!: TypeCotisation;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
    tauxPatronal!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
    tauxSalarial!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: numericTransformer })
    plafond?: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
