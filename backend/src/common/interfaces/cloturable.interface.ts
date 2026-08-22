/**
 * ==================================
 * eLISAschool - Interface Cloturable
 * ==================================
 * Contrat commun pour les entités à cycle de vie fermé
 * (années scolaires, périodes, etc.)
 *
 * Permet d'unifier la logique de vérification pré-clôture
 * et de réouverture à travers les modules.
 */

/**
 * Statuts possibles pour une entité clôturable.
 * Chaque module définit son enum spécifique mais doit
 * pouvoir mapper vers ces états génériques.
 */
export type StatutCloturable = string;

/**
 * Interface Cloturable — contrat pour les services
 * qui gèrent un cycle de vie avec clôture/réouverture.
 *
 * Implémenté par :
 * - AnneesScolairesService (statut: OUVERTE → EN_COURS → EN_ATTENTE_CLOTURE → CLOTUREE)
 * - PeriodesService (statut: OUVERTE → EN_ATTENTE_CLOTURE → CLOTUREE)
 */
export interface Cloturable<TId = string> {
    /**
     * Clôturer l'entité. Vérifications pré-clôture effectuées.
     * @param id - Identifiant de l'entité
     * @param etablissementId - Établissement (multi-tenant)
     * @param createurId - Utilisateur demandeur (optionnel, pour audit)
     */
    cloturer(id: TId, etablissementId: string, createurId?: string): Promise<unknown>;

    /**
     * Réouvrir une entité clôturée.
     * @param id - Identifiant de l'entité
     * @param etablissementId - Établissement (multi-tenant)
     */
    reouvrir(id: TId, etablissementId: string): Promise<unknown>;
}

/**
 * Résultat de la vérification des impacts avant clôture.
 * Utilisé pour informer l'utilisateur avant confirmation.
 */
export interface ImpactsCloture {
    peutCloturer: boolean;
    bloquant: boolean;
    message: string;
    details: Record<string, { count: number; enAttente?: number }>;
}
