/**
 * ==================================
 * eLISAschool — Platform Groupes SaaS · Types
 * ==================================
 * Source unique de vérité côté Control Plane pour /platform/groupes.
 * Aligné sur GroupeSaaSService (soft delete, audit, single-groupe).
 */

export interface GroupeMembreLien {
    id: string;
    etablissementId: string;
    etablissement?: {
        id: string;
        nom: string;
        ville?: string;
        codeEtablissement?: string;
    };
}

export interface GroupeSaaS {
    id: string;
    nom: string;
    code: string;
    description?: string;
    actif: boolean;
    proprietaireId: string;
    etablissements?: GroupeMembreLien[];
    creeAt: string;
    majAt?: string;
}

export interface EtablissementOption {
    id: string;
    nom: string;
    ville?: string;
    codeEtablissement?: string;
}

export interface ModuleCatalogueOption {
    id: string;
    code: string;
    nom: string;
    categorie?: string;
    ordre?: number;
}

export interface ModuleGroupeOverride {
    id: string;
    groupeEtablissementId: string;
    moduleCatalogueId: string;
    actif: boolean;
    module?: ModuleCatalogueOption;
}

export type GroupeTabId = 'membres' | 'modules' | 'promotions' | 'consolidee' | 'baremes';

export interface PromotionApercu {
    id: string;
    code: string;
    nom: string;
    typePromotion: 'POURCENTAGE' | 'MONTANT_FIXE' | 'GRATUITE';
    valeur: number;
    scope: 'PLAN' | 'PACK' | 'MODULE' | 'QUOTA' | 'GRATUITE';
}

export interface GroupeFormValues {
    nom: string;
    code: string;
    description?: string;
    actif: boolean;
}

export function nbMembres(groupe: GroupeSaaS): number {
    return groupe.etablissements?.length ?? 0;
}

/**
 * Dégressivité groupe selon le nombre de membres — barème unique partagé
 * avec le backend (BaremeGroupeService, `billing.remise_groupe.paliers`).
 * Côté frontend, préférer les paliers effectifs lus depuis l'API
 * (useBaremesGlobal/useBaremesGroupe) + tauxPourPaliers() ; ce barème
 * codé ne sert que de repli hors-ligne.
 */
export const DEFAUT_PALIERS_GROUPE: Array<{ minMembres: number; remisePct: number }> = [
    { minMembres: 2, remisePct: 5 },
    { minMembres: 4, remisePct: 10 },
    { minMembres: 6, remisePct: 15 },
    { minMembres: 11, remisePct: 20 },
    { minMembres: 21, remisePct: 25 },
];

/** Taux applicable pour N membres (fonction pure partagée — affichage/simulateur). */
export function tauxPourPaliers(
    paliers: Array<{ minMembres: number; remisePct: number }>,
    nombreMembres: number,
): number {
    let taux = 0;
    for (const palier of [...paliers].sort((a, b) => a.minMembres - b.minMembres)) {
        if (nombreMembres >= palier.minMembres) taux = palier.remisePct;
    }
    return taux;
}

export function degressiviteGroupe(nombreMembres: number): number {
    return tauxPourPaliers(DEFAUT_PALIERS_GROUPE, nombreMembres);
}

export function initiales(nom: string): string {
    return nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export interface ConsolidatedStats {
    nombreMembres: number;
    montantTotalMois: number;
    degressivite: number;
    economieMois: number;
    facturesMois: number;
    montantTotalHT: number;
    montantTotalTVA: number;
    montantTotalTTC: number;
    repartitionParPlan: Array<{ plan: string; count: number }>;
    facturesRecentes: Array<{
        id: string;
        numero: string;
        etablissement: string;
        date: string;
        montant: number;
        statut: string;
    }>;
}
