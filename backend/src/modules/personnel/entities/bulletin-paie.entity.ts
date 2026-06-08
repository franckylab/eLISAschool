/**
 * eLISAschool - Module Personnel/RH
 * Entité Bulletin de Paie
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
import { MembrePersonnel } from './personnel.entity';

@Entity('bulletins_paie')
@Index(['membrePersonnelId'])
@Index(['mois'])
@Index(['annee'])
@Index(['statut'])
export class BulletinPaie {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'uuid' })
    contratId!: string;

    @Column({ type: 'int' })
    mois!: number; // 1-12

    @Column({ type: 'int' })
    annee!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    salaireBase!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    heuresEffectuees!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    montantHeuresSup!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    primes!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    deductions!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    salaireNet!: number;

    @Column({ type: 'varchar', length: 20, default: 'GENERE' })
    statut!: string; // GENERE, VALIDE, PAYE

    @Column({ type: 'date', nullable: true })
    datePaiement?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

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
