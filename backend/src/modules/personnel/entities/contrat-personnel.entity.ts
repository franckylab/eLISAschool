/**
 * ==================================
 * eLISAschool - Entité Contrat Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
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
import { numericTransformer } from '@common/utils/numeric-transformer.util';
import { MembrePersonnel } from './personnel.entity';
import { Etablissement } from '@modules/etablissement/entities';
import { TypeContratPersonnalise } from './type-contrat.entity';
import { UniteOrganisationnelle, Poste, Fonction, ModeRemunerationEntity } from '@modules/organisation/entities';

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

    @Column({ type: 'varchar', length: 50 })
    typeContrat!: string; // Code du type de contrat (CDD, CDI, etc.)

    @ManyToOne(() => TypeContratPersonnalise, { nullable: true })
    @JoinColumn({ name: 'typeContratId' })
    typeContratEntity?: TypeContratPersonnalise;

    @Column({ type: 'uuid', nullable: true })
    typeContratId?: string;

    @Column({ type: 'uuid', nullable: true })
    uniteOrganisationnelleId?: string;

    @ManyToOne(() => UniteOrganisationnelle, { nullable: true })
    @JoinColumn({ name: 'uniteOrganisationnelleId' })
    uniteOrganisationnelle?: UniteOrganisationnelle;

    @Column({ type: 'uuid', nullable: true })
    fonctionId?: string;

    @ManyToOne(() => Fonction, { nullable: true })
    @JoinColumn({ name: 'fonctionId' })
    fonction?: Fonction;

    @Column({ type: 'uuid', nullable: true })
    posteId?: string;

    @ManyToOne(() => Poste, { nullable: true })
    @JoinColumn({ name: 'posteId' })
    poste?: Poste;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date', nullable: true })
    dateFin?: Date | null;

    @Column({ type: 'decimal', precision: 12, scale: 0, transformer: numericTransformer })
    salaireBase!: number;

    @Column({ type: 'decimal', precision: 10, scale: 0, nullable: true, transformer: numericTransformer })
    tarifHoraire?: number | null;

    @Column({ type: 'uuid', nullable: true })
    modeRemunerationId?: string | null;

    @ManyToOne(() => ModeRemunerationEntity, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'modeRemunerationId' })
    modeRemuneration?: ModeRemunerationEntity | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: numericTransformer })
    heuresContractuellesMois?: number | null;

    @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true, transformer: numericTransformer })
    tarifHebdomadaire?: number | null;

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
