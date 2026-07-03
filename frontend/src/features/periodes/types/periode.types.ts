/**
 * ==================================
 * eLISAschool - Types Période (v5.0 — Niveaux de périodicité configurables)
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Refonte v5.0 :
 * - Suppression de l'enum TypePeriode (SEQUENCE, TRIMESTRE, SEMESTRE, ANNEE)
 * - Remplacement par NiveauPeriode (entité configurable par établissement)
 * - Chaque niveau a un label, un niveau hiérarchique et un usageCode
 * - Les usages (UsageNiveau) déterminent les règles métier (NOTES, BULLETIN, etc.)
 */

// =============================================
// STATUT — Inchangé
// =============================================

/**
 * Statut de la période (aligné sur StatutPeriode backend)
 */
export enum StatutPeriode {
    OUVERTE = 'OUVERTE',
    EN_ATTENTE_CLOTURE = 'EN_ATTENTE_CLOTURE',
    CLOTUREE = 'CLOTUREE',
}

// =============================================
// NIVEAUX DE PÉRIODICITÉ — Nouveautés v5.0
// =============================================

/**
 * Niveau de périodicité — configurable par établissement.
 * Remplace l'ancien enum TypePeriode.
 */
export interface NiveauPeriode {
    id: string;
    etablissementId: string;
    /** Niveau hiérarchique (0 = base, 1, 2, 3... = niveaux supérieurs) */
    niveau: number;
    /** Libellé personnalisé — ex: "Séquence", "Trimestre", "Semestre", "Année" */
    label: string;
    /** Code de l'usage associé (FK logique vers UsageNiveau.code) */
    usageCode: string;
    /** Description optionnelle */
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Usage d'un niveau de périodicité — configurable.
 * Usages système (NOTES, BULLETIN, COMPOSITION, ANNEE, AUTRE) + personnalisés.
 */
export interface UsageNiveau {
    id: string;
    /** Code unique (ex: 'NOTES', 'BULLETIN', 'CUSTOM_1') */
    code: string;
    /** Libellé lisible (ex: 'Saisie des notes', 'Génération des bulletins') */
    label: string;
    /** Description optionnelle */
    description?: string | null;
    /** null = usage système (global) */
    etablissementId?: string | null;
    /** Indique si c'est un usage système (non modifiable/supprimable) */
    estSysteme: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// =============================================
// TEMPLATES — Structure récursive (v5.0)
// =============================================

/**
 * Structure récursive d'un nœud de template (v5.0 — niveau + usageCode).
 * Remplace l'ancienne structure avec `type: string`.
 */
export interface NoeudTemplatePeriode {
    /** Niveau hiérarchique (0, 1, 2, 3...) */
    niveau: number;
    /** Code de l'usage (ex: 'NOTES', 'BULLETIN', 'ANNEE') */
    usageCode: string;
    /** Nombre de sous-éléments à générer */
    count: number;
    /** Nom de la période (ex: 'Trimestre 1') */
    nom: string;
    /** Enfants (sous-niveaux) */
    enfants?: NoeudTemplatePeriode[];
}

/**
 * Template de hiérarchie de périodes (v5.0)
 */
export interface TemplatePeriodeEntity {
    id: string;
    nom: string;
    description?: string;
    structure: NoeudTemplatePeriode;
    etablissementId?: string | null;
    estSysteme: boolean;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
    etablissement?: {
        id: string;
        nom: string;
    } | null;
}

// =============================================
// PÉRIODE — Entité principale (v5.0)
// =============================================

/**
 * Composition parent-enfant entre périodes
 */
export interface PeriodeComposition {
    id: string;
    periodeParentId: string;
    periodeEnfantId: string;
    ordre: number;
    poids: number;
    createdAt: string;
    periodeEnfant?: Periode;
}

/**
 * Période scolaire — v5.0 avec niveauId (au lieu de type)
 */
export interface Periode {
    id: string;
    nom: string;
    /** FK vers NiveauPeriode — remplace l'ancien champ type */
    niveauId: string;
    /** Niveau de périodicité (relation chargée si disponible) */
    niveau?: NiveauPeriode;
    anneeScolaireId: string;
    etablissementId: string;
    dateDebut: string;
    dateFin: string;
    statut: StatutPeriode;
    createdAt: string;
    updatedAt: string;
    anneeScolaire?: {
        id: string;
        libelle: string;
        code: string;
    };
    /** Compositions enfants (si chargées via findOne) */
    compositionsEnfants?: PeriodeComposition[];
}

/**
 * Structure arborescente d'une période avec ses enfants (v5.0)
 */
export interface PeriodeArbre {
    id: string;
    nom: string;
    /** FK vers NiveauPeriode */
    niveauId: string;
    /** Niveau de périodicité (relation chargée) */
    niveau?: NiveauPeriode;
    dateDebut: string;
    dateFin: string;
    statut: StatutPeriode;
    anneeScolaireId: string;
    etablissementId: string;
    enfants: PeriodeArbre[];
    createdAt: string;
    updatedAt: string;
}

// =============================================
// DTOs — Créer / Modifier
// =============================================

/**
 * DTO pour créer une période (v5.0 — niveauId au lieu de type)
 */
export interface CreerPeriodeDto {
    nom: string;
    niveauId: string;
    anneeScolaireId: string;
    dateDebut: string;
    dateFin: string;
    enfants?: Array<{
        periodeId: string;
        ordre: number;
        poids: number;
    }>;
}

/**
 * DTO pour modifier une période (v5.0 — niveauId au lieu de type)
 */
export interface ModifierPeriodeDto {
    nom?: string;
    niveauId?: string;
    dateDebut?: string;
    dateFin?: string;
}

/**
 * DTO pour créer une composition
 */
export interface CreerCompositionDto {
    periodeParentId: string;
    periodeEnfantId: string;
    ordre: number;
    poids: number;
}

/**
 * DTO pour modifier une composition
 */
export interface ModifierCompositionDto {
    ordre?: number;
    poids?: number;
}

/**
 * DTO pour générer depuis un template (v5.0)
 */
export interface GenererTemplateDto {
    templateId: string;
    anneeScolaireId: string;
    dateDebut: string;
    dateFin: string;
}

/**
 * DTO pour créer un template personnalisé (v5.0)
 */
export interface CreerTemplatePeriodeDto {
    nom: string;
    description?: string;
    structure: NoeudTemplatePeriode;
}

/**
 * DTO pour modifier un template personnalisé (v5.0)
 */
export interface ModifierTemplatePeriodeDto {
    nom?: string;
    description?: string;
    structure?: NoeudTemplatePeriode;
}

/**
 * DTO pour clôturer une période
 */
export interface CloturerPeriodeDto {
    commentaire?: string;
    forcer?: boolean;
}

/**
 * DTO pour réouvrir une période
 */
export interface ReouvrirPeriodeDto {
    motif: string;
}

/**
 * Résultat de la vérification des impacts avant clôture
 */
export interface ImpactsCloture {
    notes: { count: number; enAttenteValidation: number };
    bulletins: { count: number };
    peutCloturer: boolean;
    bloquant: boolean;
    message: string;
}

/**
 * Filtres pour la liste des périodes
 */
export interface PeriodeFiltres {
    anneeId?: string;
    format?: 'arbre' | 'plat';
}

/**
 * DTO pour remplacer toutes les compositions d'une période
 */
export interface RemplacerCompositionsDto {
    enfants: Array<{
        periodeEnfantId: string;
        ordre: number;
        poids: number;
    }>;
}

// =============================================
// DTOs — Niveaux Période (CRUD)
// =============================================

export interface CreerNiveauPeriodeDto {
    niveau: number;
    label: string;
    usageCode: string;
    description?: string;
}

export interface ModifierNiveauPeriodeDto {
    label?: string;
    usageCode?: string;
    description?: string;
}

export interface ReorderNiveauxDto {
    niveaux: Array<{ id: string; niveau: number }>;
}

export interface ConfigInitialeNiveauxDto {
    niveaux: Array<{
        niveau: number;
        label: string;
        usageCode: string;
        description?: string;
    }>;
}

// =============================================
// DTOs — Usages Niveau (CRUD)
// =============================================

export interface CreerUsageNiveauDto {
    code: string;
    label: string;
    description?: string;
}

export interface ModifierUsageNiveauDto {
    label?: string;
    description?: string;
}

// =============================================
// HELPERS — Résolution dynamique des labels
// =============================================

/**
 * Résoudre le label d'un niveau de période depuis la liste des niveaux chargés.
 * Fallback sur le niveauId si le niveau n'est pas trouvé.
 */
export function getLabelNiveau(niveaux: NiveauPeriode[], niveauId: string): string {
    const niveau = niveaux.find(n => n.id === niveauId);
    return niveau?.label || niveauId?.substring(0, 8) || '—';
}

/**
 * Vérifier si un niveau peut avoir des enfants (niveau > 0).
 * Un niveau 0 (base) ne peut pas avoir d'enfants.
 */
export function niveauPeutAvoirEnfants(niveaux: NiveauPeriode[], niveauId: string): boolean {
    const niveau = niveaux.find(n => n.id === niveauId);
    if (!niveau) return false;
    // Un niveau peut avoir des enfants s'il existe un niveau inférieur
    return niveaux.some(n => n.niveau < niveau.niveau);
}
