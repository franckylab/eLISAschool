/**
 * ==================================
 * eLISAschool - Types Matière
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface Matiere {
    id: string;
    nom: string;
    code: string;
    description?: string;
    coefficient?: number;
    couleur?: string;
    etablissementId: string;
    statut?: 'actif' | 'inactif';
    createdAt: string;
    updatedAt: string;
    nombreHeures?: number;
    programme?: string;
}

export interface CreerMatiereDto {
    nom: string;
    code: string;
    description?: string;
    coefficient?: number;
    couleur?: string;
    statut?: 'actif' | 'inactif';
    nombreHeures?: number;
    programme?: string;
}

export interface ModifierMatiereDto extends Partial<CreerMatiereDto> {
    id: string;
}

export interface MatiereFiltres {
    recherche?: string;
    statut?: 'actif' | 'inactif';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
