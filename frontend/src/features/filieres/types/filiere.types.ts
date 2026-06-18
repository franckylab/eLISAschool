/**
 * ==================================
 * eLISAschool - Types Filières
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface Filiere {
    id: string;
    nom: string;
    code: string;
    description?: string;
    cycleId: string;
    cycle?: {
        id: string;
        nom: string;
        code: string;
    };
    sousSysteme: 'FRANCOPHONE' | 'ANGLOPHONE';
    ordre?: number;
    coefficientFrais?: number;
    etablissementId: string;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreerFiliereDto {
    nom: string;
    code: string;
    description?: string;
    cycleId: string;
    sousSysteme?: 'FRANCOPHONE' | 'ANGLOPHONE';
    actif?: boolean;
}

export interface ModifierFiliereDto {
    nom?: string;
    code?: string;
    description?: string;
    cycleId?: string;
    sousSysteme?: 'FRANCOPHONE' | 'ANGLOPHONE';
    actif?: boolean;
}

export interface FiliereFiltres {
    recherche?: string;
    cycleId?: string;
    sousSysteme?: string;
    actif?: boolean;
    page?: number;
    limit?: number;
}
