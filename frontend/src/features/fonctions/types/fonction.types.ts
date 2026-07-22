export interface Fonction {
    id: string;
    nom: string;
    code: string;
    description?: string;
    parentId?: string;
    parent?: { id: string; nom: string; code: string };
    enfants?: Fonction[];
    niveau: number;
    chemin?: string;
    typePersonnelId?: string;
    typePersonnel?: { id: string; code: string; nom: string };
    primesDefaut?: Record<string, any>;
    majorationDefaut?: number;
    estSysteme: boolean;
    actif: boolean;
    ordre: number;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerFonctionDto {
    nom: string;
    code: string;
    description?: string;
    parentId?: string | null;
    ordre?: number;
    typePersonnelId?: string | null;
    primesDefaut?: Record<string, any> | null;
    majorationDefaut?: number | null;
    actif?: boolean;
}

export interface ModifierFonctionDto {
    nom?: string;
    code?: string;
    description?: string;
    parentId?: string | null;
    ordre?: number;
    typePersonnelId?: string | null;
    primesDefaut?: Record<string, any> | null;
    majorationDefaut?: number | null;
    actif?: boolean;
}

export interface FonctionFiltres {
    recherche?: string;
    parentId?: string | null;
    actif?: boolean;
    page?: number;
    limit?: number;
}
