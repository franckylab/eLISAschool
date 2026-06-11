/**
 * ==================================
 * eLISAschool - Types Congés
 * ==================================
 */

export interface Conge {
    id: string;
    type: 'annuel' | 'maladie' | 'maternite' | 'paternite' | 'deuil' | 'formation' | 'sans_solde' | 'autre';
    demandeurId: string;
    dateDebut: string;
    dateFin: string;
    nombreJours: number;
    motif: string;
    statut: 'en_attente' | 'accepte' | 'refuse' | 'annule';
    valideParId?: string;
    dateValidation?: string;
    motifRefus?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    demandeur?: {
        id: string;
        nom: string;
        prenom: string;
        poste?: string;
    };
    validePar?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface CreerCongeDto {
    type: string;
    dateDebut: string;
    dateFin: string;
    motif: string;
}

export interface StatistiquesConges {
    totalDemandes: number;
    parType: { type: string; nombre: number; }[];
    parStatut: { statut: string; nombre: number; }[];
    enAttente: number;
    acceptes: number;
    evolutionMensuelle: {
        mois: string;
        demandes: number;
        joursTotal: number;
    }[];
}

export interface CongeFiltres {
    type?: string;
    statut?: string;
    demandeurId?: string;
    dateDebut?: string;
    dateFin?: string;
}
