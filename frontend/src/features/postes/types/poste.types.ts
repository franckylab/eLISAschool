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
    categoriePosteId?: string;
    categoriePoste?: { id: string; code: string; label: string };
    niveauResponsabiliteId?: string;
    niveauResponsabilite?: { id: string; code: string; label: string; niveau: number };
    typePersonnelId?: string;
    typePersonnel?: TypePersonnelLite;
    fonctionId?: string;
    fonction?: { id: string; nom: string; code: string };
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
    categoriePosteId?: string;
    niveauResponsabiliteId?: string;
    typePersonnelId?: string;
    fonctionId?: string;
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
    typePersonnelId?: string;
    categoriePosteId?: string;
    statut?: StatutPoste;
    fonctionId?: string;
    uniteOrganisationnelleId?: string;
    vacant?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
