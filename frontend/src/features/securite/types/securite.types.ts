/**
 * ==================================
 * eLISAschool - Types Sécurité
 * ==================================
 */

export interface Incident {
    id: string;
    titre: string;
    description: string;
    type: 'intrusion' | 'degradation' | 'vol' | 'agression' | 'accident' | 'malaise' | 'autre';
    gravite: 'mineure' | 'moderee' | 'grave' | 'critique';
    statut: 'signale' | 'en_cours' | 'resolu' | 'archive';
    lieu: string;
    dateIncident: string;
    declareParId?: string;
    traiteParId?: string;
    dateResolution?: string;
    temoins?: string[];
    mesuresPrises?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    declarePar?: {
        id: string;
        nom: string;
        prenom: string;
    };
    traitePar?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface Ronde {
    id: string;
    date: string;
    horaireDebut: string;
    horaireFin?: string;
    agentId: string;
    itineraire: string[]; // points de contrôle
    observations?: string;
    anomalies: string[];
    statut: 'planifiee' | 'en_cours' | 'terminee';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    agent?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface CreerIncidentDto {
    titre: string;
    description: string;
    type: string;
    gravite: string;
    lieu: string;
    dateIncident: string;
    temoins?: string[];
}

export interface StatistiquesSecurite {
    totalIncidents: number;
    parStatut: { statut: string; nombre: number; }[];
    parType: { type: string; nombre: number; }[];
    parGravite: { gravite: string; nombre: number; }[];
    incidentsEnCours: number;
    delaiMoyenResolution: number; // heures
    evolutionMensuelle: {
        mois: string;
        incidents: number;
    }[];
}

export interface FiltresSecurite {
    type?: string;
    gravite?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
}
