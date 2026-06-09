/**
 * ==================================
 * eLISAschool - Entités Comptabilité
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Entités pour la gestion comptable (système OHADA)
 * - EcritureComptable: Écritures comptables
 * - CompteCaisse: Comptes de caisse
 * - CompteBancaire: Comptes bancaires
 * - MouvementCaisse: Mouvements de caisse
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';

// Enums
export enum TypeEcriture {
    PAIEMENT = 'PAIEMENT',
    DEPENSE = 'DEPENSE',
    AJUSTEMENT = 'AJUSTEMENT',
    OUVERTURE = 'OUVERTURE',
    CLOTURE = 'CLOTURE'
}

export enum StatutEcriture {
    BROUILLON = 'BROUILLON',
    VALIDE = 'VALIDE',
    ANNULE = 'ANNULE'
}

export enum TypeCompteCaisse {
    PRINCIPALE = 'PRINCIPALE',
    SECONDAIRE = 'SECONDAIRE',
    CAISSE_ECOLE = 'CAISSE_ECOLE'
}

export enum TypeCompteBancaire {
    COURANT = 'COURANT',
    EPARGNE = 'EPARGNE',
    BLOQUE = 'BLOQUE'
}

export enum TypeMouvementCaisse {
    ENTREE = 'ENTREE',
    SORTIE = 'SORTIE'
}

// ==================================
// EcritureComptable
// ==================================

@Entity('ecritures_comptables')
@Index(['etablissementId'])
@Index(['dateEcriture'])
@Index(['numeroPiece'])
export class EcritureComptable {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    numeroPiece!: string; // EC-2026-00001

    @Column({ type: 'date' })
    dateEcriture!: Date;

    @Column({ type: 'varchar', length: 255 })
    libelle!: string;

    @Column({ type: 'varchar', length: 6 })
    compteDebit!: string; // Plan OHADA (ex: 531000, 606100)

    @Column({ type: 'varchar', length: 6 })
    compteCredit!: string; // Plan OHADA (ex: 706000, 401000)

    @Column({ type: 'numeric', precision: 15, scale: 2 })
    montantDebit!: number;

    @Column({ type: 'numeric', precision: 15, scale: 2 })
    montantCredit!: number;

    @Column({ type: 'varchar', length: 20, default: TypeEcriture.PAIEMENT })
    type!: TypeEcriture;

    @Column({ type: 'varchar', length: 30, default: StatutEcriture.BROUILLON })
    statut!: StatutEcriture;

    @Column({ type: 'varchar', length: 255, nullable: true })
    referenceExterne?: string; // paiementId, depenseId

    @Column({ type: 'text', nullable: true })
    observations?: string;

    @Column({ type: 'uuid', nullable: true })
    utilisateurId?: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CompteCaisse
// ==================================

@Entity('comptes_caisse')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'], { unique: true })
export class CompteCaisse {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 10 })
    code!: string; // CAIS-001

    @Column({ type: 'varchar', length: 100 })
    libelle!: string; // Caisse principale

    @Column({ type: 'varchar', length: 30, default: TypeCompteCaisse.PRINCIPALE })
    type!: TypeCompteCaisse;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    soldeActuel!: number;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    soldeInitial!: number;

    @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
    seuilAlerte?: number; // Alerte si < seuil

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// CompteBancaire
// ==================================

@Entity('comptes_bancaires')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'], { unique: true })
export class CompteBancaire {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 10 })
    code!: string; // BANQ-001

    @Column({ type: 'varchar', length: 100 })
    libelle!: string; // Compte BICEC

    @Column({ type: 'varchar', length: 50 })
    banque!: string; // BICEC, Afriland, etc.

    @Column({ type: 'varchar', length: 50 })
    numeroCompte!: string; // Numéro de compte

    @Column({ type: 'varchar', length: 30, default: TypeCompteBancaire.COURANT })
    type!: TypeCompteBancaire;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    soldeActuel!: number;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    soldeInitial!: number;

    @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
    decouvertAutorise?: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// MouvementCaisse
// ==================================

@Entity('mouvements_caisse')
@Index(['etablissementId'])
@Index(['dateMouvement'])
@Index(['compteCaisseId'])
export class MouvementCaisse {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    numeroOperation!: string; // MC-2026-00001

    @Column({ type: 'date' })
    dateMouvement!: Date;

    @Column({ type: 'varchar', length: 30 })
    type!: TypeMouvementCaisse; // ENTREE ou SORTIE

    @Column({ type: 'numeric', precision: 15, scale: 2 })
    montant!: number;

    @Column({ type: 'varchar', length: 255 })
    motif!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    beneficiaire?: string; // Pour les sorties

    @Column({ type: 'varchar', length: 255, nullable: true })
    reference?: string; // numeroRecu, numeroDepense

    @Column({ type: 'numeric', precision: 15, scale: 2 })
    soldeApresOperation!: number;

    @ManyToOne(() => CompteCaisse)
    @JoinColumn({ name: 'compteCaisseId' })
    compteCaisse!: CompteCaisse;

    @Column({ type: 'uuid' })
    compteCaisseId!: string;

    @Column({ type: 'uuid', nullable: true })
    utilisateurId?: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
