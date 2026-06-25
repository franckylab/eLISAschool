/**
 * ==================================
 * eLISAschool - Entités Etablissement
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
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
// Statut workflow d'un établissement
// ==================================

export enum StatutEtablissement {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    EN_ATTENTE_DESACTIVATION = 'EN_ATTENTE_DESACTIVATION',
    INACTIF = 'INACTIF',
}

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

    // ==================================
    // Logo de l'établissement (v3.0)
    // ==================================

    /**
     * Logo encodé en base64 (data:image/xxx;base64,...)
     * Non chargé par défaut pour éviter d'alourdir les requêtes
     */
    @Column({ type: 'text', nullable: true, select: false })
    logoBase64?: string;

    /**
     * Type MIME du logo : 'png', 'jpg', 'svg', 'webp'
     */
    @Column({ type: 'varchar', length: 10, nullable: true })
    logoType?: string;

    /**
     * Taille du fichier original en octets
     */
    @Column({ type: 'integer', nullable: true })
    logoTaille?: number;

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

    @Column({ type: 'varchar', length: 30, default: StatutEtablissement.ACTIF })
    statut!: StatutEtablissement;

    // ==================================
    // Champs d'identification additionnels (v2.0)
    // ==================================

    @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
    codeEtablissement?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    numeroContribuable?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    numeroCompteBancaire?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    siteWeb?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    facebook?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    twitter?: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    heuresOuverture?: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    heuresFermeture?: string;

    @Column({ type: 'int', nullable: true })
    effectifMax?: number;

    @Column({ type: 'int', default: 0 })
    effectifActuel!: number;

    @Column({ type: 'varchar', length: 200, nullable: true })
    directeurNom?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    directeurAdjointNom?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    censeurNom?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    surveillantGeneralNom?: string;

    // ==================================
    // Couleurs et personnalisation visuelle (v2.1)
    // ==================================

    @Column({ type: 'varchar', length: 20, nullable: true })
    couleurPrimaire?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    couleurSecondaire?: string;

    // ==================================
    // Paramètres régionaux (v3.0)
    // ==================================

    /**
     * Langue par défaut de l'établissement
     * Fallback: ParametreSysteme → ConfigurationApp → 'fr'
     */
    @Column({ type: 'varchar', length: 10, default: 'fr' })
    langueDefaut!: string;

    /**
     * Devise monétaire de l'établissement
     * Fallback: ParametreSysteme → ConfigurationApp → 'XAF'
     */
    @Column({ type: 'varchar', length: 10, default: 'XAF' })
    devise!: string;

    /**
     * Fuseau horaire de l'établissement (format IANA)
     * Fallback: ParametreSysteme → ConfigurationApp → 'Africa/Douala'
     */
    @Column({ type: 'varchar', length: 50, default: 'Africa/Douala' })
    fuseauHoraire!: string;

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
