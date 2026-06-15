/**
 * ==================================
 * eLISAschool - Types Statistiques
 * ==================================
 */

export interface StatistiquesGlobales {
    eleves: {
        total: number;
        actifs: number;
        nouveaux: number;
        parClasse: { classe: string; nombre: number; }[];
        parNiveau: { niveau: string; nombre: number; }[];
    };
    personnel: {
        total: number;
        actifs: number;
        parType: { type: string; nombre: number; }[];
    };
    finances: {
        totalRecettes: number;
        totalDepenses: number;
        benefice: number;
        impayes: number;
        evolutionMensuelle: { mois: string; recettes: number; depenses: number; }[];
    };
    pedagogique: {
        moyenneGenerale: number;
        tauxReussite: number;
        parMatiere: { matiere: string; moyenne: number; }[];
    };
    vieScolaire: {
        totalAbsences: number;
        totalRetards: number;
        totalSanctions: number;
        evolutionMensuelle: { mois: string; absences: number; retards: number; }[];
    };
}

export interface StatistiquesPeriodiques {
    periode: string;
    dateDebut: string;
    dateFin: string;
    indicateurs: {
        nom: string;
        valeur: number;
        unite: string;
        evolution: number; // pourcentage
    }[];
}

export interface FiltresStatistiques {
    periode?: 'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee' | 'personnalisee';
    dateDebut?: string;
    dateFin?: string;
    etablissementId?: string;
    typeStat?: 'eleves' | 'personnel' | 'finances' | 'pedagogique' | 'vieScolaire';
    classeId?: string;
    typePersonnelId?: string;
    typePaiement?: string;
    type?: string;
    matiereId?: string;
}
