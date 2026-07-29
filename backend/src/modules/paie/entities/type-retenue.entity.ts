/**
 * ==================================
 * eLISAschool - Entité TypeRetenue
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';
import { numericTransformer } from '@common/utils/numeric-transformer.util';
import { Etablissement } from '@modules/etablissement/entities';

export enum TypeRetenueFrequence {
    PONCTUELLE = 'PONCTUELLE',
    RECURRENTE = 'RECURRENTE',
}

@Entity('types_retenues')
@Index(['code', 'etablissementId'], { unique: true })
@Index(['etablissementId'])
export class TypeRetenue {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 30 })
    code!: string; // AVANCE, PRET, SANCTION

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 20 })
    frequence!: TypeRetenueFrequence;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: numericTransformer })
    montantMax?: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
