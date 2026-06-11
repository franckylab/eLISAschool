/**
 * ==================================
 * eLISAschool - Types Absences
 * ==================================
 */

export interface Absence {
    id: string;
    eleveId: string;
    dateAbsence: string;
    type: 'absence' | 'retard' | 'departure_anticipe';
    statut: 'non_justifiee' | 'justifiee' | 'en_attente';
    motif?: string;
    justificatif?: string;
    signaleParId?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
        classe?: {
            nom: string;
            code: string;
        };
    };
    signalePar?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface CreerAbsenceDto {
    eleveId: string;
    dateAbsence: string;
    type: 'absence' | 'retard' | 'departure_anticipe';
    motif?: string;
}

export interface JustifierAbsenceDto {
    motif: string;
    justificatif?: string;
}

export interface AbsencesFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    type?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
}

export interface StatistiquesAbsences {
    totalAbsences: number;
    totalRetards: number;
    parStatut: {
        statut: string;
        nombre: number;
    }[];
    parType: {
        type: string;
        nombre: number;
    }[];
    tauxAbsentéisme: number;
    evolutionMensuelle: {
        mois: string;
        absences: number;
        retards: number;
    }[];
}
