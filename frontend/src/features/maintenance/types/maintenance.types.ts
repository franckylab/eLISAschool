/**
 * ==================================
 * eLISAschool - Types Maintenance
 * ==================================
 */

export interface Intervention {
    id: string;
    titre: string;
    description: string;
    type: 'preventive' | 'corrective' | 'amelioration';
    priorite: 'basse' | 'moyenne' | 'haute' | 'urgente';
    statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
    equipementId?: string;
    demandeurId?: string;
    technicienId?: string;
    datePlanification: string;
    dateDebut?: string;
    dateFin?: string;
    cout?: number; // FCFA
    observations?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    technicien?: {
        id: string;
        nom: string;
        prenom: string;
    };
    demandeur?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface Equipement {
    id: string;
    nom: string;
    description?: string;
    localisation?: string;
    marque?: string;
    modele?: string;
    numeroSerie?: string;
    dateAcquisition?: string;
    dureeVie: number; // années
    derniereMaintenance?: string;
    prochaineMaintenance?: string;
    statut: 'actif' | 'maintenance' | 'hors_service';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerInterventionDto {
    titre: string;
    description: string;
    type: string;
    priorite: string;
    equipementId?: string;
    datePlanification: string;
    technicienId?: string;
}

export interface StatistiquesMaintenance {
    totalInterventions: number;
    parStatut: { statut: string; nombre: number; }[];
    parType: { type: string; nombre: number; }[];
    parPriorite: { priorite: string; nombre: number; }[];
    interventionsEnCours: number;
    coutTotal: number;
    evolutionMensuelle: {
        mois: string;
        interventions: number;
        cout: number;
    }[];
}

export interface FiltresMaintenance {
    statut?: string;
    type?: string;
    priorite?: string;
    technicienId?: string;
    dateDebut?: string;
    dateFin?: string;
}
