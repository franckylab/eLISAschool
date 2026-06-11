/**
 * ==================================
 * eLISAschool - Types Niveau
 * ==================================
 */

export interface Niveau {
    id: string;
    nom: string;
    code: string;
    description?: string;
    ordre: number;
    cycleId: string;
    etablissementId: string;
    statut?: 'actif' | 'inactif';
    createdAt: string;
    updatedAt: string;
    cycle?: {
        id: string;
        nom: string;
        code: string;
    };
    nombreClasses?: number;
}

export interface CreerNiveauDto {
    nom: string;
    code: string;
    description?: string;
    ordre: number;
    cycleId: string;
    statut?: 'actif' | 'inactif';
}

export interface ModifierNiveauDto extends Partial<CreerNiveauDto> {
    id: string;
}

export interface NiveauFiltres {
    cycleId?: string;
    recherche?: string;
    statut?: 'actif' | 'inactif';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
