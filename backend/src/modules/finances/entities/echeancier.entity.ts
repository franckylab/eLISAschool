/**
 * ==================================
 * eLISAschool - Entité Échéancier de Paiement
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Eleve } from '@modules/eleves/entities';
import { FraisScolarite } from './frais-scolarite.entity';
import { Etablissement } from '@modules/etablissement/entities';
import { StatutPaiement } from '@shared/enums/statuts.enum';

// Enum pour le statut de l'échéancier
export enum StatutEcheancier {
    EN_ATTENTE = 'EN_ATTENTE',
    PAYE = 'PAYE',
    EN_RETARD = 'EN_RETARD',
    ANNULE = 'ANNULE'
}

@Entity('echeanciers_paiement')
@Index(['eleveId'])
@Index(['etablissementId', 'statut'])
export class Echeancier {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'uuid' })
    fraisScolariteId!: string;

    @ManyToOne(() => FraisScolarite)
    @JoinColumn({ name: 'fraisScolariteId' })
    fraisScolarite?: FraisScolarite;

    @Column({ type: 'int' })
    numeroTranche!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantAttendu!: number;

    @Column({ type: 'date' })
    dateEcheance!: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    montantPaye!: number;

    @Column({ type: 'enum', enum: StatutPaiement, default: StatutPaiement.EN_ATTENTE })
    statut!: StatutPaiement;

    @Column({ type: 'timestamp', nullable: true })
    datePaiementReel?: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    penaliteAppliquee?: number;

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
