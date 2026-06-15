/**
 * ==================================
 * eLISAschool - Types Laboratoire
 * ==================================
 */

export interface Laboratoire {
    id: string;
    nom: string;
    description?: string;
    capacite: number;
    equipements: string[];
    responsableId?: string;
    localisation?: string;
    statut: 'actif' | 'maintenance' | 'ferme';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    responsable?: {
        id: string;
        nom: string;
        prenom: string;
    };
    page?: number;
    limit?: number;
}

export interface ReservationLaboratoire {
    id: string;
    laboratoireId: string;
    demandeurId: string;
    dateDebut: string;
    dateFin: string;
    motif: string;
    classeId?: string;
    matiereId?: string;
    statut: 'en_attente' | 'confirmee' | 'annulee' | 'terminee';
    nombreEleves: number;
    notes?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    laboratoire?: Laboratoire;
    demandeur?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    page?: number;
    limit?: number;
}

export interface Experience {
    id: string;
    titre: string;
    description: string;
    laboratoireId?: string;
    matiereId?: string;
    niveauDifficulte: 'facile' | 'moyen' | 'difficile';
    dureeEstimee: number; // minutes
    materielRequis: string[];
    protocole: string;
    objectifsPedagogiques: string[];
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    page?: number;
    limit?: number;
}

export interface CreerReservationDto {
    laboratoireId: string;
    dateDebut: string;
    dateFin: string;
    motif: string;
    nombreEleves: number;
    classeId?: string;
    matiereId?: string;
    notes?: string;
    page?: number;
    limit?: number;
}

export interface StatistiquesLaboratoire {
    totalLaboratoires: number;
    totalReservations: number;
    reservationsActives: number;
    tauxOccupation: number; // pourcentage
    parLaboratoire: {
        laboratoire: string;
        reservations: number;
        heuresUtilisation: number;
    }[];
    evolutionMensuelle: {
        mois: string;
        reservations: number;
    }[];
    page?: number;
    limit?: number;
}

export interface FiltresLaboratoire {
    laboratoireId?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    limit?: number;
}
