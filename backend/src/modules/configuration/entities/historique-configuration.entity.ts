/**
 * ==================================
 * eLISAschool - Entité Historique Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Suivi des modifications de configuration pour audit et restauration
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

/**
 * Type d'action sur la configuration
 */
export enum ActionConfiguration {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    RESET = 'RESET',
    IMPORT = 'IMPORT',
    EXPORT = 'EXPORT',
    RESTORE = 'RESTORE',
}

/**
 * Type de cible
 */
export enum CibleConfiguration {
    APP = 'APP',
    MODULE = 'MODULE',
    PARAMETRE = 'PARAMETRE',
}

/**
 * Entité HistoriqueConfiguration
 * Enregistre toutes les modifications de configuration
 */
@Entity('historique_configuration')
@Index(['utilisateurId', 'createdAt'])
@Index(['cible', 'cibleId'])
@Index(['action', 'createdAt'])
export class HistoriqueConfiguration {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    utilisateurId?: string;

    @Column({ type: 'enum', enum: ActionConfiguration })
    action!: ActionConfiguration;

    @Column({ type: 'enum', enum: CibleConfiguration })
    cible!: CibleConfiguration;

    @Column({ type: 'varchar', length: 255, nullable: true })
    cibleId?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    cibleNom?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'simple-json', nullable: true })
    ancienneValeur?: any;

    @Column({ type: 'simple-json', nullable: true })
    nouvelleValeur?: any;

    @Column({ type: 'varchar', length: 45, nullable: true })
    ipAddress?: string;

    @Column({ type: 'boolean', default: false })
    restaurable!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

export default HistoriqueConfiguration;
