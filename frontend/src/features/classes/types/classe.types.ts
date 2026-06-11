/**
 * ==================================
 * eLISAschool - Types Classe
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface Classe {
    id: string;
    nom: string;
    code: string;
    niveau: string;
    cycle?: string;
    capaciteMax?: number;
    etablissementId: string;
    anneeScolaireId: string;
    salle?: string;
    statut?: 'actif' | 'inactif';
    createdAt: string;
    updatedAt: string;
    effectif?: number;
    principalId?: string;
    principal?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface CreerClasseDto {
    nom: string;
    code: string;
    niveau: string;
    cycle?: string;
    capaciteMax?: number;
    anneeScolaireId: string;
    salle?: string;
    statut?: 'actif' | 'inactif';
    principalId?: string;
}

export interface ModifierClasseDto extends Partial<CreerClasseDto> {
    id: string;
}

export interface ClasseFiltres {
    anneeScolaireId?: string;
    niveau?: string;
    cycle?: string;
    recherche?: string;
    statut?: 'actif' | 'inactif';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
