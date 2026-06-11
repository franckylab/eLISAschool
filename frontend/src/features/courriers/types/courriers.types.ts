/**
 * ==================================
 * eLISAschool - Types Courriers
 * ==================================
 */

export interface Courrier {
    id: string;
    type: 'entrant' | 'sortant' | 'interne';
    objet: string;
    expediteur?: string;
    destinataire: string;
    dateCourrier: string;
    dateReception?: string;
    reference?: string;
    contenu?: string;
    statut: 'nouveau' | 'lu' | 'traite' | 'archive';
    priorite: 'basse' | 'normale' | 'haute' | 'urgente';
    fichierJoint?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    destinateurDetail?: {
        id: string;
        nom: string;
        prenom: string;
        email?: string;
    };
}

export interface CreerCourrierDto {
    type: string;
    objet: string;
    expediteur?: string;
    destinataire: string;
    dateCourrier: string;
    reference?: string;
    contenu?: string;
    priorite: string;
    fichierJoint?: string;
}

export interface StatistiquesCourriers {
    totalCourriers: number;
    parType: { type: string; nombre: number; }[];
    parStatut: { statut: string; nombre: number; }[];
    parPriorite: { priorite: string; nombre: number; }[];
    nonLus: number;
    evolutionMensuelle: {
        mois: string;
        entrants: number;
        sortants: number;
    }[];
}

export interface CourrierFiltres {
    type?: string;
    statut?: string;
    priorite?: string;
    recherche?: string;
    dateDebut?: string;
    dateFin?: string;
}
