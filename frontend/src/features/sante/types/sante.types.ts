/**
 * ==================================
 * eLISAschool - Types Santé
 * ==================================
 */

export interface DossierMedical {
    id: string;
    eleveId: string;
    groupeSanguin?: string;
    allergies?: string;
    maladiesChroniques?: string;
    traitementsEnCours?: string;
    antecedentsMedicaux?: string;
    vaccins?: Vaccin[];
    medecinTraitant?: string;
    telephoneUrgence?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
}

export interface Vaccin {
    id: string;
    dossierId: string;
    nom: string;
    dateAdministration: string;
    dateRappel?: string;
    lot?: string;
}

export interface VisiteInfirmerie {
    id: string;
    eleveId: string;
    dateVisite: string;
    motif: string;
    diagnostic?: string;
    soinsProdigues?: string;
    orientation?: 'retour_classe' | 'renvoi_domicile' | 'hopital' | 'autre';
    infirmierId?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
    infirmier?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface CreerVisiteDto {
    eleveId: string;
    dateVisite: string;
    motif: string;
    diagnostic?: string;
    soinsProdigues?: string;
    orientation?: 'retour_classe' | 'renvoi_domicile' | 'hopital' | 'autre';
}

export interface VisitesFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    dateDebut?: string;
    dateFin?: string;
    orientation?: string;
}

export interface StatistiquesSante {
    totalVisites: number;
    totalDossiers: number;
    parOrientation: {
        orientation: string;
        nombre: number;
    }[];
    motifsFrequents: {
        motif: string;
        nombre: number;
    }[];
    evolutionMensuelle: {
        mois: string;
        nombre: number;
    }[];
}
