export type NiveauResponsabilite = 'DIRECTION_GENERALE' | 'DIRECTION_ADJOINTE' | 'RESPONSABLE' | 'COORDINATEUR' | 'SUPERVISEUR' | 'EXECUTANT' | 'STAGIAIRE';
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
    intitulé: string;
    description?: string;
    code: string;
    typePersonnelId?: string;
    typePersonnel?: TypePersonnelLite;
    niveauResponsabilite: NiveauResponsabilite;
    statut: StatutPoste;
    actif: boolean;
    uniteOrganisationnelleId: string;
    fonctionId?: string;
    fonction?: { id: string; nom: string; code: string };
    occupantId?: string;
    occupant?: { id: string; nom: string; prenom: string };
    occupantNom?: string;
    nombrePostes: number;
    occupantsCount: number;
    modeRemunerationDefaut?: string;
    competencesRequises?: string[];
    missions?: string[];
    metadata?: Record<string, any>;
    uniteOrganisationnelle?: { id: string; nom: string; code: string };
    createdAt: string;
    updatedAt: string;
}

export interface CreatePosteDto {
    intitulé: string;
    description?: string;
    code: string;
    typePersonnelId?: string;
    niveauResponsabilite?: NiveauResponsabilite;
    fonctionId?: string;
    uniteOrganisationnelleId: string;
    occupantId?: string;
    occupantNom?: string;
    nombrePostes?: number;
    modeRemunerationDefaut?: string;
    competencesRequises?: string[];
    missions?: string[];
    metadata?: Record<string, any>;
}

export type UpdatePosteDto = Partial<CreatePosteDto>;

export interface PosteFiltres {
    page?: number;
    limit?: number;
    search?: string;
    typePersonnelId?: string;
    statut?: StatutPoste;
    fonctionId?: string;
    uniteOrganisationnelleId?: string;
    vacant?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
