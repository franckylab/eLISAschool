/**
 * ==================================
 * eLISAschool - Types Note
 * ==================================
 */

export interface Note {
    id: string;
    eleveId: string;
    matiereId: string;
    classeAnneeId: string;
    periodeId: string;
    enseignantId: string;
    valeur: number;
    coefficient?: number;
    type: 'composition' | 'interrogation' | 'exercice' | 'projet' | 'autre';
    remarque?: string;
    dateEvaluation?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
    matiere?: {
        id: string;
        nom: string;
        code: string;
        coefficient?: number;
    };
    enseignant?: {
        id: string;
        nom: string;
        prenom: string;
    };
    classeAnnee?: {
        id: string;
        classe: { id: string; nom: string; niveau: string };
        anneeScolaire: { id: string; nom: string; anneeDebut: number };
    };
}

export interface CreerNoteDto {
    eleveId: string;
    matiereId: string;
    periodeId: string;
    valeur: number;
    coefficient?: number;
    type: 'composition' | 'interrogation' | 'exercice' | 'projet' | 'autre';
    remarque?: string;
    dateEvaluation?: string;
}

export interface CreerNoteEnMasseDto {
    eleveIds: string[];
    matiereId: string;
    periodeId: string;
    notes: {
        eleveId: string;
        valeur: number;
        coefficient?: number;
        type?: string;
        remarque?: string;
    }[];
}

export interface ModifierNoteDto extends Partial<CreerNoteDto> {
    id: string;
}

export interface NoteFiltres {
    eleveId?: string;
    matiereId?: string;
    periodeId?: string;
    enseignantId?: string;
    type?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface StatistiquesNotes {
    moyenneClasse: number;
    moyenneGenerale: number;
    noteMax: number;
    noteMin: number;
    totalNotes: number;
    distribution: {
        tranche: string;
        nombre: number;
        pourcentage: number;
    }[];
}
