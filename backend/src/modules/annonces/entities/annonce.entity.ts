/**
 * ==================================
 * eLISAschool - Entités du module Annonces
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Module de gestion des annonces avec bande défilante,
 * ciblage multi-critères et workflow de validation.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities/etablissement.entity';
import { Utilisateur } from '@modules/utilisateurs/entities/utilisateur.entity';

// ==================== TYPES ET ENUMS ====================

export type AnnonceStatut = 'brouillon' | 'actif' | 'programmé' | 'expiré' | 'archive';
export type AnnonceValidation = 'brouillon' | 'en_attente_validation' | 'valide' | 'rejete';
export type AnnonceTypeContenu = 'texte' | 'html' | 'enrichi';
export type CiblageType =
  | 'role'           // Ciblage par rôle
  | 'utilisateur'    // Ciblage par utilisateur spécifique
  | 'classe'         // Ciblage par classe
  | 'niveau'         // Ciblage par niveau scolaire
  | 'fonction'       // Ciblage par fonction personnel
  | 'etablissement'; // Ciblage par établissement

// ==================== ENTITÉ PRINCIPALE ====================

@Entity('annonces')
@Index(['etablissementId'])
@Index(['statut', 'dateDebut', 'dateFin'])
@Index(['cibleGlobale'])
export class Annonce {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  titre!: string;

  @Column({ type: 'text' })
  contenu!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'texte',
    enum: ['texte', 'html', 'enrichi'],
  })
  typeContenu!: AnnonceTypeContenu;

  @Column({ type: 'int', default: 0 })
  priorite!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'brouillon',
    enum: ['brouillon', 'actif', 'programmé', 'expiré', 'archive'],
  })
  statut!: AnnonceStatut;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'brouillon',
    enum: ['brouillon', 'en_attente_validation', 'valide', 'rejete'],
  })
  validation!: AnnonceValidation;

  @Column({ type: 'timestamptz' })
  dateDebut!: Date;

  @Column({ type: 'timestamptz' })
  dateFin!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dateValidation?: Date;

  @Column({ type: 'uuid', nullable: true })
  validePar?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  motifRejet?: string;

  @Column({ type: 'boolean', default: false })
  cibleGlobale!: boolean;

  @Column({ type: 'int', default: 0 })
  ordreAffichage!: number;

  // Multi-tenant
  @Column({ type: 'uuid' })
  etablissementId!: string;

  // Audit
  @Column({ type: 'uuid' })
  createdBy!: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // ==================== RELATIONS ====================

  @ManyToOne(() => Etablissement)
  @JoinColumn({ name: 'etablissementId' })
  etablissement?: Etablissement;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'createdBy' })
  createur?: Utilisateur;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'validePar' })
  validateur?: Utilisateur;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'updatedBy' })
  updateur?: Utilisateur;

  @OneToMany(() => AnnonceCiblage, (ciblage) => ciblage.annonce)
  ciblages?: AnnonceCiblage[];
}

// ==================== ENTITÉ CIBLAGE ====================

@Entity('annonce_ciblages')
@Index(['annonceId'])
@Index(['typeCible', 'cibleId'])
export class AnnonceCiblage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  annonceId!: string;

  @Column({
    type: 'varchar',
    length: 30,
    enum: ['role', 'utilisateur', 'classe', 'niveau', 'fonction', 'etablissement'],
  })
  typeCible!: CiblageType;

  @Column({ type: 'varchar', length: 100 })
  cibleId!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cibleValeur?: string;

  @CreateDateColumn()
  createdAt!: Date;

  // ==================== RELATIONS ====================

  @ManyToOne(() => Annonce, (annonce) => annonce.ciblages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'annonceId' })
  annonce?: Annonce;
}
