/**
 * ==================================
 * eLISAschool - Types Emploi du Temps
 * ==================================
 */

export interface Creneau {
    id: string;
    jourSemaine: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi';
    heureDebut: string;
    heureFin: string;
    matiereId: string;
    enseignantId: string;
    classeId: string;
    salleId?: string;
    etablissementId: string;
    anneeScolaireId: string;
    createdAt: string;
    updatedAt: string;
    matiere?: {
        id: string;
        nom: string;
        code: string;
        couleur?: string;
    };
    enseignant?: {
        id: string;
        nom: string;
        prenom: string;
    };
    classe?: {
        id: string;
        nom: string;
        code: string;
    };
    salle?: {
        id: string;
        nom: string;
        capacite: number;
    };
}

export interface CreerCreneauDto {
    jourSemaine: string;
    heureDebut: string;
    heureFin: string;
    matiereId: string;
    enseignantId: string;
    classeId: string;
    salleId?: string;
    anneeScolaireId: string;
}

export interface EmploiDuTempsFiltres {
    classeId?: string;
    enseignantId?: string;
    salleId?: string;
    jourSemaine?: string;
}

export interface StatistiquesEmploiDuTemps {
    totalCreneaux: number;
    parJour: { jour: string; nombre: number; }[];
    parMatiere: { matiere: string; nombre: number; }[];
    parEnseignant: { enseignant: string; nombre: number; }[];
    heuresSemaines: number;
    tauxOccupation: number;
}

export interface ConflitCreneau {
    type: 'enseignant' | 'salle' | 'classe';
    creneau1: Creneau;
    creneau2: Creneau;
    description: string;
}
