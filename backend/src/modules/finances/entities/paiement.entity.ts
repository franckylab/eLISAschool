/**
 * ==================================
 * eLISAschool - Entité Paiement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Eleve } from '@modules/eleves/entities';
import { Echeancier } from './echeancier.entity';
import { Etablissement } from '@modules/etablissement/entities';
import { TypePaiement, StatutPaiement } from '@shared/enums/statuts.enum';

@Entity('paiements')
@Index(['eleveId'])
@Index(['echeancierId'])
@Index(['etablissementId', 'datePaiement'])
export class Paiement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'uuid', nullable: true })
    echeancierId?: string;

    @ManyToOne(() => Echeancier, { nullable: true })
    @JoinColumn({ name: 'echeancierId' })
    echeancier?: Echeancier;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montant!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    montantPenalite!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantTotal!: number;

    @Column({ type: 'enum', enum: TypePaiement, default: TypePaiement.SCOLARITE })
    typePaiement!: TypePaiement;

    @Column({ type: 'varchar', length: 30 })
    methodePaiement!: string; // 'ESPECES', 'MOBILE_MONEY', 'CARTE', 'VIREMENT', 'CHEQUE'

    @Column({ type: 'varchar', length: 100, nullable: true })
    referenceTransaction?: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    numeroRecu!: string;

    @Column({ type: 'timestamp' })
    datePaiement!: Date;

    @Column({ type: 'enum', enum: StatutPaiement, default: StatutPaiement.PAYE })
    statut!: StatutPaiement;

    @Column({ type: 'uuid' })
    effectuePar!: string;

    @Column({ type: 'uuid', nullable: true })
    validePar?: string;

    @Column({ type: 'text', nullable: true })
    observations?: string;

    // ==================================
    // Champs workflow de validation financière (v2.0)
    // ==================================

    @Column({ type: 'varchar', length: 20, default: 'NON_REQUIS' })
    statutValidation!: 'NON_REQUIS' | 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';

    @Column({ type: 'int', default: 0 })
    niveauValidationActuel!: number;

    @Column({ type: 'text', nullable: true })
    motifRefus?: string;

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
