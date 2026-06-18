/**
 * ==================================
 * eLISAschool - Types Cycle (Refactorisé)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Types refactorisés après suppression de TypeCycle - attributs fusionnés dans Cycle
 */

export interface Cycle {
    id: string;
    nom: string;
    code: string;
    description?: string;
    dureeAnnees?: number;
    diplomeSanctionnant?: string;
    ordre: number;
    actif: boolean;
    nbNiveaux?: number;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerCycleDto {
    nom: string;
    code: string;
    description?: string;
    dureeAnnees?: number;
    diplomeSanctionnant?: string;
    ordre: number;
    actif?: boolean;
}

export interface ModifierCycleDto extends Partial<CreerCycleDto> {
    id: string;
}

export interface CycleFiltres {
    recherche?: string;
    actif?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
