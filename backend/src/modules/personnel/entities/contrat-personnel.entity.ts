/**
 * ==================================
 * eLISAschool - Entité Contrat Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
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
import { MembrePersonnel } from './personnel.entity';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Type de contrat de travail
 */
export enum TypeContrat {
    CDD = 'CDD',
    CDI = 'CDI',
    VACATAIRE = 'VACATAIRE',
    STAGIAIRE = 'STAGIAIRE',
}

/**
 * Statut du contrat
 */
export enum StatutContrat {
    ACTIF = 'ACTIF',
    EXPIRE = 'EXPIRE',
    RENEGOCIE = 'RENEGOCIE',
    ROMPU = 'ROMPU',
}

@Entity('contrats_personnel')
@Index(['membrePersonnelId'])
@Index(['etablissementId'])
@Index(['statut'])
@Index(['typeContrat'])
export class ContratPersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    membrePersonnelId!: string;

    @ManyToOne(() => MembrePersonnel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'membrePersonnelId' })
    membrePersonnel?: MembrePersonnel;

    @Column({ type: 'varchar', length: 30 })
    typeContrat!: TypeContrat;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date', nullable: true })
    dateFin?: Date | null;

    @Column({ type: 'decimal', precision: 12, scale: 0 })
    salaireBase!: number;

    @Column({ type: 'decimal', precision: 10, scale: 0, nullable: true })
    tarifHoraire?: number | null;

    @Column({ type: 'varchar', length: 30, default: StatutContrat.ACTIF })
    statut!: StatutContrat;

    @Column({ type: 'boolean', default: false })
    renouvellementAuto!: boolean;

    @Column({ type: 'text', nullable: true })
    clauses?: string | null;

    /**
     * Établissement du contrat (multi-tenancy)
     */
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
