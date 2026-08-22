/**
 * ==================================
 * eLISAschool - Types Promotions v5.0
 * ==================================
 *
 * Types partagés pour le système de promotions multi-scopes
 * (plan, pack, module, package, quota) avec cascade, paliers
 * de volume, auto-promotions et planification.
 *
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 */

// =============================================
// ENUMS
// =============================================

export enum TypePromotion {
    POURCENTAGE = 'POURCENTAGE',
    MONTANT_FIXE = 'MONTANT_FIXE',
    GRATUITE = 'GRATUITE',
}

export enum ScopePromotion {
    PLAN = 'PLAN',
    PACK = 'PACK',
    MODULE = 'MODULE',
    PACKAGE = 'PACKAGE',
    /** Remise sur une ressource quota spécifique (élèves, stockage, SMS…) */
    QUOTA = 'QUOTA',
}

/** Types de promotions automatiques contextuelles */
export enum TypeAutoPromotion {
    /** Aucune — promotion manuelle (défaut) */
    MANUELLE = 'MANUELLE',
    /** Nouveau client (premier abonnement) */
    NOUVEAU_CLIENT = 'NOUVEAU_CLIENT',
    /** Fidélité (ancienneté minimum) */
    FIDELITE = 'FIDELITE',
    /** Upgrade de plan (cross-sell) */
    UPGRADE = 'UPGRADE',
    /** Cross-sell pack→pack ou module→module */
    CROSS_SELL = 'CROSS_SELL',
    /** Free trial module premium (N mois) */
    FREE_TRIAL = 'FREE_TRIAL',
}

export enum DureeApplicationPromotion {
    PREMIERE_FACTURE = 'PREMIERE_FACTURE',
    N_CYCLES = 'N_CYCLES',
    PERMANENTE = 'PERMANENTE',
    N_MOIS_GRATUIT = 'N_MOIS_GRATUIT',
}

export enum TypeRemisePackage {
    POURCENTAGE = 'POURCENTAGE',
    MONTANT_FIXE = 'MONTANT_FIXE',
}

// =============================================
// TYPES JSONB
// =============================================

export interface ConditionsPromotion {
    nombreElevesMin?: number;
    ancienneteMois?: number;
    plansRequis?: string[];
    packsRequis?: string[];
    modulesRequis?: string[];
    ressourceCible?: string;
    nbCycles?: number;
    dureeGratuiteMois?: number;
}

/** Palier de volume pour dégressivité */
export interface PalierVolume {
    /** Quantité minimum (ex: 50 élèves) */
    min: number;
    /** Quantité maximum (null = illimité) */
    max: number | null;
    /** Valeur du palier (% ou montant fixe) */
    valeur: number;
}

export interface ConfigPromotion {
    prixOriginalPackage?: number;
    reductionPackage?: number;
    noteInterne?: string;
    /** Paliers de volume pour dégressivité (scope=QUOTA ou PACK) */
    paliersVolume?: PalierVolume[];
    /** Ressource ciblée pour scope=QUOTA (ex: 'eleves', 'stockageGo', 'sms') */
    quotaRessource?: string;
    /** Type de déclencheur automatique */
    typeAutomatique?: TypeAutoPromotion;
    /** Configuration du déclencheur (jours essai, mois fidélité, etc.) */
    declencheur?: Record<string, unknown>;
}

// =============================================
// ENTITÉS
// =============================================

export interface Promotion {
    id: string;
    code: string;
    nom: string;
    typePromotion: TypePromotion;
    scope: ScopePromotion;
    cibleId?: string | null;
    cibleRessource?: string | null;
    valeur: number;
    dureeApplication: DureeApplicationPromotion;
    conditions?: ConditionsPromotion | null;
    config?: ConfigPromotion | null;
    cumulable: boolean;
    priorite: number;
    codeCoupon?: string | null;
    maxUtilisations?: number | null;
    utilisations: number;
    dateDebut: string;
    dateFin?: string | null;
    /** Activation/désactivation */
    actif: boolean;
    /** Promotion programmée (activée automatiquement à dateProgrammation) */
    estProgrammee: boolean;
    /** Date d'activation programmée */
    dateProgrammation?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PackagePromotion {
    id: string;
    code: string;
    nom: string;
    description?: string;
    packIds: string[];
    typeRemise: TypeRemisePackage;
    valeur: number;
    codeCoupon?: string | null;
    dateDebut: string;
    dateFin?: string | null;
    maxUtilisations?: number | null;
    utilisations: number;
    actif: boolean;
    priorite: number;
    createdAt: string;
    updatedAt: string;
}

// =============================================
// RÉSULTATS CASCADE
// =============================================

export interface LignePromotionResult {
    promotionId: string;
    code: string;
    type: TypePromotion;
    scope: ScopePromotion;
    valeur: number;
    montantDeduit: number;
    moisGratuite?: number;
}

export interface ResultatCascadePromotions {
    montantFinal: number;
    montantAvantPromotions: number;
    plan: { montantAvant: number; montantApres: number; promotions: LignePromotionResult[] };
    packs: { montantAvant: number; montantApres: number; promotions: LignePromotionResult[] };
    quota: { montantAvant: number; montantApres: number; promotions: LignePromotionResult[] };
    modules: { montantAvant: number; montantApres: number; promotions: LignePromotionResult[] };
    gratuités: LignePromotionResult[];
    toutesPromotions: LignePromotionResult[];
}

// =============================================
// HELPERS D'AFFICHAGE
// =============================================

export const SCOPE_LABELS: Record<ScopePromotion, string> = {
    [ScopePromotion.PLAN]: 'Plan',
    [ScopePromotion.PACK]: 'Pack quota',
    [ScopePromotion.MODULE]: 'Module',
    [ScopePromotion.PACKAGE]: 'Package',
    [ScopePromotion.QUOTA]: 'Ressource quota',
};

export const SCOPE_COLORS: Record<ScopePromotion, string> = {
    [ScopePromotion.PLAN]: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    [ScopePromotion.PACK]: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    [ScopePromotion.MODULE]: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    [ScopePromotion.PACKAGE]: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    [ScopePromotion.QUOTA]: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
};

/** Labels pour les types d'auto-promotion */
export const AUTO_PROMO_LABELS: Record<TypeAutoPromotion, string> = {
    [TypeAutoPromotion.MANUELLE]: 'Manuelle',
    [TypeAutoPromotion.NOUVEAU_CLIENT]: 'Nouveau client',
    [TypeAutoPromotion.FIDELITE]: 'Fidélité',
    [TypeAutoPromotion.UPGRADE]: 'Upgrade',
    [TypeAutoPromotion.CROSS_SELL]: 'Cross-sell',
    [TypeAutoPromotion.FREE_TRIAL]: 'Essai gratuit',
};

/** Couleurs pour les types d'auto-promotion */
export const AUTO_PROMO_COLORS: Record<TypeAutoPromotion, string> = {
    [TypeAutoPromotion.MANUELLE]: 'text-[var(--color-texte-muted)]',
    [TypeAutoPromotion.NOUVEAU_CLIENT]: 'text-sky-400',
    [TypeAutoPromotion.FIDELITE]: 'text-amber-400',
    [TypeAutoPromotion.UPGRADE]: 'text-violet-400',
    [TypeAutoPromotion.CROSS_SELL]: 'text-emerald-400',
    [TypeAutoPromotion.FREE_TRIAL]: 'text-pink-400',
};

/** Ressources quota disponibles */
export const QUOTA_RESSOURCES = [
    { value: 'eleves', label: 'Élèves' },
    { value: 'stockageGo', label: 'Stockage (Go)' },
    { value: 'sms', label: 'SMS' },
    { value: 'emails', label: 'Emails' },
    { value: 'bandePassante', label: 'Bande passante' },
] as const;

export const TYPE_LABELS: Record<TypePromotion, string> = {
    [TypePromotion.POURCENTAGE]: 'Pourcentage',
    [TypePromotion.MONTANT_FIXE]: 'Montant fixe',
    [TypePromotion.GRATUITE]: 'Gratuité',
};

export const TYPE_COLORS: Record<TypePromotion, string> = {
    [TypePromotion.POURCENTAGE]: 'text-sky-400',
    [TypePromotion.MONTANT_FIXE]: 'text-orange-400',
    [TypePromotion.GRATUITE]: 'text-green-400',
};

export const DUREE_LABELS: Record<DureeApplicationPromotion, string> = {
    [DureeApplicationPromotion.PREMIERE_FACTURE]: '1ère facture',
    [DureeApplicationPromotion.N_CYCLES]: 'N cycles',
    [DureeApplicationPromotion.PERMANENTE]: 'Permanente',
    [DureeApplicationPromotion.N_MOIS_GRATUIT]: 'N mois gratuit',
};

/** Formate la valeur d'une promotion pour l'affichage */
export function formaterValeurPromotion(type: TypePromotion, valeur: number): string {
    switch (type) {
        case TypePromotion.POURCENTAGE:
            return `−${valeur}%`;
        case TypePromotion.MONTANT_FIXE:
            return `−${valeur.toLocaleString('fr-FR')} F`;
        case TypePromotion.GRATUITE:
            return 'Gratuit';
    }
}

// =============================================
// STATISTIQUES D'UTILISATION
// =============================================

export interface PromotionUtiliseeRecord {
    id: string;
    promotionId: string;
    etablissementId: string;
    factureId?: string | null;
    codePromotion: string;
    scope: string;
    montantDeduit: number;
    dateUtilisation: string;
    createdAt: string;
}

export interface AggregationPromotion {
    code: string;
    scope: string;
    nbUtilisations: string;
    montantTotalDeduit: string;
}

export interface ResumeStatsUsage {
    totalDeduit: number;
    totalUtilisations: number;
    nbPromotionsDistinctes: number;
}

export interface UsageStatsResponse {
    historique: PromotionUtiliseeRecord[];
    parPromotion: AggregationPromotion[];
    resume: ResumeStatsUsage;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// =============================================
// ANALYTICS AVANCÉES
// =============================================

export interface RepartitionScope {
    scope: string;
    montantDeduit: number;
    nbUtilisations: number;
    pourcentage: number;
}

export interface EvolutionMensuelle {
    mois: string; // YYYY-MM
    montantDeduit: number;
    nbUtilisations: number;
}

export interface TopPromotion {
    code: string;
    nom: string;
    scope: string;
    montantDeduit: number;
    nbUtilisations: number;
}

export interface RepartitionAutoPromo {
    type: string;
    nbPromotions: number;
}

export interface TauxActivite {
    promotionsActives: number;
    promotionsUtilisees30j: number;
    tauxActivation: number;
}

export interface PromotionsAnalytics {
    repartitionScope: RepartitionScope[];
    evolutionMensuelle: EvolutionMensuelle[];
    topPromotions: TopPromotion[];
    repartitionAutoPromo: RepartitionAutoPromo[];
    tauxActivite: TauxActivite;
}
