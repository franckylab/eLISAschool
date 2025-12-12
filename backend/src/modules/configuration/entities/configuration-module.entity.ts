/**
 * ==================================
 * eLISAschool - Entité Configuration Module
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
 * Configuration d'un champ personnalisable
 */
export interface ChampPersonnalise {
    nom: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
    required: boolean;
    visible: boolean;
    ordre: number;
    options?: string[]; // Pour les selects
    defaultValue?: any;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

/**
 * Configuration d'un widget
 */
export interface WidgetConfig {
    id: string;
    nom: string;
    type: string;
    visible: boolean;
    ordre: number;
    position: { x: number; y: number };
    taille: { width: number; height: number };
    config?: Record<string, any>;
}

/**
 * Entité ConfigurationModule
 * Stocke les configurations personnalisées par module
 */
@Entity('configuration_modules')
export class ConfigurationModule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    moduleNom!: string; // auth, cantine, transport, etc.

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string; // null = config globale

    // Champs personnalisés pour les formulaires
    @Column({ type: 'simple-json', default: '[]' })
    champsPersonnalises!: ChampPersonnalise[];

    // Configuration des widgets du tableau de bord
    @Column({ type: 'simple-json', default: '[]' })
    widgets!: WidgetConfig[];

    // Paramètres spécifiques au module
    @Column({ type: 'simple-json', default: '{}' })
    parametres!: Record<string, any>;

    // Module activé/désactivé
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

export default ConfigurationModule;
