/**
 * ==================================
 * eLISAschool - Types Organisation
 * ==================================
 */

export interface GroupeEtablissement {
    id: string;
    nom: string;
    code: string;
    description?: string;
    type: 'pedagogique' | 'administratif' | 'activite' | 'autre';
    etablissementId: string;
    responsableId?: string;
    nombreMembres?: number;
    statut?: 'actif' | 'inactif';
    createdAt: string;
    updatedAt: string;
    responsable?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface MembreGroupe {
    id: string;
    groupeId: string;
    utilisateurId: string;
    role?: 'responsable' | 'membre';
    dateAdhesion: string;
    utilisateur?: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
    };
}

export interface CreerGroupeDto {
    nom: string;
    code: string;
    description?: string;
    type: 'pedagogique' | 'administratif' | 'activite' | 'autre';
    responsableId?: string;
}

export interface GroupeFiltres {
    type?: string;
    statut?: 'actif' | 'inactif';
    actif?: boolean;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
