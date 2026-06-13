/**
 * ==================================
 * eLISAschool - Types Types de Cycles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface TypeCycle {
    id: string;
    nom: string;
    code: string;
    description?: string;
    dureeAnnees?: number;
    ordre: number;
    diplomeSanctionnant?: string;
    actif: boolean;
    nbCycles?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreerTypeCycleDto {
    nom: string;
    code?: string;
    description?: string;
    dureeAnnees?: number;
    ordre: number;
}

export interface ModifierTypeCycleDto {
    nom?: string;
    description?: string;
    dureeAnnees?: number;
    ordre?: number;
    actif?: boolean;
}

export interface TypeCycleFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    actif?: boolean;
}
