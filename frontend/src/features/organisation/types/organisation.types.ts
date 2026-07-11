import type { Poste } from '@/features/postes/types/poste.types';

export type TypeOrganisation = 'ETABLISSEMENT_SCOLAIRE' | 'GROUPE_SCOLAIRE' | 'ENTREPRISE' | 'ASSOCIATION';
export type StatutOrganisation = 'ACTIF' | 'EN_CREATION' | 'ARCHIVE';

export type TypeUnite = 'DIRECTION' | 'DEPARTEMENT' | 'SERVICE' | 'POLE' | 'FILIERE' | 'CYCLE' | 'SECTION' | 'COMMISSION' | 'EQUIPE' | 'AUTRE';
export type StatutUnite = 'ACTIF' | 'EN_CREATION' | 'EN_RESTRUCTURATION' | 'ARCHIVE';

export type TypeRelationHierarchique = 'SUPERVISE_DIRECT' | 'SUPERVISE_INDIRECT' | 'RATTACHEMENT_FONCTIONNEL' | 'COLLABORATION' | 'REMPLACEMENT' | 'INTERIM';
export type StatutRelation = 'ACTIVE' | 'HISTORIQUE' | 'PLANIFIEE';

// ==================== ORGANISATION ====================

export interface Organisation {
    id: string;
    nom: string;
    description?: string;
    type: TypeOrganisation;
    logoUrl?: string;
    code?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    siteWeb?: string;
    statut: StatutOrganisation;
    actif: boolean;
    etablissementId?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    unites?: UniteOrganisationnelle[];
}

export interface CreerOrganisationDto {
    nom: string;
    description?: string;
    type?: TypeOrganisation;
    logoUrl?: string;
    code?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    siteWeb?: string;
    etablissementId?: string;
    metadata?: Record<string, any>;
}

export type ModifierOrganisationDto = Partial<CreerOrganisationDto>;

// ==================== UNITÉ ORGANISATIONNELLE ====================

export interface UniteOrganisationnelle {
    id: string;
    nom: string;
    description?: string;
    type: TypeUnite;
    code: string;
    statut: StatutUnite;
    actif: boolean;
    organisationId: string;
    parentId?: string;
    ordre: number;
    responsableNom?: string;
    responsableId?: string;
    localisation?: string;
    telephone?: string;
    email?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    organisation?: Organisation;
    parent?: UniteOrganisationnelle;
    enfants?: UniteOrganisationnelle[];
    postes?: Poste[];
}

export interface CreerUniteDto {
    nom: string;
    description?: string;
    type: TypeUnite;
    code: string;
    organisationId: string;
    parentId?: string;
    ordre?: number;
    responsableNom?: string;
    responsableId?: string;
    localisation?: string;
    telephone?: string;
    email?: string;
    metadata?: Record<string, any>;
}

export type ModifierUniteDto = Partial<CreerUniteDto>;

export interface UniteFiltres {
    organisationId?: string;
    type?: TypeUnite;
    actif?: boolean;
    parentId?: string | null;
}

// ==================== HIÉRARCHIE ====================

export interface HierarchiePersonnel {
    id: string;
    personnelId: string;
    personnelNom: string;
    superieurId: string;
    superieurNom: string;
    typeRelation: TypeRelationHierarchique;
    statut: StatutRelation;
    actif: boolean;
    posteId?: string;
    posteIntitule?: string;
    uniteOrganisationnelleId?: string;
    uniteNom?: string;
    etablissementId: string;
    dateDebut?: string;
    dateFin?: string;
    commentaire?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface CreerHierarchieDto {
    personnelId: string;
    personnelNom: string;
    superieurId: string;
    superieurNom: string;
    typeRelation?: TypeRelationHierarchique;
    posteId?: string;
    posteIntitule?: string;
    uniteOrganisationnelleId?: string;
    uniteNom?: string;
    etablissementId: string;
    dateDebut?: string;
    dateFin?: string;
    commentaire?: string;
    metadata?: Record<string, any>;
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
    ordre: number;
    postes: Poste[];
    enfants: OrganigrammeNode[];
}

// ==================== STATISTIQUES ====================

export interface StatistiquesOrganisation {
    totalUnites: number;
    totalPostes: number;
    postesActifs: number;
    postesVacants: number;
    tauxOccupation: number;
    parType: Record<string, number>;
}

// ==================== CONFIGURATION ====================

export interface ParametreConfiguration {
    cle: string;
    libelle: string;
    description: string;
    categorie: string;
    type: 'number' | 'string' | 'boolean';
    valeur: any;
    valeurParDefaut: any;
    modifiable: boolean;
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

export interface TemplateOrganisation {
    id: string;
    nom: string;
    description?: string;
    structure: any;
    etablissementId?: string | null;
    estSysteme: boolean;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GenererOrganisationDto {
    templateId?: string;
    structure?: any;
    organisationId: string;
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
    arborescence: any;
}

// ==================== FILTRES GÉNÉRIQUES ====================

export interface OrganisationFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    type?: TypeOrganisation;
    statut?: StatutOrganisation;
}
