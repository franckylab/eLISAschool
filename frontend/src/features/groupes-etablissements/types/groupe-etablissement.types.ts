/**
 * ==================================
 * eLISAschool - Types Groupes d'Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface GroupeEtablissement {
    id: string;
    nom: string;
    description?: string;
    proprietaireId: string;
    code: string;
    actif: boolean;
    nbEtablissements?: number;
    creeAt: string;
    majAt: string;
}

export interface CreerGroupeEtablissementDto {
    nom: string;
    description?: string;
    code?: string;
    etablissementIds?: string[];
}

export interface ModifierGroupeEtablissementDto {
    nom?: string;
    description?: string;
    actif?: boolean;
    etablissementIds?: string[];
}

export interface GroupeEtablissementFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    actif?: boolean;
}
