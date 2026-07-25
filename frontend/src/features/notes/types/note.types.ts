/**
 * ==================================
 * eLISAschool - Types Notes
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Types alignés sur le backend (module notes v2) :
 * - GET /api/notes (pagination + filtres + recherche)
 * - GET /api/notes/statistiques (query params)
 * - POST /api/notes/bulk (saisie en masse)
 */

export type TypeEvaluation =
    | 'DEVOIR'
    | 'INTERROGATION'
    | 'EXAMEN'
    | 'PROJET'
    | 'PARTICIPATION'
    | 'AUTRE';

export type StatutNote = 'BROUILLON' | 'VALIDEE' | 'PUBLIEE';

export interface Note {
    id: string;
    eleveId: string;
    matiereId: string;
    classeAnneeId: string;
    anneeScolaireId?: string;
    periodeId: string;
    enseignantId?: string;
    valeur: number;
    bareme?: number;
    coefficient?: number;
    typeEvaluation: TypeEvaluation;
    commentaire?: string;
    description?: string;
    dateEvaluation?: string;
    statut?: StatutNote;
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
    periode?: {
        id: string;
        nom: string;
    };
    classeAnnee?: {
        id: string;
        classe?: { id: string; nom: string; niveau?: string };
        anneeScolaire?: { id: string; nom?: string; libelle?: string; anneeDebut?: number };
    };
}

export interface CreerNoteDto {
    eleveId: string;
    matiereId: string;
    classeAnneeId: string;
    periodeId: string;
    typeEvaluation: TypeEvaluation;
    valeur: number;
    bareme?: number;
    coefficient?: number;
    commentaire?: string;
    description?: string;
    dateEvaluation?: string;
}

/**
 * DTO de saisie en masse — POST /api/notes/bulk.
 * Le contexte (matière/classe/période/type/barème/coefficient) est commun,
 * chaque ligne porte l'élève, la valeur et un commentaire optionnel.
 */
export interface CreerNotesEnMasseDto {
    matiereId: string;
    classeAnneeId: string;
    periodeId: string;
    typeEvaluation?: TypeEvaluation;
    description?: string;
    bareme?: number;
    coefficient?: number;
    dateEvaluation?: string;
    notes: {
        eleveId: string;
        valeur: number;
        commentaire?: string;
    }[];
}

/**
 * DTO de modification — les identifiants structurants
 * (eleveId/matiereId/classeAnneeId/periodeId) ne sont pas modifiables côté backend.
 */
export interface ModifierNoteDto {
    id: string;
    typeEvaluation?: TypeEvaluation;
    valeur?: number;
    bareme?: number;
    coefficient?: number;
    commentaire?: string;
    description?: string;
    dateEvaluation?: string;
    statut?: StatutNote;
}

export interface NoteFiltres {
    eleveId?: string;
    matiereId?: string;
    classeAnneeId?: string;
    periodeId?: string;
    typeEvaluation?: string;
    statut?: string;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * Filtres du endpoint GET /api/notes/statistiques (tous optionnels).
 */
export interface StatistiquesNotesFiltres {
    periodeId?: string;
    classeAnneeId?: string;
    matiereId?: string;
    eleveId?: string;
}

/**
 * Réponse de GET /api/notes/statistiques.
 */
export interface StatistiquesNotes {
    nombreNotes: number;
    moyenne: number;
    mediane: number;
    min: number;
    max: number;
    ecartType: number;
    distribution: {
        tranche: string;
        count: number;
    }[];
    parType: {
        typeEvaluation: TypeEvaluation;
        count: number;
        moyenne: number;
    }[];
    parStatut: {
        statut: StatutNote;
        count: number;
    }[];
}
