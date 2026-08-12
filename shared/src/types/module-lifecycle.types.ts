/**
 * ==========================================
 * eLISAschool - Interface ModuleLifecycle
 * ==========================================
 *
 * Cycle de vie d'un module plateforme.
 * Permet aux modules d'exécuter des hooks lors de l'activation,
 * la désactivation, ou la montée de version.
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

/**
 * Résultat de la vérification de désactivation.
 */
export interface DeactivationCheck {
    /** La désactivation est-elle autorisée ? */
    allowed: boolean;
    /** Modules qui bloquent la désactivation (dépendants actifs) */
    blockedBy?: string[];
    /** Modules qui seraient affectés en cascade */
    impacted?: string[];
}

/**
 * Contexte passé aux hooks de lifecycle.
 */
export interface LifecycleContext {
    etablissementId: string;
    moduleCode: string;
    userId?: string;
    /** Plan cible (pour onUpgrade) */
    newPlan?: string;
    /** Plan précédent (pour onUpgrade) */
    previousPlan?: string;
}

/**
 * Interface à implémenter par les modules qui souhaitent
 * réagir aux changements de cycle de vie.
 *
 * Chaque module peut optionnellement implémenter cette interface
 * pour exécuter de la logique métier lors de l'activation,
 * la désactivation, ou la montée de version.
 *
 * @example
 * ```typescript
 * export class GamificationLifecycle implements ModuleLifecycle {
 *     async onActivate(ctx: LifecycleContext): Promise<void> {
 *         // Initialiser les tables gamification pour l'établissement
 *     }
 *     async onDeactivate(ctx: LifecycleContext): Promise<void> {
 *         // Archiver les données gamification
 *     }
 *     getDependencies(): string[] {
 *         return ['notes', 'programmes'];
 *     }
 * }
 * ```
 */
export interface ModuleLifecycle {
    /**
     * Hook appelé après l'activation du module pour un établissement.
     * Utilisé pour initialiser des données, créer des tables, etc.
     */
    onActivate(ctx: LifecycleContext): Promise<void>;

    /**
     * Hook appelé avant la désactivation du module.
     * Utilisé pour archiver des données, nettoyer des ressources, etc.
     * Si cette méthode lève une erreur, la désactivation est annulée.
     */
    onDeactivate(ctx: LifecycleContext): Promise<void>;

    /**
     * Hook appelé lors d'une montée de version du plan.
     * Utilisé pour débloquer des fonctionnalités, migrer des données, etc.
     */
    onUpgrade(ctx: LifecycleContext): Promise<void>;

    /**
     * Retourne les codes des modules dont ce module dépend.
     */
    getDependencies(): string[];

    /**
     * Retourne les codes des modules qui dépendent de ce module.
     */
    getDependents(): string[];

    /**
     * Vérifie si ce module peut être désactivé sans casser les dépendants.
     */
    canDeactivate(ctx: LifecycleContext): Promise<DeactivationCheck> | DeactivationCheck;
}

/**
 * Registre des lifecycle handlers par code module.
 * Utilisé par le ModuleLifecycleService pour orchestrer les hooks.
 */
export type ModuleLifecycleRegistry = Map<string, ModuleLifecycle>;
