/**
 * ==================================
 * eLISAschool - Types Atelier
 * ==================================
 */

export interface Atelier {
    id: string;
    nom: string;
    description?: string;
    type: 'manuel' | 'artistique' | 'technique' | 'sportif' | 'musical' | 'cuisine' | 'autre';
    responsableId?: string;
    capacite: number;
    lieu?: string;
    horaire?: string;
    tarif?: number; // FCFA
    materielRequis: string[];
    statut: 'actif' | 'complet' | 'suspendu';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    responsable?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface InscriptionAtelier {
    id: string;
    atelierId: string;
    eleveId: string;
    dateInscription: string;
    statut: 'actif' | 'termine' | 'abandonne';
    presence: number; // pourcentage
    evaluation?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    atelier?: Atelier;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        classe?: string;
    };
}

export interface SeanceAtelier {
    id: string;
    atelierId: string;
    date: string;
    horaireDebut: string;
    horaireFin: string;
    sujet: string;
    present: string[]; // IDs élèves
    absent: string[];
    observations?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerAtelierDto {
    nom: string;
    type: string;
    description?: string;
    capacite: number;
    lieu?: string;
    horaire?: string;
    tarif?: number;
    materielRequis?: string[];
}

export interface StatistiquesAtelier {
    totalAteliers: number;
    totalInscriptions: number;
    parType: { type: string; nombre: number; }[];
    tauxParticipation: number; // pourcentage
    ateliersPopulaires: {
        atelier: string;
        inscriptions: number;
        tauxPresence: number;
    }[];
    evolutionMensuelle: {
        mois: string;
        inscriptions: number;
    }[];
}

export interface FiltresAtelier {
    type?: string;
    statut?: string;
    eleveId?: string;
}
