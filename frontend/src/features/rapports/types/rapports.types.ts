/**
 * ==================================
 * eLISAschool - Types Rapports
 * ==================================
 */

export interface Rapport {
    id: string;
    titre: string;
    type: 'eleves' | 'personnel' | 'finances' | 'pedagogique' | 'vieScolaire' | 'cantine' | 'transport' | 'personnalise';
    format: 'pdf' | 'excel' | 'csv' | 'html';
    statut: 'en_cours' | 'genere' | 'echec' | 'archive';
    parametres: Record<string, any>;
    fichierUrl?: string;
    genereParId: string;
    dateGeneration: string;
    dateExpiration?: string;
    taille?: number; // en bytes
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    generePar?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface CreerRapportDto {
    titre: string;
    type: string;
    format: string;
    parametres?: Record<string, any>;
    dateDebut?: string;
    dateFin?: string;
}

export interface TemplateRapport {
    id: string;
    nom: string;
    description: string;
    type: string;
    format: string;
    parametresParDefaut: Record<string, any>;
    estSysteme: boolean;
    utilisePar: number;
}

export interface StatistiquesRapports {
    totalRapports: number;
    parType: { type: string; nombre: number; }[];
    parStatut: { statut: string; nombre: number; }[];
    parFormat: { format: string; nombre: number; }[];
    tailleTotale: number; // en bytes
    evolutionMensuelle: {
        mois: string;
        nombre: number;
        taille: number;
    }[];
}

export interface FiltresRapports {
    type?: string;
    format?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
}
