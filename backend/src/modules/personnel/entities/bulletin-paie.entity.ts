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
import { Poste } from '@modules/organisation/entities';
import { ContratPersonnel } from './contrat-personnel.entity';
import { Etablissement } from '@modules/etablissement/entities';
import { MembrePersonnel } from './personnel.entity';

export enum StatutBulletinPaie {
    GENERE = 'GENERE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    VALIDE = 'VALIDE',
    PAYE = 'PAYE',
    ANNULE = 'ANNULE',
}

@Entity('bulletins_paie')
@Index(['membrePersonnelId'])
@Index(['mois'])
@Index(['annee'])
@Index(['statut'])
@Index(['etablissementId'])
@Index(['membrePersonnelId', 'annee', 'mois'], { unique: true }) // Unique: 1 bulletin/mois/personne
@Index(['etablissementId', 'annee', 'mois']) // Composite pour rapports périodiques
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

    @ManyToOne(() => ContratPersonnel)
    @JoinColumn({ name: 'contratId' })
    contrat?: ContratPersonnel;

    @Column({ type: 'uuid', nullable: true })
    posteId?: string;

    @ManyToOne(() => Poste, { nullable: true })
    @JoinColumn({ name: 'posteId' })
    poste?: Poste;

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

    @Column({ type: 'varchar', length: 30, default: StatutBulletinPaie.GENERE })
    statut!: StatutBulletinPaie; // GENERE, EN_ATTENTE_VALIDATION, VALIDE, PAYE, ANNULE

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
