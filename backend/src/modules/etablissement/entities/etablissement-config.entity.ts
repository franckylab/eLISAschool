/**
 * ==================================
 * eLISAschool - Entité EtablissementConfig
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Configuration spécifique à un établissement (thème, quotas, modules, etc.)
 * Relation 1:1 avec Etablissement
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';

// Import pour le type de relation (sans créer de référence circulaire)
import type { Etablissement } from './etablissement.entity';

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
    @OneToOne('Etablissement', 'configuration')
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    /**
     * Cycles actifs pour cet établissement (références vers les IDs des cycles)
     * Exemple: ['uuid-1', 'uuid-2', 'uuid-3']
     */
    @Column({ type: 'simple-array', default: '' })
    cyclesActifs!: string[];

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

    /**
     * Paramètres de thème et personnalisation (migrés depuis ConfigurationApp)
     */
    @Column({ type: 'varchar', length: 10, nullable: true })
    couleurPrimaire?: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    couleurSecondaire?: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    couleurAccent?: string;

    @Column({ type: 'varchar', length: 20, default: 'default' })
    theme?: string; // default, dark, cameroon

    /**
     * Paramètres régionaux (migrés depuis ConfigurationApp)
     */
    @Column({ type: 'varchar', length: 10, default: 'fr' })
    langueDefaut?: string;

    @Column({ type: 'varchar', length: 10, default: 'XOF' })
    devise?: string;

    @Column({ type: 'varchar', length: 50, default: 'Africa/Douala' })
    fuseauHoraire?: string;

    @Column({ type: 'text', nullable: true })
    messageAccueil?: string;

    /**
     * Modules actifs pour cet établissement
     */
    @Column({ type: 'simple-json', default: '{}' })
    modulesActifs?: Record<string, boolean>;

    /**
     * Quotas et limites (plans SaaS)
     */
    @Column({ type: 'int', nullable: true })
    maxEleves?: number;

    @Column({ type: 'int', nullable: true })
    maxUtilisateurs?: number;

    @Column({ type: 'int', nullable: true })
    maxClasses?: number;

    @Column({ type: 'int', nullable: true })
    stockageMaxMB?: number;

    @Column({ type: 'timestamp', nullable: true })
    dateExpirationAbonnement?: Date;

    @Column({ type: 'varchar', length: 50, default: 'gratuit' })
    planAbonnement?: string; // gratuit, standard, premium, entreprise

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
