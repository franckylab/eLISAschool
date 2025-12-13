/**
 * ==================================
 * eLISAschool - Entités Impressions
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

/**
 * Type de document à imprimer
 */
export enum TypeDocument {
    BULLETIN = 'BULLETIN',
    CERTIFICAT = 'CERTIFICAT',
    CARTE_SCOLAIRE = 'CARTE_SCOLAIRE',
    ATTESTATION = 'ATTESTATION',
    RAPPORT = 'RAPPORT',
    FORMULAIRE = 'FORMULAIRE',
    AUTRE = 'AUTRE',
}

/**
 * Statut d'impression
 */
export enum StatutImpression {
    EN_ATTENTE = 'EN_ATTENTE',
    EN_COURS = 'EN_COURS',
    TERMINE = 'TERMINE',
    ECHEC = 'ECHEC',
    ANNULE = 'ANNULE',
}

/**
 * Modèle de document
 */
@Entity('modeles_documents')
export class ModeleDocument {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    nom!: string;

    @Column({ type: 'enum', enum: TypeDocument })
    type!: TypeDocument;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text' })
    template!: string; // HTML avec placeholders

    @Column({ type: 'simple-json', nullable: true })
    entete?: {
        logoEtablissement?: boolean;
        logoElisaschool?: boolean;
        nomEtablissement?: boolean;
        numeroAdmin?: boolean;
        adresse?: boolean;
        slogan?: boolean;
    };

    @Column({ type: 'simple-json', nullable: true })
    piedDePage?: {
        numeroPage?: boolean;
        date?: boolean;
        version?: boolean;
    };

    @Column({ type: 'simple-json', nullable: true })
    styles?: Record<string, string>;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'boolean', default: false })
    parDefaut!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * File d'impression
 */
@Entity('file_impressions')
@Index(['statut', 'createdAt'])
export class FileImpression {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @Column({ type: 'enum', enum: TypeDocument })
    type!: TypeDocument;

    @Column({ type: 'uuid', nullable: true })
    modeleId?: string;

    @Column({ type: 'varchar', length: 255 })
    titre!: string;

    @Column({ type: 'simple-json', nullable: true })
    donnees?: Record<string, any>;

    @Column({ type: 'enum', enum: StatutImpression, default: StatutImpression.EN_ATTENTE })
    statut!: StatutImpression;

    @Column({ type: 'varchar', length: 500, nullable: true })
    fichierUrl?: string;

    @Column({ type: 'int', default: 1 })
    nombreCopies!: number;

    @Column({ type: 'text', nullable: true })
    erreur?: string;

    @Column({ type: 'timestamp', nullable: true })
    dateTraitement?: Date;

    @CreateDateColumn()
    createdAt!: Date;
}

export default { ModeleDocument, FileImpression, TypeDocument, StatutImpression };
