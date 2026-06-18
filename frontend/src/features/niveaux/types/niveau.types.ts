/**
 * ==================================
 * eLISAschool - Types Niveau
 * ==================================
 */

export interface Niveau {
    id: string;
    nom: string;
    code?: string;
    cycleId: string;
    filiereId?: string;
    examenNationalId?: string;
    estClasseExamen: boolean;
    sousSysteme: string;
    ordre: number;
    actif: boolean;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    cycle?: {
        id: string;
        nom: string;
        code: string;
    };
    filiere?: {
        id: string;
        nom: string;
        code: string;
    };
    examenNational?: {
        id: string;
        nom: string;
        code: string;
    };
    nombreClasses?: number;
}

export interface CreerNiveauDto {
    nom: string;
    code?: string;
    cycleId: string;
    filiereId?: string;
    examenNationalId?: string;
    estClasseExamen?: boolean;
    sousSysteme?: string;
    ordre: number;
    actif?: boolean;
}

export interface ModifierNiveauDto extends Partial<CreerNiveauDto> {
    id: string;
}

export interface NiveauFiltres {
    cycleId?: string;
    recherche?: string;
    sousSysteme?: string;
    actif?: boolean;
    estClasseExamen?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
