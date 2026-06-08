/**
 * ==================================
 * eLISAschool - Entité TypePrime
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
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
import { Etablissement } from '@modules/etablissement/entities';

export enum TypePrimeCalcul {
    FIXE = 'FIXE',
    POURCENTAGE = 'POURCENTAGE',
    VARIABLE = 'VARIABLE',
}

@Entity('types_primes')
@Index(['code'], { unique: true })
@Index(['etablissementId'])
export class TypePrime {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 30, unique: true })
    code!: string; // ANCIENNETE, RENDEMENT, TRANSPORT, LOGEMENT

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 20 })
    typeCalcul!: TypePrimeCalcul;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    valeur!: number;

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
