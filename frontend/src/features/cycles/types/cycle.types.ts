/**
 * ==================================
 * eLISAschool - Types Cycle
 * ==================================
 */

export interface Cycle {
    id: string;
    nom: string;
    code: string;
    description?: string;
    ordre: number;
    etablissementId: string;
    statut?: 'actif' | 'inactif';
    createdAt: string;
    updatedAt: string;
    nombreNiveaux?: number;
}

export interface CreerCycleDto {
    nom: string;
    code: string;
    description?: string;
    ordre: number;
    statut?: 'actif' | 'inactif';
}

export interface ModifierCycleDto extends Partial<CreerCycleDto> {
    id: string;
}

export interface CycleFiltres {
    recherche?: string;
    statut?: 'actif' | 'inactif';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
