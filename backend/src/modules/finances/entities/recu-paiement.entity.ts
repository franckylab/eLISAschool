/**
 * ==================================
 * eLISAschool - Entité Reçu de Paiement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Paiement } from './paiement.entity';
import { Etablissement } from '@modules/etablissement/entities';
import { Classe } from '@modules/classes/entities';
import { Cycle } from '@modules/cycles/entities';
import { Section } from './section.entity';

@Entity('recus_paiement')
@Index(['numeroRecu'], { unique: true })
@Index(['paiementId'])
export class RecuPaiement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    paiementId!: string;

    @ManyToOne(() => Paiement)
    @JoinColumn({ name: 'paiementId' })
    paiement?: Paiement;

    @Column({ type: 'varchar', length: 50, unique: true })
    numeroRecu!: string;

    @Column({ type: 'timestamp' })
    dateEmission!: Date;

    @Column({ type: 'varchar', length: 150 })
    eleveNom!: string;

    @Column({ type: 'varchar', length: 50 })
    eleveMatricule!: string;

    @Column({ type: 'varchar', length: 100 })
    classeNom!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montant!: number;

    @Column({ type: 'varchar', length: 30 })
    methodePaiement!: string;

    @Column({ type: 'varchar', length: 255 })
    objet!: string;

    @Column({ type: 'uuid' })
    genererPar!: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    signatureNumerique?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    pdfPath?: string;

    @Column({ type: 'boolean', default: false })
    envoyeParEmail!: boolean;

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

/**
 * ==================================
 * eLISAschool - Entité Relance de Paiement
 * ==================================
 */

export enum TypeRelance {
    SMS = 'SMS',
    EMAIL = 'EMAIL',
    LETTER = 'LETTER',
    PHONE = 'PHONE',
}

export enum StatutRelance {
    ENVOYEE = 'ENVOYEE',
    LUE = 'LUE',
    IGNOREE = 'IGNOREE',
    PAYE_APRES = 'PAYE_APRES',
}

@Entity('relances_paiement')
@Index(['eleveId'])
@Index(['echeancierId'])
export class RelancePaiement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @Column({ type: 'uuid' })
    echeancierId!: string;

    @Column({ type: 'int' })
    numeroRelance!: number;

    @Column({ type: 'timestamp' })
    dateRelance!: Date;

    @Column({ type: 'enum', enum: TypeRelance })
    typeRelance!: TypeRelance;

    @Column({ type: 'enum', enum: StatutRelance, default: StatutRelance.ENVOYEE })
    statut!: StatutRelance;

    @Column({ type: 'text' })
    message!: string;

    @Column({ type: 'text', nullable: true })
    reponse?: string;

    @Column({ type: 'uuid' })
    effectuePar!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * ==================================
 * eLISAschool - Entité Remise
 * ==================================
 */

export enum TypeRemise {
    FRATRIE = 'FRATRIE',
    BOURSE = 'BOURSE',
    PERSONNEL = 'PERSONNEL',
    ANTICIPE = 'ANTICIPE',
    AUTRE = 'AUTRE',
}

/**
 * Scope d'application de la remise
 */
export enum ScopeRemise {
    ETABLISSEMENT = 'ETABLISSEMENT',
    CYCLE = 'CYCLE',
    NIVEAU = 'NIVEAU',
    CLASSE = 'CLASSE',
    SECTION = 'SECTION',
    ELEVE = 'ELEVE',
}

@Entity('remises')
@Index(['eleveId'])
@Index(['scopeRemise', 'etablissementId'])
export class Remise {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    eleveId?: string;

    @Column({ type: 'uuid' })
    fraisScolariteId!: string;

    @Column({ type: 'enum', enum: TypeRemise })
    typeRemise!: TypeRemise;

    @Column({ type: 'varchar', length: 30, default: ScopeRemise.ELEVE })
    scopeRemise!: ScopeRemise;

    @Column({ type: 'uuid', nullable: true })
    classeId?: string;

    @ManyToOne(() => Classe, { nullable: true })
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    @Column({ type: 'uuid', nullable: true })
    cycleId?: string;

    @ManyToOne(() => Cycle, { nullable: true })
    @JoinColumn({ name: 'cycleId' })
    cycle?: Cycle;

    @Column({ type: 'uuid', nullable: true })
    sectionId?: string;

    @ManyToOne(() => Section, { nullable: true })
    @JoinColumn({ name: 'sectionId' })
    section?: Section;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    pourcentage!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montant!: number;

    @Column({ type: 'text' })
    motif!: string;

    @Column({ type: 'uuid' })
    validePar!: string;

    @Column({ type: 'timestamp' })
    dateAttribution!: Date;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
