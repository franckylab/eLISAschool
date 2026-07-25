export type StatutUnite = 'ACTIF' | 'EN_CREATION' | 'EN_RESTRUCTURATION' | 'ARCHIVE';
export type StatutRelation = 'ACTIVE' | 'HISTORIQUE' | 'PLANIFIEE';
export type TypeRelationHierarchique = 'DIRECT' | 'FONCTIONNEL';

// ==================== ÉCHELON STRUCTUREL ====================

export interface EchelonStructurel {
    id: string;
    niveau: number;
    code: string;
    label: string;
    couleur?: string;
    description?: string;
    estSysteme: boolean;
    etablissementId?: string;
    createdAt: string;
    updatedAt: string;
}

// ==================== UNITÉ ORGANISATIONNELLE ====================

export interface UniteOrganisationnelle {
    id: string;
    nom: string;
    description?: string;
    echelonStructurelId?: string;
    echelonStructurel?: EchelonStructurel;
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
    echelonStructurelId?: string;
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

export interface HierarchiePersonneRef {
    id: string;
    matricule?: string;
    utilisateur?: {
        profil?: {
            nom?: string;
            prenom?: string;
        };
    };
}

export interface HierarchiePosteRef {
    id: string;
    intitule?: string;
    code?: string;
    uniteOrganisationnelle?: {
        id: string;
        nom: string;
        code?: string;
    };
}

export interface HierarchiePersonnel {
    id: string;
    personnelId?: string | null;
    superieurId?: string | null;
    typeRelation: TypeRelationHierarchique;
    statut: StatutRelation;
    actif: boolean;
    posteId?: string | null;
    superieurPosteId?: string | null;
    etablissementId?: string;
    dateDebut?: string;
    dateFin?: string;
    commentaire?: string;
    createdAt: string;
    updatedAt: string;
    personnel?: HierarchiePersonneRef | null;
    superieur?: HierarchiePersonneRef | null;
    poste?: HierarchiePosteRef | null;
    superieurPoste?: HierarchiePosteRef | null;
}

export interface CreerHierarchieDto {
    personnelId?: string;
    superieurId?: string;
    typeRelation?: TypeRelationHierarchique;
    statut?: StatutRelation;
    posteId?: string;
    superieurPosteId?: string;
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
    statut: string;
    description?: string;
    responsableNom?: string;
    localisation?: string;
    echelonStructurelId?: string;
    echelonStructurelLabel?: string;
    echelonStructurelCouleur?: string;
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
    categorie?: string;
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
    // Répartition par échelon structurel
    parEchelon: Record<string, number>;
    parEchelonDetails: Array<{
        echelonId: string;
        label: string;
        code: string;
        couleur?: string;
        count: number;
    }>;
}

// ==================== NOMENCLATURES ====================

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
        echelonCode?: string;
        parentRef?: string;
        ordre?: number;
        postes?: Array<{
            ref: string;
            intitule: string;
            code: string;
            nombrePostes?: number;
            fonctionCode?: string;
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
    nomEn?: string;
    description?: string;
    structure: TemplateStructure;
    etablissementId?: string | null;
    estSysteme: boolean;
    actif: boolean;
    // Catégorisation (v5.1)
    nature?: NatureJuridique;
    systeme?: SystemeEducatif;
    langue?: LangueEnseignement;
    niveaux?: NiveauEnseignement[];
    complexite?: ComplexiteStructurelle;
    categorie?: string;
    ordre?: number;
    icone?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

// ==================== CATÉGORISATION TEMPLATES (v5.1) ====================

export enum NatureJuridique {
    PUBLIC_ETATIQUE = 'PUBLIC_ETATIQUE',
    PUBLIC_COMMUNAL = 'PUBLIC_COMMUNAL',
    PRIVE_LAIC = 'PRIVE_LAIC',
    PRIVE_CONFESSIONNEL = 'PRIVE_CONFESSIONNEL',
    PRIVE_ASSOCIATIF = 'PRIVE_ASSOCIATIF',
    COMPLEXE = 'COMPLEXE',
}

export enum SystemeEducatif {
    GENERAL = 'GENERAL',
    TECHNIQUE = 'TECHNIQUE',
    PROFESSIONNEL = 'PROFESSIONNEL',
    NORMAL = 'NORMAL',
    SUPERIEUR = 'SUPERIEUR',
}

export enum LangueEnseignement {
    FRANCOPHONE = 'FRANCOPHONE',
    ANGLOPHONE = 'ANGLOPHONE',
    BILINGUE = 'BILINGUE',
}

export enum NiveauEnseignement {
    MATERNEL = 'MATERNEL',
    PRIMAIRE = 'PRIMAIRE',
    COLLEGE = 'COLLEGE',
    LYCEE = 'LYCEE',
    POST_BAC = 'POST_BAC',
}

export enum ComplexiteStructurelle {
    STANDARD = 'STANDARD',
    AVANCE = 'AVANCE',
}

export interface TemplateFiltres {
    nature?: string;
    systeme?: string;
    langue?: string;
    niveau?: string;
    complexite?: string;
    categorie?: string;
    search?: string;
    actif?: boolean;
    page?: number;
    limit?: number;
}

export interface CombinaisonsValides {
    natures: string[];
    systemes: string[];
    langues: string[];
    niveaux: string[];
    complexites: string[];
    categories: string[];
    compteurs: Record<string, number>;
}

export interface GenererOrganisationDto {
    templateId?: string;
    structure?: TemplateStructure;
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
    arborescence: unknown[];
}

// ==================== VALIDATION ARBORESCENCE ====================

export interface ValidationArborescence {
    valide: boolean;
    erreurs: string[];
    avertissements: string[];
    statistiques: {
        totalUnites: number;
        totalPostes: number;
        unitesSansPoste: number;
        profondeurMax: number;
    };
}
