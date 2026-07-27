/**
 * ==================================
 * eLISAschool - Entité ElementSalaire
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composants détaillés du bulletin de paie
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
import { BulletinPaie } from './bulletin-paie.entity';
import { Etablissement } from '@modules/etablissement/entities';

export enum TypeElementSalaire {
    GAIN = 'GAIN',
    RETENUE = 'RETENUE',
}

export enum CategorieElementSalaire {
    SALAIRE_BASE = 'SALAIRE_BASE',
    PRIME = 'PRIME',
    INDEMNITE = 'INDEMNITE',
    COTISATION = 'COTISATION',
    HEURE_SUP = 'HEURE_SUP',
    HEURE_COURS = 'HEURE_COURS',
    RETENUE = 'RETENUE',
    AUTRE = 'AUTRE',
}

@Entity('elements_salaire')
@Index(['bulletinPaieId'])
@Index(['type'])
@Index(['categorie'])
export class ElementSalaire {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    bulletinPaieId!: string;

    @ManyToOne(() => BulletinPaie, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bulletinPaieId' })
    bulletinPaie?: BulletinPaie;

    @Column({ type: 'varchar', length: 20 })
    type!: TypeElementSalaire;

    @Column({ type: 'varchar', length: 50 })
    categorie!: CategorieElementSalaire;

    @Column({ type: 'varchar', length: 200 })
    libelle!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, transformer: numericTransformer })
    montant!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: numericTransformer })
    baseCalcul?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, transformer: numericTransformer })
    taux?: number;

    @Column({ type: 'int', default: 0 })
    ordreAffichage!: number;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
