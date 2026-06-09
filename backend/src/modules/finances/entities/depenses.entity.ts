/**
 * ==================================
 * eLISAschool - Entités Dépenses
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Type de charge pour les catégories de dépenses
 */
export enum TypeCharge {
    CHARGE_FIXE = 'CHARGE_FIXE',
    CHARGE_VARIABLE = 'CHARGE_VARIABLE',
    INVESTISSEMENT = 'INVESTISSEMENT',
}

@Entity('categories_depense')
@Index(['code'], { unique: true })
@Index(['etablissementId', 'type'])
export class CategorieDepense {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 10, unique: true })
    code!: string; // 'FOURN', 'SALAIRE', 'MAINTEN', etc.

    @Column({ type: 'varchar', length: 100 })
    libelle!: string;

    @Column({ type: 'enum', enum: TypeCharge })
    type!: TypeCharge;

    @Column({ type: 'varchar', length: 6 })
    compteComptableCharge!: string; // ex: '606000'

    @Column({ type: 'varchar', length: 6, default: '445660' })
    compteComptableTVA!: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    budgetAnnuel?: number;

    @Column({ type: 'uuid', nullable: true })
    responsableId?: string;

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
 * Statuts d'une dépense
 */
export enum StatutDepense {
    BROUILLON = 'BROUILLON',
    EN_COURS_VALIDATION = 'EN_COURS_VALIDATION',
    VALIDEE = 'VALIDEE',
    PAYEE = 'PAYEE',
    PARTIELLEMENT_PAYEE = 'PARTIELLEMENT_PAYEE',
    ANNULEE = 'ANNULEE',
}

@Entity('depenses')
@Index(['categorieDepenseId'])
@Index(['etablissementId', 'dateFacture'])
@Index(['statut'])
export class Depense {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    categorieDepenseId!: string;

    @ManyToOne(() => CategorieDepense)
    @JoinColumn({ name: 'categorieDepenseId' })
    categorieDepense?: CategorieDepense;

    @Column({ type: 'varchar', length: 50, unique: true })
    numeroPiece!: string; // 'DEP-2026-00001'

    @Column({ type: 'varchar', length: 255 })
    libelle!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantHT!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 19.25 })
    tva!: number; // Pourcentage

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantTTC!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    montantPaye!: number;

    @Column({ type: 'date' })
    dateFacture!: Date;

    @Column({ type: 'date', nullable: true })
    dateEcheance?: Date;

    @Column({ type: 'timestamp', nullable: true })
    datePaiement?: Date;

    @Column({ type: 'varchar', length: 150 })
    fournisseur!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    referenceFacture?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    justificatifPath?: string;

    @Column({ type: 'varchar', length: 30 })
    methodePaiement!: string; // 'ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE'

    @Column({ type: 'varchar', length: 100, nullable: true })
    referenceTransaction?: string;

    @Column({ type: 'enum', enum: StatutDepense, default: StatutDepense.BROUILLON })
    statut!: StatutDepense;

    @Column({ type: 'int', default: 0 })
    niveauValidation!: number; // Niveau actuel de validation (workflow)

    @Column({ type: 'uuid', nullable: true })
    demandeePar?: string; // Utilisateur qui a créé la demande

    @Column({ type: 'uuid' })
    effectuePar!: string;

    @Column({ type: 'uuid', nullable: true })
    validePar?: string;

    @Column({ type: 'int' })
    exerciceComptable!: number;

    @Column({ type: 'int' })
    periodeComptable!: number; // 1-12

    @Column({ type: 'text', nullable: true })
    observations?: string;

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
 * Statuts d'une demande de dépense
 */
export enum StatutDemande {
    BROUILLON = 'BROUILLON',
    SOUMISE = 'SOUMISE',
    APPROUVEE = 'APPROUVEE',
    REJETEE = 'REJETEE',
    ANNULEE = 'ANNULEE',
}

export enum NiveauUrgence {
    BASSE = 'BASSE',
    MOYENNE = 'MOYENNE',
    HAUTE = 'HAUTE',
    CRITIQUE = 'CRITIQUE',
}

@Entity('demandes_depense')
@Index(['demandeurId'])
@Index(['statut'])
export class DemandeDepense {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    demandeurId!: string;

    @Column({ type: 'uuid' })
    categorieDepenseId!: string;

    @ManyToOne(() => CategorieDepense)
    @JoinColumn({ name: 'categorieDepenseId' })
    categorieDepense?: CategorieDepense;

    @Column({ type: 'varchar', length: 255 })
    libelle!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantEstime!: number;

    @Column({ type: 'enum', enum: NiveauUrgence, default: NiveauUrgence.MOYENNE })
    urgence!: NiveauUrgence;

    @Column({ type: 'text' })
    justification!: string;

    @Column({ type: 'enum', enum: StatutDemande, default: StatutDemande.BROUILLON })
    statut!: StatutDemande;

    @Column({ type: 'uuid', nullable: true })
    validePar?: string;

    @Column({ type: 'timestamp', nullable: true })
    dateValidation?: Date;

    @Column({ type: 'text', nullable: true })
    motifRejet?: string;

    @Column({ type: 'uuid', nullable: true })
    depenseId?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * Statuts d'un bon de commande
 */
export enum StatutBonCommande {
    BROUILLON = 'BROUILLON',
    ENVOYE = 'ENVOYE',
    RECU = 'RECU',
    FACTURE = 'FACTURE',
    ANNULE = 'ANNULE',
}

@Entity('bons_commande')
@Index(['numeroBon'], { unique: true })
export class BonCommande {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    numeroBon!: string; // 'BC-2026-00001'

    @Column({ type: 'uuid' })
    demandeurId!: string;

    @Column({ type: 'varchar', length: 150 })
    fournisseur!: string;

    @Column({ type: 'date' })
    dateCommande!: Date;

    @Column({ type: 'date', nullable: true })
    dateLivraisonPrevue?: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantTotal!: number;

    @Column({ type: 'simple-json' })
    articles!: Array<{
        description: string;
        quantite: number;
        prixUnitaire: number;
        montantTotal: number;
    }>;

    @Column({ type: 'enum', enum: StatutBonCommande, default: StatutBonCommande.BROUILLON })
    statut!: StatutBonCommande;

    @Column({ type: 'uuid', nullable: true })
    depenseId?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * Statuts d'une facture fournisseur
 */
export enum StatutFacture {
    EN_ATTENTE = 'EN_ATTENTE',
    VERIFIEE = 'VERIFIEE',
    PAYEE = 'PAYEE',
    ANNULEE = 'ANNULEE',
}

@Entity('factures_fournisseur')
@Index(['numeroFacture'], { unique: true })
@Index(['depenseId'])
export class FactureFournisseur {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    numeroFacture!: string;

    @Column({ type: 'uuid', nullable: true })
    depenseId?: string;

    @Column({ type: 'varchar', length: 150 })
    fournisseur!: string;

    @Column({ type: 'date' })
    dateFacture!: Date;

    @Column({ type: 'date', nullable: true })
    dateEcheance?: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantHT!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    tva!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montantTTC!: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    pdfPath?: string;

    @Column({ type: 'uuid' })
    saisiePar!: string;

    @Column({ type: 'uuid', nullable: true })
    verifieePar?: string;

    @Column({ type: 'enum', enum: StatutFacture, default: StatutFacture.EN_ATTENTE })
    statut!: StatutFacture;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
