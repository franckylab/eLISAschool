export interface ProgrammeMatiere {
    id: string;
    programmeId: string;
    matiereNiveauId: string;
    coefficient: number | null;
    volumeHoraire: number | null;
    obligatoire: boolean;
    ordre: number;
    matiereNiveau?: {
        id: string;
        matiereId: string;
        niveauId: string;
        coefficient: number;
        volumeHoraire: number | null;
        matiere?: { id: string; nom: string; code: string; couleur?: string };
        niveau?: { id: string; nom: string; code: string };
    };
}

export type ProgrammeType = 'CYCLE' | 'NIVEAU' | 'PERSONNALISE';

export interface ProgrammePedagogique {
    id: string;
    nom: string;
    code: string;
    description?: string;
    type: ProgrammeType;
    cycleId?: string;
    cycle?: { id: string; nom: string; code: string };
    cycleNom?: string;
    niveauId?: string;
    niveau?: { id: string; nom: string; code: string };
    niveauNom?: string;
    nbHeuresHebdo: number;
    nbHeuresCalculees?: number;
    objectifsGeneraux?: string;
    competencesVisees?: string[];
    anneeScolaireId?: string;
    dateDebut?: string;
    dateFin?: string;
    actif: boolean;
    etablissementId: string;
    matieres?: ProgrammeMatiere[];
    nbMatieres?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreerProgrammeDto {
    nom: string;
    code?: string;
    description?: string;
    type?: ProgrammeType;
    cycleId?: string | null;
    niveauId?: string | null;
    nbHeuresHebdo?: number;
    objectifsGeneraux?: string;
    competencesVisees?: string[];
    anneeScolaireId?: string | null;
    dateDebut?: string;
    dateFin?: string;
    actif?: boolean;
}

export interface ModifierProgrammeDto extends Partial<CreerProgrammeDto> {}

export interface ProgrammeFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    cycleId?: string;
    niveauId?: string;
    type?: ProgrammeType;
    actif?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface AddMatiereDto {
    matiereNiveauId: string;
    coefficient?: number;
    volumeHoraire?: number;
    obligatoire?: boolean;
    ordre?: number;
}
