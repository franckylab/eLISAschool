/**
 * ==================================
 * eLISAschool - Entité Configuration Application
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

/**
 * Entité ConfigurationApp
 * Stocke les paramètres globaux de l'application
 */
@Entity('configuration_app')
export class ConfigurationApp {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Informations établissement
    @Column({ type: 'varchar', length: 255 })
    nomEtablissement!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    typeEtablissement?: string; // MATERNELLE, PRIMAIRE, COLLEGE, LYCEE, MIXTE

    @Column({ type: 'text', nullable: true })
    adresseEtablissement?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    villeEtablissement?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    paysEtablissement?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneEtablissement?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    emailEtablissement?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    siteWebEtablissement?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    numeroAdministratif?: string; // Arrêté ministériel

    @Column({ type: 'varchar', length: 255, nullable: true })
    sloganEtablissement?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logoUrl?: string;

    @Column({ type: 'text', nullable: true })
    messageAccueil?: string; // Max 500 caractères

    // Paramètres régionaux
    @Column({ type: 'varchar', length: 10, default: 'fr' })
    langueDefaut!: string;

    @Column({ type: 'varchar', length: 10, default: 'XOF' })
    devise!: string;

    @Column({ type: 'varchar', length: 50, default: 'Africa/Douala' })
    fuseauHoraire!: string;

    // Thème
    @Column({ type: 'varchar', length: 10, default: '#28a745' })
    couleurPrimaire!: string;

    @Column({ type: 'varchar', length: 10, default: '#ffc107' })
    couleurSecondaire!: string;

    @Column({ type: 'varchar', length: 10, default: '#007bff' })
    couleurAccent!: string;

    @Column({ type: 'varchar', length: 20, default: 'default' })
    theme!: string; // default, dark, cameroon

    // Licence
    @Column({ type: 'varchar', length: 255, nullable: true })
    licenceKey?: string;

    @Column({ type: 'timestamp', nullable: true })
    licenceExpiration?: Date;

    @Column({ type: 'boolean', default: false })
    licenceActive!: boolean;

    // Modules activés
    @Column({ type: 'simple-json', default: '{}' })
    modulesActifs!: Record<string, boolean>;

    // Métadonnées
    @Column({ type: 'varchar', length: 20, default: '1.0.0' })
    version!: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

export default ConfigurationApp;
