/**
 * ==================================
 * eLISAschool - Types partagés Billing
 * ==================================
 * Types unifiés pour les plans d'abonnement, cycles de facturation,
 * stratégies d'expiration et packs de quota.
 *
 * Refonte v4.3 — Élimination des duplications (4 définitions → 1)
 * v3.1 — Types étendus : RemiseAbonnement, MonAbonnement, PackQuotaSouscrit
 *
 * Version: 1.1.0
 * Auteur: franck arlos chendjou
 */

import {
    Shield,
    Zap,
    Sparkles,
    Crown,
    CreditCard,
    Package,
    type LucideIcon,
} from 'lucide-react';

// =============================================
// Plan d'abonnement (JSONB v3)
// =============================================

export interface TarificationPlan {
    prixBase: number;
    prixParEleve: number;
    elevesInclusGratuits: number;
    paliers?: Array<{ seuilEleves: number; prixParEleve: number }>;
}

export interface QuotasPlan {
    eleves?: number;
    utilisateurs?: number;
    classes?: number;
    stockageGo?: number;
    sms?: number;
    [key: string]: number | undefined;
}

export interface EntitlementsPlan {
    modules: string[];
    fonctionnalites: string[];
}

export interface Plan {
    id: string;
    nom: string;
    slug: string;
    description?: string;
    prixBase: number;
    devise: string;
    rang?: number;
    estParDefaut?: boolean;
    visiblePubliquement?: boolean;
    badge?: string;

    // Refonte v3 — champs JSONB
    tarification?: TarificationPlan;
    quotas?: QuotasPlan;
    entitlements?: EntitlementsPlan;
    cyclesAutorises?: string[];
    essai?: { autorise: boolean; dureeJours?: number };

    // Statut
    statut?: string;
    actif: boolean;
}

// =============================================
// Cycle de facturation
// =============================================

export interface CycleFacturation {
    id: string;
    code: string;
    nom: string;
    nomEn?: string | null;
    dureeMois: number;
    remisePourcent: number;
    actif: boolean;
    ordre: number;
}

export type CycleFacturationForm = Omit<CycleFacturation, 'id'>;

// =============================================
// Stratégie d'expiration
// =============================================

export type ComportementPhase = 'READ_ONLY' | 'LOCKED' | 'ARCHIVED';

export interface PhaseExpiration {
    nom: string;
    jours: number | null;
    comportement: ComportementPhase;
}

export interface StrategieExpiration {
    id: string;
    code: string;
    nom: string;
    phases: PhaseExpiration[];
    planSlug?: string | null;
    estDefaut: boolean;
    actif: boolean;
}

export type StrategieExpirationForm = Omit<StrategieExpiration, 'id'>;

// =============================================
// Pack de quota
// =============================================

export type DureeValiditePack = 'CYCLE_COURANT' | 'ILLIMITE';

export interface PackQuota {
    id: string;
    code: string;
    nom: string;
    ressource: string;
    quantite: number;
    prix: number;
    devise: string;
    dureeValidite: DureeValiditePack;
    description?: string | null;
    actif: boolean;
    ordre: number;
}

export type PackQuotaForm = Omit<PackQuota, 'id'>;

// =============================================
// Remise d'abonnement (lecture frontend)
// =============================================

export interface RemiseAbonnement {
    id: string;
    code: string;
    nom: string;
    typeRemise: 'POURCENTAGE' | 'MONTANT_FIXE';
    valeur: number;
    dureeApplication: 'PREMIERE_FACTURE' | 'N_CYCLES' | 'PERMANENTE';
    nbCycles?: number;
    cible: 'GLOBAL' | 'PLAN' | 'TENANT' | 'CYCLE';
    cibleId?: string;
    cibleCycle?: string;
    dateDebut: string;
    dateFin?: string;
    maxUtilisations?: number;
    utilisations: number;
    cumulable: boolean;
    priorite: number;
    codeCoupon?: string;
    conditionElevesMin?: number;
    conditionAncienneteMois?: number;
    actif: boolean;
}

// =============================================
// Pack souscrit (lecture frontend)
// =============================================

export interface PackQuotaSouscrit {
    id: string;
    packId: string;
    pack?: PackQuota;
    dateSouscription: string;
    dateFin?: string;
    montantFacture: number;
    actif: boolean;
}

// =============================================
// Mon Abonnement (dashboard tenant)
// =============================================

export interface MonAbonnement {
    id: string;
    planId: string;
    plan?: Plan;
    etablissementId: string;
    statut: string;
    dateDebut: string;
    dateFin: string;
    cycleFacturation: string;
    autoRenouvellement: boolean;
    montantMensuel: number;
    nombreElevesActuel: number;
    prochaineFacturation: string;
    packsSouscrits?: PackQuotaSouscrit[];
    remisesActives?: RemiseAbonnement[];
    quotasEffectifs?: Record<string, { quotaPlan: number; quotaPacks: number; quotaEffectif: number; utilisation: number }>;
}

// =============================================
// Simulation de tarif
// =============================================

export interface SimulationResult {
    plan: { id: string; nom: string; slug: string };
    nombreEleves: number;
    prixBase: number;
    montantElevesSupplementaires: number;
    coefCycle: number;
    montantHT?: number;
    montantTotal: number;
    devise: string;
    cycleFacturation?: string;
    modulesInclus: string[];
}

// =============================================
// Types utilitaires
// =============================================

export type ViewMode = 'cards' | 'compare' | 'simulator';

export const PLAN_ICONS: Record<string, LucideIcon> = {
    decouverte: Shield,
    gratuit: Shield,
    starter: Zap,
    standard: Sparkles,
    pro: Crown,
    premium: Crown,
    enterprise: CreditCard,
    default: Package,
};

export const RESSOURCES_PACK = ['eleves', 'utilisateurs', 'classes', 'stockageGo', 'sms'] as const;

/** Valeurs de comportement de phase (labels via i18n : cycles.phase.READ_ONLY, etc.) */
export const PHASE_VALUES = ['READ_ONLY', 'LOCKED', 'ARCHIVED'] as const;

/** Cycle facturation codes (labels via i18n) */
export const CYCLE_FACTURATION_CODES = ['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL'] as const;

// =============================================
// Helpers
// =============================================

/** Formate un montant en français */
export function formatPrix(n: number, devise: string = 'XAF'): string {
    return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' ' + devise;
}

/** Calcule le prix pour un cycle donné avec remise */
export function prixCycle(
    plan: Plan,
    cycle: string,
    remises: Record<string, number> = {},
    durees: Record<string, number> = {},
): number {
    const remise = remises[cycle] ?? 0;
    const duree = durees[cycle] ?? 1;
    return Number(plan.prixBase) * duree * (1 - remise / 100);
}

/** Retourne les modules inclus dans un plan */
export function modulesInclus(plan: Plan): string[] {
    const m = plan?.entitlements?.modules;
    return Array.isArray(m) ? m : [];
}

/** Formate le quota élèves (illimité si 0 ou >= 999999) */
export function formatQuotaEleves(plan: Plan, illimiteLabel = 'illimité'): string {
    const max = plan.quotas?.eleves;
    if (max === undefined || max === null || max >= 999999 || max === 0) return illimiteLabel;
    return new Intl.NumberFormat('fr-FR').format(Number(max));
}

/** Retourne l'icône associée à un slug de plan */
export function getPlanIcon(slug: string): LucideIcon {
    return PLAN_ICONS[slug.toLowerCase()] || PLAN_ICONS.default;
}
