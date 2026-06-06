/**
 * ==================================
 * eLISAschool - Entités Etablissement
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Support multi-établissements : chaque établissement est une entité
 * distincte avec sa propre configuration (relation 1:1).
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { EtablissementConfig } from './etablissement-config.entity';

// ==================================
// Enums partagés (utilisés par d'autres modules)
// ==================================

export enum SousSysteme {
    FRANCOPHONE = 'FRANCOPHONE',
    ANGLOPHONE = 'ANGLOPHONE',
    BICULTUREL = 'BICULTUREL',
}

export enum TypeEtablissement {
    LAIC = 'LAIC',
    CONFESSIONNEL_CATHOLIQUE = 'CONFESSIONNEL_CATHOLIQUE',
    CONFESSIONNEL_PROTESTANT = 'CONFESSIONNEL_PROTESTANT',
    CONFESSIONNEL_ISLAMIQUE = 'CONFESSIONNEL_ISLAMIQUE',
    AUTRE = 'AUTRE',
}

export enum CycleScolaire {
    MATERNELLE = 'MATERNELLE',
    PRIMAIRE = 'PRIMAIRE',
    COLLEGE = 'COLLEGE',
    LYCEE = 'LYCEE',
}

// ==================================
// Entité Etablissement (multi-établissements)
// ==================================

/**
 * Entité principale représentant un établissement scolaire.
 * Le système supporte plusieurs établissements, chacun ayant
 * sa propre configuration, ses classes, élèves, personnel, etc.
 */
@Entity('etablissements')
export class Etablissement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    nom!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    slogan?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logoUrl?: string;

    @Column({ type: 'enum', enum: SousSysteme, default: SousSysteme.FRANCOPHONE })
    sousSysteme!: SousSysteme;

    @Column({ type: 'enum', enum: TypeEtablissement, default: TypeEtablissement.LAIC })
    type!: TypeEtablissement;

    @Column({ type: 'varchar', length: 255, nullable: true })
    numeroArrete?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contactEmail?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contactTelephone?: string;

    @Column({ type: 'text', nullable: true })
    adresse?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Relation 1:1 vers la configuration de l'établissement.
     * Chargée à la demande pour éviter les requêtes inutiles.
     */
    @OneToOne('EtablissementConfig', 'etablissement')
    configuration?: EtablissementConfig;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
