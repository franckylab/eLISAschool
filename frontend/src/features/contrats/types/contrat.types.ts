export type ModeRemuneration = 'MENSUEL' | 'HORAIRE' | 'MIXTE' | 'HEBDOMADAIRE';

export interface PostePartial {
    id: string;
    intitulé: string;
    code: string;
    uniteOrganisationnelle?: { id: string; nom: string };
    fonction?: { id: string; nom: string };
}

export interface ContratPersonnel {
    id: string;
    membrePersonnelId: string;
    typeContrat: string;
    typeContratId?: string | null;
    fonctionId?: string | null;
    fonction?: { id: string; nom: string; code?: string } | null;
    posteId?: string | null;
    poste?: PostePartial | null;
    dateDebut: string;
    dateFin?: string | null;
    salaireBase: number;
    tarifHoraire?: number | null;
    modeRemuneration?: ModeRemuneration | null;
    heuresContractuellesMois?: number | null;
    tarifHebdomadaire?: number | null;
    statut: string;
    renouvellementAuto?: boolean;
    clauses?: string | null;
    membrePersonnel?: {
        id: string;
        matricule: string;
        utilisateur?: {
            id: string;
            email: string;
            profil?: { nom: string; prenom: string };
        };
    };
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface TypeContratPersonnalise {
    id: string;
    code: string;
    nom: string;
    description?: string;
    categorie: string;
    modeRemuneration: ModeRemuneration;
    actif: boolean;
    estSysteme: boolean;
    ordre: number;
    renouvellementAutoDefaut: boolean;
    dureeMaxMois?: number;
    etablissementId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ContratFilters {
    membrePersonnelId?: string;
    typeContrat?: string;
    statut?: string;
    posteId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
