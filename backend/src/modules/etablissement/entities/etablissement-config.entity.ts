/**
 * ==================================
 * eLISAschool - Entité EtablissementConfig
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Configuration spécifique à un établissement (SaaS uniquement).
 * Relation 1:1 avec Etablissement
 * 
 * Note: Les paramètres de thème, régionaux et modules ont été migrés
 * vers ParametreSysteme pour une source unique de vérité.
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

    /**
     * Configuration spécifique du bulletin
     */
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

    /**
     * Abonnement SaaS
     */
    @Column({ type: 'timestamp', nullable: true })
    dateExpirationAbonnement?: Date;

    @Column({ type: 'varchar', length: 50, default: 'gratuit' })
    planAbonnement?: string; // gratuit, standard, premium, entreprise

    /**
     * Renouvellement automatique de l'abonnement
     */
    @Column({ type: 'boolean', default: false })
    autoRenouvellement!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
