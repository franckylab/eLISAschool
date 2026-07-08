export type SousSysteme = 'FRANCOPHONE' | 'ANGLOPHONE' | 'BICULTUREL';

export interface Matiere {
    id: string;
    nom: string;
    code: string | null;
    nomAnglais: string | null;
    couleur: string;
    etablissementId: string;
    sousSysteme: SousSysteme | null;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreerMatiereDto {
    nom: string;
    code?: string;
    nomAnglais?: string;
    couleur?: string;
    sousSysteme?: SousSysteme;
    actif?: boolean;
}

export interface ModifierMatiereDto extends Partial<CreerMatiereDto> {
    id: string;
}

export interface MatiereFiltres {
    recherche?: string;
    actif?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    sousSysteme?: SousSysteme | '';
}

export interface MatiereNiveau {
    id: string;
    matiereId: string;
    niveauId: string;
    groupeId: string | null;
    filiereId: string | null;
    coefficient: number;
    credits: number | null;
    bareme: number;
    volumeHoraire: number | null;
    obligatoire: boolean;
    statut: string;
    createdAt: string;
    updatedAt: string;
    matiere?: { id: string; nom: string; code: string; couleur?: string };
    niveau?: { id: string; nom: string; code: string; ordre: number };
    groupe?: { id: string; nom: string; ordre: number };
    filiere?: { id: string; nom: string; code: string };
}

export interface AffectationMatiere {
    id: string;
    matiereId: string;
    classeAnneeId: string;
    enseignantId: string;
    etablissementId: string;
    configurationId: string | null;
    coefficient: number | null;
    statut: string;
    dateDebut: string;
    dateFin: string | null;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
    enseignant?: { id: string; nom: string; prenom: string };
    classeAnnee?: {
        id: string;
        classe: { id: string; nom: string };
        anneeScolaire: { id: string; libelle: string };
    };
}

export interface ConfigurationMatiereClasse {
    id: string;
    matiereId: string;
    classeAnneeId: string;
    etablissementId: string;
    coefficient: number | null;
    bareme: number | null;
    volumeHoraireHebdo: number | null;
    credits: number | null;
    obligatoire: boolean;
    statut: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    classeAnnee?: {
        id: string;
        classe: { id: string; nom: string };
        anneeScolaire: { id: string; libelle: string };
    };
}

// Les types ProgrammePedagogique et ProgrammeMatiere sont définis dans
// features/programmes/types/programme.types.ts (source unique)
import type { ProgrammePedagogique as PP, ProgrammeMatiere as PM } from '@/features/programmes/types/programme.types';
export type ProgrammePedagogique = PP;
/** @deprecated Utilisez ProgrammeMatiere depuis programme.types.ts */
export type ProgrammeMatiereExtended = PM;
