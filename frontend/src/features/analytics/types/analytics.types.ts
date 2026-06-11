/**
 * ==================================
 * eLISAschool - Types Analytics
 * ==================================
 */

export interface KPI {
    id: string;
    nom: string;
    description: string;
    categorie: 'eleves' | 'personnel' | 'finances' | 'pedagogique' | 'vieScolaire' | 'systeme';
    valeur: number;
    objectif?: number;
    unite: string;
    evolution: number; // pourcentage vs période précédente
    tendance: 'hausse' | 'baisse' | 'stable';
    seuilAlerte?: number;
    seuilCritique?: number;
    statut: 'bon' | 'attention' | 'critique';
    derniereMAJ: string;
}

export interface DashboardAnalytics {
    periode: string;
    dateDebut: string;
    dateFin: string;
    kpis: KPI[];
    alertes: {
        id: string;
        kpiId: string;
        kpiNom: string;
        niveau: 'warning' | 'critical';
        message: string;
        dateCreation: string;
    }[];
    tendances: {
        kpi: string;
        donnees: { date: string; valeur: number; }[];
        prevision?: { date: string; valeur: number; }[];
    }[];
}

export interface CreerKPIDto {
    nom: string;
    description: string;
    categorie: string;
    unite: string;
    objectif?: number;
    seuilAlerte?: number;
    seuilCritique?: number;
}

export interface StatistiquesAnalytics {
    totalKPIs: number;
    parCategorie: { categorie: string; nombre: number; }[];
    parStatut: { statut: string; nombre: number; }[];
    alertesActives: number;
    kpisCritiques: number;
    evolutionMensuelle: {
        mois: string;
        nombreKPIs: number;
        alertes: number;
    }[];
}

export interface FiltresAnalytics {
    categorie?: string;
    statut?: string;
    periode?: 'jour' | 'semaine' | 'mois' | 'trimestre' | 'annee';
}
