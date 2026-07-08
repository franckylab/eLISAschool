export type ProgrammeType = 'CYCLE' | 'NIVEAU' | 'PERSONNALISE';

export interface ProgrammePedagogique {
    id: string;
    nom: string;
    code: string;
    description: string | null;
    type: ProgrammeType;
    cycleId: string | null;
    niveauId: string | null;
    nbHeuresHebdo: number;
    objectifsGeneraux: string | null;
    competencesVisees: string[] | null;
    periodeId: string | null;
    dateDebut: string | null;
    dateFin: string | null;
    actif: boolean;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    cycle?: { id: string; nom: string };
    niveau?: { id: string; nom: string; code: string };
    matieres?: ProgrammeMatiere[];
    nbHeuresCalculees?: number;
}

export interface ProgrammeMatiere {
    id: string;
    programmeId: string;
    matiereNiveauId: string;
    coefficient: number | null;
    volumeHoraire: number | null;
    obligatoire: boolean;
    ordre: number;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    matiereNiveau?: {
        id: string;
        matiereId: string;
        niveauId: string;
        coefficient: number;
        bareme: number;
        volumeHoraire: number | null;
        obligatoire: boolean;
        matiere?: { id: string; nom: string; code: string; couleur: string };
        niveau?: { id: string; nom: string; code: string; ordre: number };
        groupe?: { id: string; nom: string; ordre: number };
        filiere?: { id: string; nom: string; code: string };
    };
    programme?: { id: string; nom: string; code: string; actif: boolean };
}

export type StatutChapitre = 'ACTIF' | 'EN_ATTENTE_VALIDATION' | 'INACTIF';

export interface ProgrammeChapitre {
    id: string;
    programmeMatiereId: string;
    periodeId: string | null;
    titre: string;
    description: string | null;
    objectifsPedagogiques: string | null;
    ordre: number;
    dureePrevueHeures: number | null;
    prerequis: string[] | null;
    progressionPourcentage: number;
    ressourcesPedagogiques: RessourcePedagogique[] | null;
    competencesAssociees: string[] | null;
    statut: StatutChapitre;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    programmeMatiere?: ProgrammeMatiere;
    periode?: { id: string; nom: string };
    programmeId?: string | null;
    programmeNom?: string | null;
}

export interface RessourcePedagogique {
    type: 'MANUEL' | 'VIDEO' | 'DOCUMENT' | 'LIEN';
    titre: string;
    url?: string;
    description?: string;
}

export interface CreerProgrammeDto {
    nom: string;
    code?: string;
    description?: string;
    type?: ProgrammeType;
    cycleId?: string;
    niveauId?: string;
    nbHeuresHebdo?: number;
    objectifsGeneraux?: string;
    competencesVisees?: string[];
    periodeId?: string;
    dateDebut?: string;
    dateFin?: string;
    actif?: boolean;
}

export interface ModifierProgrammeDto extends Partial<CreerProgrammeDto> {
    id: string;
}

export interface QueryProgrammesDto {
    page?: number;
    limit?: number;
    search?: string;
    cycleId?: string;
    niveauId?: string;
    type?: ProgrammeType;
    actif?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface AddMatiereProgrammeDto {
    matiereNiveauId: string;
    coefficient?: number;
    volumeHoraire?: number;
    obligatoire?: boolean;
    ordre?: number;
}

export interface UpdateMatiereProgrammeDto {
    coefficient?: number;
    volumeHoraire?: number;
    obligatoire?: boolean;
    ordre?: number;
}

export type ProgrammeFiltres = QueryProgrammesDto;

export type AddMatiereDto = AddMatiereProgrammeDto;

export interface CreerChapitreDto {
    programmeMatiereId: string;
    periodeId?: string;
    titre: string;
    description?: string;
    objectifsPedagogiques?: string;
    ordre?: number;
    dureePrevueHeures?: number;
    statut?: StatutChapitre;
}

export interface ModifierChapitreDto extends Partial<CreerChapitreDto> {
    id: string;
    programmeMatiereId?: undefined;
}
