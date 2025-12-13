/**
 * ==================================
 * eLISAschool - Entités Etablissement
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
} from 'typeorm';

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

/**
 * Configuration globale de l'établissement
 */
@Entity('etablissement_config')
export class EtablissementConfig {
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

    @Column({ type: 'simple-json', default: [CycleScolaire.COLLEGE, CycleScolaire.LYCEE] })
    cyclesActifs!: CycleScolaire[];

    @Column({ type: 'varchar', length: 255, nullable: true })
    numeroArrete?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contactEmail?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contactTelephone?: string;

    @Column({ type: 'text', nullable: true })
    adresse?: string;

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
