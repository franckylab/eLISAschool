/**
 * ==================================
 * eLISAschool - Types Cycle
 * ==================================
 */

export interface TypeCycle {
    id: string;
    nom: string;
    code: string;
}

export interface Cycle {
    id: string;
    nom: string;
    code: string;
    typeCycleId?: string;
    typeCycle?: TypeCycle;
    ordre: number;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreerCycleDto {
    nom: string;
    code: string;
    typeCycleId?: string;
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
