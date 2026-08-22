/**
 * ==================================
 * eLISAschool - Interface Clôturable
 * ==================================
 * Contrat commun pour les entités du modèle académique
 * pouvant être clôturées et réouvertes (AnneeScolaire, Periode).
 *
 * Chaque service implémente sa propre logique de clôture
 * (cascade, impacts, validation workflow) tout en respectant
 * ce contrat de base.
 */

/**
 * Statuts possibles pour une entité clôturable.
 * Aligné sur StatutAnneeScolaire et StatutPeriode.
 */
export type StatutCloturable =
    | 'OUVERTE'
    | 'EN_COURS'
    | 'EN_ATTENTE_CLOTURE'
    | 'CLOTUREE';

/**
 * Contrat pour les entités pouvant être clôturées/réouvertes.
 *
 * Implémenté par :
 * - AnneeScolaire (4 statuts : OUVERTE, EN_COURS, EN_ATTENTE_CLOTURE, CLOTUREE)
 * - Periode (3 statuts : OUVERTE, EN_ATTENTE_CLOTURE, CLOTUREE)
 *
 * Chaque service concret gère :
 * - Les vérifications pré-clôture (impacts, cascade, enfants)
 * - Le workflow de validation (si configuré)
 * - L'audit logging
 * - Les effets de bord (cascade sur périodes enfants, etc.)
 */
export interface ICloturable {
    /** Identifiant unique */
    id: string;

    /** Statut workflow courant */
    statut: StatutCloturable;

    /** Nom/libellé de l'entité (pour logs et messages) */
    nomOuLibelle: string;
}

/**
 * Options communes pour la clôture.
 */
export interface CloturerOptions {
    /** Identifiant du créateur (pour audit + workflow) */
    createurId?: string;

    /** Forcer la clôture même si des impacts bloquants existent */
    forcer?: boolean;

    /** Commentaire optionnel (pour workflow validation) */
    commentaire?: string;
}

/**
 * Résultat de la vérification des impacts avant clôture.
 */
export interface ImpactsCloture {
    /** True si des éléments bloquent la clôture */
    bloquant: boolean;

    /** Message explicatif (si bloquant) */
    message: string;

    /** Nombre d'éléments impactés */
    nombreImpacts: number;
}
