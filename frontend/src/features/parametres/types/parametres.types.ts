/**
 * ==================================
 * eLISAschool - Types Paramètres Système
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

/**
 * Catégorie de paramètre
 */
export enum CategorieParametre {
    SYSTEME = 'SYSTEME',
    SECURITE = 'SECURITE',
    ETABLISSEMENT = 'ETABLISSEMENT',
    MODULE = 'MODULE',
    THEME = 'THEME',
    NOTIFICATION = 'NOTIFICATION',
    REGIONAL = 'REGIONAL',
    CUSTOM = 'CUSTOM',
}

/**
 * Type de valeur du paramètre
 */
export enum TypeValeurParametre {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    JSON = 'JSON',
    ARRAY = 'ARRAY',
}

/**
 * Interface Paramètre Système
 */
export interface ParametreSysteme {
    id: string;
    cle: string;
    valeur: string; // JSON stringifié
    typeValeur: TypeValeurParametre;
    categorie: CategorieParametre;
    module?: string;
    etablissementId?: string;
    description?: string;
    valeurDefaut?: string;
    modifiableRuntime: boolean;
    visible: boolean;
    ordre: number;
    validation?: string;
    options?: { value: string; label: string }[];
    createdAt: string;
    updatedAt: string;
}

/**
 * DTO Création paramètre
 */
export interface CreateParametreDto {
    cle: string;
    valeur: any;
    typeValeur?: TypeValeurParametre;
    categorie?: CategorieParametre;
    module?: string;
    description?: string;
    modifiableRuntime?: boolean;
    visible?: boolean;
    ordre?: number;
    validation?: string;
    options?: { value: string; label: string }[];
    etablissementId?: string;
}

/**
 * DTO Modification paramètre
 */
export interface UpdateParametreDto {
    valeur?: any;
    description?: string;
    visible?: boolean;
    ordre?: number;
    options?: { value: string; label: string }[];
}

/**
 * Filtres pour la recherche de paramètres
 */
export interface ParametreFiltres {
    categorie?: CategorieParametre;
    module?: string;
    modifiableRuntime?: boolean;
    visible?: boolean;
    search?: string;
    etablissementId?: string;
}

/**
 * Paramètre pour affichage UI (valeur parsée)
 */
export interface ParametreUI {
    id: string;
    cle: string;
    valeurParsee: any; // Valeur parsée selon typeValeur
    typeValeur: TypeValeurParametre;
    categorie: CategorieParametre;
    module?: string;
    description?: string;
    valeurDefaut?: string;
    modifiableRuntime: boolean;
    visible: boolean;
    ordre: number;
    validation?: string;
    options?: { value: string; label: string }[];
    estModifie: boolean; // true si valeur !== valeurDefaut
    createdAt: string;
    updatedAt: string;
}

/**
 * Groupe de paramètres par catégorie
 */
export interface GroupeParametres {
    categorie: CategorieParametre;
    label: string;
    icone: string;
    parametres: ParametreUI[];
}

/**
 * Stats des paramètres
 */
export interface ParametresStats {
    total: number;
    parCategorie: Record<CategorieParametre, number>;
    parModule: Record<string, number>;
    modifies: number;
    systeme: number;
}
