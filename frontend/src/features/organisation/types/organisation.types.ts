export type StatutUnite = 'ACTIF' | 'EN_CREATION' | 'EN_RESTRUCTURATION' | 'ARCHIVE';
export type StatutRelation = 'ACTIVE' | 'HISTORIQUE' | 'PLANIFIEE';

// ==================== UNITÉ ORGANISATIONNELLE ====================

export interface UniteOrganisationnelle {
    id: string;
    nom: string;
    description?: string;
    usageUniteId?: string;
    usageUnite?: { id: string; code: string; label: string };
    niveauOrganisationId?: string;
    niveauOrganisation?: { id: string; niveau: number; label: string };
    code: string;
    statut: StatutUnite;
    actif: boolean;
    etablissementId: string;
    parentId?: string;
    ordre: number;
    responsableNom?: string;
    responsableId?: string;
    localisation?: string;
    createdAt: string;
    updatedAt: string;
    parent?: UniteOrganisationnelle;
    enfants?: UniteOrganisationnelle[];
}

export interface CreerUniteDto {
    nom: string;
    description?: string;
    usageUniteId?: string;
    niveauOrganisationId?: string;
    code: string;
    etablissementId: string;
    parentId?: string | null; // null = détacher (racine)
    ordre?: number;
    responsableNom?: string;
    responsableId?: string;
    localisation?: string;
}

export type ModifierUniteDto = Partial<CreerUniteDto>;

export interface UniteFiltres {
    etablissementId?: string;
    actif?: boolean;
    parentId?: string | null;
}

// ==================== HIÉRARCHIE ====================

export interface HierarchiePersonnel {
    id: string;
    personnelId?: string;
    superieurId?: string;
    typeRelationId?: string;
    typeRelation?: { id: string; code: string; label: string };
    statut: StatutRelation;
    actif: boolean;
    posteId?: string;
    uniteOrganisationnelleId?: string;
    etablissementId?: string;
    dateDebut?: string;
    dateFin?: string;
    commentaire?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerHierarchieDto {
    personnelId?: string;
    superieurId?: string;
    typeRelationId?: string;
    posteId?: string;
    uniteOrganisationnelleId?: string;
    etablissementId?: string | null;
    dateDebut?: string;
    dateFin?: string;
    commentaire?: string;
}

export type ModifierHierarchieDto = Partial<CreerHierarchieDto>;

// ==================== ORGANIGRAMME ====================

export interface OrganigrammeNode {
    id: string;
    nom: string;
    code: string;
    type: string;
    statut: string;
    description?: string;
    responsableNom?: string;
    localisation?: string;
    usageUniteLabel?: string;
    niveauOrganisationLabel?: string;
    ordre: number;
    depth: number;
    totalMembres: number;
    postesVacants: number;
    postes: OrganigrammePoste[];
    enfants: OrganigrammeNode[];
}

export interface OrganigrammePoste {
    id: string;
    intitule: string;
    code: string;
    statut: string;
    occupantsCount: number;
    nombrePostes: number;
    fonctionLabel?: string;
    niveauResponsabiliteLabel?: string;
    typePersonnelLabel?: string;
    uniteOrganisationnelleId?: string;
}

export interface ModifierPosteDto {
    uniteOrganisationnelleId?: string;
    intitule?: string;
    code?: string;
    description?: string;
    nombrePostes?: number;
    statut?: string;
    fonctionId?: string;
    categoriePosteId?: string;
    niveauResponsabiliteId?: string;
    missions?: string[];
    competencesRequises?: string[];
    estSuppleant?: boolean;
}

export interface ModeRemuneration {
    id: string;
    code: string;
    label: string;
    description?: string;
    etablissementId?: string | null;
    estSysteme: boolean;
    createdAt: string;
    updatedAt: string;
}

// ==================== STATISTIQUES ====================

export interface StatistiquesOrganisation {
    // Unités
    totalUnites: number;
    unitesActives: number;
    unitesSansPostes: number;
    // Postes
    totalPostes: number;
    postesActifs: number;
    postesOccupes: number;
    postesVacants: number;
    tauxOccupation: number;
    // Hiérarchies
    totalHierarchies: number;
    hierarchiesActives: number;
    // Arborescence
    profondeurMax: number;
    // Répartition
    parUsage: Record<string, number>;
}

// ==================== NOMENCLATURES ====================

export interface NiveauOrganisation {
    id: string;
    niveau: number;
    label: string;
    description?: string;
    etablissementId?: string | null;
    estSysteme: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UsageUnite {
    id: string;
    code: string;
    label: string;
    description?: string;
    etablissementId?: string | null;
    estSysteme: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CategoriePoste {
    id: string;
    code: string;
    label: string;
    description?: string;
    etablissementId?: string | null;
    estSysteme: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NiveauResponsabilite {
    id: string;
    niveau: number;
    code: string;
    label: string;
    description?: string;
    etablissementId?: string | null;
    estSysteme: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TemplateStructure {
    nom?: string;
    unites?: Array<{
        ref: string;
        nom: string;
        code: string;
        typeCode?: string;
        usageCode?: string;
        niveauOrg?: number;
        parentRef?: string;
        ordre?: number;
        postes?: Array<{
            ref: string;
            intitule: string;
            code: string;
            nombrePostes?: number;
            categorieCode?: string;
            niveauRespCode?: string;
            missions?: string[];
            competences?: string[];
        }>;
    }>;
    hierarchies?: Array<{
        subordonneRef: string;
        superieurRef: string;
    }>;
}

export interface TemplateOrganisation {
    id: string;
    nom: string;
    description?: string;
    structure: TemplateStructure;
    etablissementId?: string | null;
    estSysteme: boolean;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GenererOrganisationDto {
    templateId?: string;
    structure?: TemplateStructure;
    etablissementId: string;
    options?: {
        prefixeCode?: string;
        creerHierarchie?: boolean;
        modeConflit?: 'ERROR' | 'SKIP' | 'OVERWRITE';
    };
}

export interface ResultatGeneration {
    unitesCrees: number;
    postesCrees: number;
    hierarchiesCrees: number;
    unites: Array<{ ref: string; id: string; nom: string; code: string }>;
    postes: Array<{ ref: string; id: string; intitule: string; code: string }>;
    hierarchies: Array<{ superieurRef: string; subordonneRef: string; id: string }>;
    arborescence: Record<string, unknown>;
}
