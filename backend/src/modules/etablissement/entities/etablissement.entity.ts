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
    @OneToOne(() => EtablissementConfig, (config) => config.etablissement)
    configuration?: EtablissementConfig;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// Entité EtablissementConfig (configuration par établissement)
// ==================================

/**
 * Configuration spécifique à un établissement (cycles actifs, bulletin, etc.).
 * Relation 1:1 avec Etablissement — un établissement a une seule config.
 */
@Entity('etablissement_config')
export class EtablissementConfig {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    /**
     * Relation 1:1 vers l'établissement parent
     */
    @OneToOne(() => Etablissement, (etablissement) => etablissement.configuration)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'simple-json', default: [CycleScolaire.COLLEGE, CycleScolaire.LYCEE] })
    cyclesActifs!: CycleScolaire[];

    @Column({ type: 'simple-json', nullable: true })
    configurationBulletin?: {
        style?: string; // 'moderne', 'classique'
        couleurPrimaire?: string;
        afficherRang?: boolean;
        afficherMoyenneGenerale?: boolean;
        afficherAppreciation?: boolean;
        afficherPhoto?: boolean;
        afficherCourbeProgression?: boolean;
    };

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
