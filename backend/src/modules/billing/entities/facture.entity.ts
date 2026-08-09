/**
 * ==================================
 * eLISAschool - Entité Facture
 * ==================================
 * 
 * Représente une facture émise pour un abonnement.
 * Contient le montant de base, les tranches, les options, et la TVA.
 * Conforme OHADA : numéro séquentiel, TVA séparée, mentions légales.
 * 
 * Phase 4.1 — Refonte SaaS
 * Phase B.2 — OHADA compliance (TVA, mentions légales, numéro séquentiel)
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { AbonnementClient } from './abonnement-client.entity';
import { LigneFacture } from './ligne-facture.entity';

export enum StatutFacture {
    BROUILLON = 'BROUILLON',
    EMISE = 'EMISE',
    PAYEE = 'PAYEE',
    EN_RETARD = 'EN_RETARD',
    PARTIELLEMENT_PAYEE = 'PARTIELLEMENT_PAYEE',
    ANNULEE = 'ANNULEE',
    EN_PAIEMENT = 'EN_PAIEMENT',
    AVOIR = 'AVOIR',
}

@Entity('factures')
@Index(['abonnementId'])
@Index(['etablissementId'])
@Index(['statut'])
@Index(['dateEcheance'])
@Index(['numeroOHADA'])
export class Facture {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    numero!: string; // Ex: FAC-2026-0001

    /** Numéro séquentiel OHADA (ex: 'FAC-OHADA-2026-000001') */
    @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
    numeroOHADA?: string;

    @Column({ type: 'uuid' })
    abonnementId!: string;

    @ManyToOne(() => AbonnementClient, (abo) => abo.factures)
    @JoinColumn({ name: 'abonnementId' })
    abonnement!: AbonnementClient;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'date' })
    dateEmission!: Date;

    @Column({ type: 'date' })
    dateEcheance!: Date;

    @Column({ type: 'date', nullable: true })
    datePaiement?: Date;

    @Column({ type: 'int' })
    montantBase!: number;

    @Column({ type: 'int', default: 0 })
    montantTranches!: number;

    @Column({ type: 'int', default: 0 })
    montantOptions!: number;

    @Column({ type: 'int', default: 0 })
    montantPenalites!: number;

    /** Montant HT (avant TVA) */
    @Column({ type: 'int' })
    montantHT!: number;

    /** Montant TVA (19.25% Cameroun par défaut) */
    @Column({ type: 'int', default: 0 })
    montantTVA!: number;

    /** Taux TVA appliqué (en centièmes, ex: 1925 = 19.25%) */
    @Column({ type: 'int', default: 1925 })
    tauxTVA!: number;

    /** Montant TTC (HT + TVA + pénalités) */
    @Column({ type: 'int' })
    montantTotal!: number;

    @Column({ type: 'int', default: 0 })
    montantPaye!: number;

    @Column({ type: 'enum', enum: StatutFacture, default: StatutFacture.BROUILLON })
    statut!: StatutFacture;

    @Column({ type: 'varchar', length: 10, default: 'XAF' })
    devise!: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    /** Mentions légales OHADA */
    @Column({ type: 'text', nullable: true })
    mentionsLegales?: string;

    @Column({ type: 'int', default: 0 })
    nombreJoursRetard!: number;

    /** Nombre de relances envoyées (dunning) */
    @Column({ type: 'int', default: 0 })
    nombreRelances!: number;

    /** Date de la dernière relance */
    @Column({ type: 'date', nullable: true })
    dateDerniereRelance?: Date;

    /** Date de suspension (J+30 sans paiement) */
    @Column({ type: 'date', nullable: true })
    dateSuspension?: Date;

    // Relations
    @OneToMany(() => LigneFacture, (ligne) => ligne.facture, { cascade: true })
    lignes!: LigneFacture[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
