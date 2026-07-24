export interface Note {
    id: string;
    eleveId: string;
    matiereId: string;
    classeAnneeId: string;
    periodeId: string;
    enseignantId: string;
    valeur: number;
    bareme?: number;
    coefficient?: number;
    typeEvaluation: 'DEVOIR' | 'INTERROGATION' | 'EXAMEN' | 'PROJET' | 'PARTICIPATION' | 'AUTRE';
    commentaire?: string;
    description?: string;
    dateEvaluation?: string;
    statut?: 'BROUILLON' | 'VALIDEE' | 'PUBLIEE';
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
    classeAnneeId: string;
    typeEvaluation: 'DEVOIR' | 'INTERROGATION' | 'EXAMEN' | 'PROJET' | 'PARTICIPATION' | 'AUTRE';
    valeur: number;
    bareme?: number;
    coefficient?: number;
    commentaire?: string;
    description?: string;
    dateEvaluation?: string;
}

export interface CreerNoteEnMasseDto {
    matiereId: string;
    classeAnneeId: string;
    periodeId: string;
    typeEvaluation?: string;
    bareme?: number;
    coefficient?: number;
    notes: {
        eleveId: string;
        valeur: number;
        commentaire?: string;
    }[];
}

export interface ModifierNoteDto extends Partial<CreerNoteDto> {
    id: string;
    statut?: string;
}

export interface NoteFiltres {
    eleveId?: string;
    matiereId?: string;
    classeAnneeId?: string;
    periodeId?: string;
    enseignantId?: string;
    typeEvaluation?: string;
    statut?: string;
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