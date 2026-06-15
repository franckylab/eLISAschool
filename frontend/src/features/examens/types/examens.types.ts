/**
 * ==================================
 * eLISAschool - Types Examens
 * ==================================
 */

export interface Examen {
    id: string;
    titre: string;
    type: 'examen' | 'interrogation' | 'composition' | 'concours' | 'autre';
    matiereId: string;
    classeId: string;
    enseignantId: string;
    dateExamen: string;
    heureDebut: string;
    heureFin: string;
    duree: number; // en minutes
    coefficient: number;
    description?: string;
    programme?: string;
    salle?: string;
    statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
    etablissementId: string;
    anneeScolaireId: string;
    createdAt: string;
    updatedAt: string;
    matiere?: {
        id: string;
        nom: string;
        code: string;
    };
    classe?: {
        id: string;
        nom: string;
        code: string;
    };
    enseignant?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface CreerExamenDto {
    titre: string;
    type: string;
    matiereId: string;
    classeId: string;
    enseignantId: string;
    dateExamen: string;
    heureDebut: string;
    heureFin: string;
    coefficient: number;
    description?: string;
    programme?: string;
    salle?: string;
    anneeScolaireId: string;
}

export interface ResultatExamen {
    id: string;
    examenId: string;
    eleveId: string;
    note: number;
    remarque?: string;
    classeParEleve?: number;
    classeParTotal?: number;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
}

export interface StatistiquesExamen {
    totalExamens: number;
    parType: { type: string; nombre: number; }[];
    parStatut: { statut: string; nombre: number; }[];
    moyenneGenerale: number;
    tauxReussite: number;
    evolutionMensuelle: {
        mois: string;
        nombre: number;
        moyenne: number;
    }[];
}

export interface ExamenFiltres {
    classeId?: string;
    matiereId?: string;
    type?: string;
    statut?: string;
    recherche?: string;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    limit?: number;
}
