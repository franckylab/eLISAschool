/**
 * ==================================
 * eLISAschool - Entité Configuration Dashboard Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Description: Permet à chaque utilisateur de personnaliser son dashboard
 */

import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    Index, Unique,
} from 'typeorm';

/**
 * Configuration du dashboard personnalisé par utilisateur
 */
@Entity('dashboard_config')
@Unique(['utilisateurId'])
@Index(['utilisateurId'])
export class DashboardConfig {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** ID de l'utilisateur */
    @Column({ type: 'uuid', unique: true })
    utilisateurId!: string;

    /** Layout du dashboard (grid configuration) */
    @Column({ type: 'jsonb', default: [] })
    layout!: Array<{
        id: string;
        widget: string;
        x: number;
        y: number;
        w: number;
        h: number;
        visible: boolean;
        ordre: number;
    }>;

    /** Widgets actifs */
    @Column({ type: 'jsonb', default: [] })
    widgetsActifs!: string[];

    /** Widgets masqués */
    @Column({ type: 'jsonb', default: [] })
    widgetsMasques!: string[];

    /** Configuration spécifique par widget */
    @Column({ type: 'jsonb', default: {} })
    widgetConfig!: Record<string, Record<string, any>>;

    /** Thème du dashboard */
    @Column({
        type: 'varchar',
        length: 50,
        default: 'default',
    })
    themeDashboard!: string;

    /** Nombre de colonnes */
    @Column({ type: 'int', default: 3 })
    nombreColonnes!: number;

    /** Taille des cartes (small, medium, large) */
    @Column({
        type: 'varchar',
        length: 20,
        default: 'medium',
    })
    tailleCartes!: 'small' | 'medium' | 'large';

    /** Tri par défaut (alphabetique, personnalisé, frequent) */
    @Column({
        type: 'varchar',
        length: 30,
        default: 'personnalise',
    })
    triParDefaut!: 'alphabetique' | 'personnalise' | 'frequent';

    /** Afficher les statistiques rapides */
    @Column({ type: 'boolean', default: true })
    afficherStatsRapides!: boolean;

    /** Afficher les notifications récentes */
    @Column({ type: 'boolean', default: true })
    afficherNotificationsRecents!: boolean;

    /** Nombre de notifications à afficher */
    @Column({ type: 'int', default: 5 })
    nombreNotifications!: number;

    /** Rafraîchissement automatique (secondes, 0 = désactivé) */
    @Column({ type: 'int', default: 60 })
    refreshInterval!: number;

    /** Date de création */
    @CreateDateColumn()
    createdAt!: Date;

    /** Date de dernière modification */
    @UpdateDateColumn()
    updatedAt!: Date;
}
