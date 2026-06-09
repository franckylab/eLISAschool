/**
 * ==================================
 * eLISAschool - Types Dashboard
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Types et interfaces pour le système de dashboard dynamique
 */

import { Role } from '@shared/enums/roles.enum';

/**
 * Stratégie de rafraîchissement des widgets
 */
export type RefreshStrategy = 'interval' | 'on-demand' | 'realtime' | 'manual';

/**
 * Type de widget (pour le frontend)
 */
export type WidgetType = 
    | 'stats-cards'      // Cartes statistiques
    | 'chart-line'       // Graphique linéaire
    | 'chart-bar'        // Graphique en barres
    | 'chart-pie'        // Graphique circulaire
    | 'data-table'       // Tableau de données
    | 'list'             // Liste simple
    | 'calendar'         // Calendrier
    | 'progress'         // Barres de progression
    | 'alert'            // Alertes/Notifications
    | 'quick-actions'    // Actions rapides
    | 'custom';          // Widget personnalisé

/**
 * Définition d'un widget dans le registry
 */
export interface WidgetDefinition {
    /** Identifiant unique du widget */
    id: string;
    
    /** Nom affiché */
    nom: string;
    
    /** Description */
    description: string;
    
    /** Type de widget */
    type: WidgetType;
    
    /** Catégories de rôles autorisés */
    roles: Role[];
    
    /** Permissions requises (TOUTES doivent être présentes) */
    permissions: string[];
    
    /** Résolveur de données (format: 'service.method') */
    dataResolver: string;
    
    /** TTL du cache en secondes */
    cacheTTL: number;
    
    /** Stratégie de rafraîchissement */
    refreshStrategy: RefreshStrategy;
    
    /** Scope par établissement */
    etablissementScope: boolean;
    
    /** Module d'origine */
    module: string;
    
    /** Icône (Lucide React) */
    icon?: string;
    
    /** Poids/complexité (1-10) pour optimisation */
    complexite?: number;
    
    /** Configuration par défaut */
    defaultConfig?: Record<string, any>;
    
    /** Widget premium ? */
    premium?: boolean;
}

/**
 * Contexte d'exécution d'un widget
 */
export interface DashboardContext {
    /** ID de l'utilisateur */
    userId: string;
    
    /** ID de l'établissement actif */
    etablissementId?: string;
    
    /** Période (ex: 'T1', 'T2', 'annee') */
    periode?: string;
    
    /** Année scolaire */
    anneeScolaire?: string;
    
    /** Filtres additionnels */
    filters?: Record<string, any>;
}

/**
 * Réponse de données d'un widget
 */
export interface WidgetDataResponse {
    /** Données du widget */
    data: any;
    
    /** Horodatage */
    timestamp: Date;
    
    /** Prochain rafraîchissement (timestamp ms) */
    nextRefresh: number;
    
    /** Données en cache ? */
    cached: boolean;
    
    /** Métadonnées */
    metadata?: {
        total?: number;
        periode?: string;
        etablissementId?: string;
        [key: string]: any;
    };
}

/**
 * Configuration d'un widget pour un utilisateur
 */
export interface UserWidgetConfig {
    /** ID du widget */
    id: string;
    
    /** Visible ? */
    visible: boolean;
    
    /** Ordre d'affichage */
    ordre: number;
    
    /** Position (grille) */
    position: { x: number; y: number };
    
    /** Taille (grille) */
    taille: { width: number; height: number };
    
    /** Configuration personnalisée */
    config?: Record<string, any>;
}

/**
 * Layout de dashboard complet
 */
export interface DashboardLayout {
    /** ID du layout */
    id: string;
    
    /** ID utilisateur */
    userId: string;
    
    /** ID établissement (null = global) */
    etablissementId?: string;
    
    /** Nom du layout */
    nom: string;
    
    /** Widgets configurés */
    widgets: UserWidgetConfig[];
    
    /** Actif ? */
    actif: boolean;
    
    /** Créé le */
    createdAt: Date;
    
    /** Modifié le */
    updatedAt: Date;
}

/**
 * Statistiques de performance du dashboard
 */
export interface DashboardPerformanceStats {
    /** Temps de résolution moyen (ms) */
    avgResolutionTime: number;
    
    /** Taux de hit du cache (%) */
    cacheHitRate: number;
    
    /** Widgets les plus lents */
    slowestWidgets: Array<{
        id: string;
        avgTime: number;
        calls: number;
    }>;
    
    /** Total appels */
    totalCalls: number;
    
    /** Erreurs */
    errors: number;
}
