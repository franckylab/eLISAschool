export type StatutPoste = 'ACTIF' | 'VACANT' | 'SUPPRIME' | 'EN_ATTENTE';

export interface TypePersonnelLite {
    id: string;
    code: string;
    nom: string;
    estSysteme: boolean;
    actif: boolean;
}

export interface Poste {
    id: string;
    intitule: string;
    description?: string;
    code: string;
    niveauResponsabiliteId?: string;
    niveauResponsabilite?: { id: string; code: string; label: string; niveau: number };
    fonctionId: string;
    fonction?: { id: string; nom: string; code: string; typePersonnel?: TypePersonnelLite };
    statut: StatutPoste;
    actif: boolean;
    uniteOrganisationnelleId: string;
    uniteOrganisationnelle?: { id: string; nom: string; code: string };
    nombrePostes: number;
    occupantsCount: number;
    competencesRequises?: string[];
    missions?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreatePosteDto {
    intitule: string;
    description?: string;
    code: string;
    niveauResponsabiliteId?: string;
    fonctionId: string;
    uniteOrganisationnelleId: string;
    nombrePostes?: number;
    competencesRequises?: string[];
    missions?: string[];
}

export type UpdatePosteDto = Partial<CreatePosteDto>;

export interface PosteFiltres {
    page?: number;
    limit?: number;
    search?: string;
    statut?: StatutPoste;
    fonctionId?: string;
    uniteOrganisationnelleId?: string;
    vacant?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
