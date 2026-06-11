/**
 * ==================================
 * eLISAschool - Types Parking
 * ==================================
 */

export interface PlaceParking {
    id: string;
    numero: string;
    type: 'standard' | 'pmr' | 'visiteur' | 'reservation';
    statut: 'libre' | 'occupee' | 'reservee' | 'maintenance';
    vehiculeId?: string;
    abonnementId?: string;
    tarifHoraire?: number; // FCFA
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Vehicule {
    id: string;
    proprietaireId: string;
    immatriculation: string;
    marque?: string;
    modele?: string;
    couleur?: string;
    type: 'voiture' | 'moto' | 'velo' | 'autre';
    placeParkingId?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    proprietaire?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface AbonnementParking {
    id: string;
    titulaireId: string;
    vehiculeId: string;
    dateDebut: string;
    dateFin: string;
    tarif: number; // FCFA/mois
    statut: 'actif' | 'expire' | 'suspendu';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    titulaire?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface CreerAbonnementDto {
    titulaireId: string;
    vehiculeId: string;
    dateDebut: string;
    dateFin: string;
    tarif: number;
}

export interface StatistiquesParking {
    totalPlaces: number;
    placesLibres: number;
    placesOccupees: number;
    tauxOccupation: number; // pourcentage
    totalAbonnements: number;
    abonnementsActifs: number;
    revenusMensuels: number; // FCFA
    evolutionMensuelle: {
        mois: string;
        occupation: number;
        revenus: number;
    }[];
}

export interface FiltresParking {
    type?: string;
    statut?: string;
    proprietaireId?: string;
}
