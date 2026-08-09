/**
 * ==================================
 * eLISAschool - Entité TrancheGroupe
 * ==================================
 * 
 * Override des tranches de pricing par groupe d'établissements.
 * Cascade : tranche_supplement (étab) → tranche_groupe → tranche_eleves (plan).
 * 
 * Lot C v7 — Refonte SaaS
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { GroupeEtablissement } from '@modules/groupes-etablissements/entities';

@Entity('tranches_groupe')
@Index(['groupeEtablissementId'])
@Index(['groupeEtablissementId', 'ordre'], { unique: true })
export class TrancheGroupe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    groupeEtablissementId!: string;

    @ManyToOne(() => GroupeEtablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupeEtablissementId' })
    groupe!: GroupeEtablissement;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'int' })
    minEleves!: number;

    @Column({ type: 'int', nullable: true })
    maxEleves!: number | null;

    @Column({ type: 'int' })
    montantSupplementaire!: number;

    @Column({ type: 'varchar', length: 200, nullable: true })
    label?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'uuid', nullable: true })
    trancheOriginaleId?: string;

    @CreateDateColumn()
    creeAt!: Date;

    @UpdateDateColumn()
    majAt!: Date;
}
