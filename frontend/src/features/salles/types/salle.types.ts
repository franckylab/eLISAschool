/**
 * ==================================
 * eLISAschool - Types Salles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Types TypeScript pour la gestion des salles
 */

export enum TypeSalle {
    CLASSIQUE = 'CLASSIQUE',
    LABORATOIRE = 'LABORATOIRE',
    INFORMATIQUE = 'INFORMATIQUE',
    AMPHITHEATRE = 'AMPHITHEATRE',
    SPORT = 'SPORT',
    MUSIQUE = 'MUSIQUE',
    ARTS = 'ARTS',
    BIBLIOTHEQUE = 'BIBLIOTHEQUE',
    ADMINISTRATION = 'ADMINISTRATION',
    AUTRE = 'AUTRE',
}

export enum StatutSalle {
    DISPONIBLE = 'DISPONIBLE',
    EN_MAINTENANCE = 'EN_MAINTENANCE',
    INDISPONIBLE = 'INDISPONIBLE',
}

export interface Salle {
    id: string;
    nom: string;
    code: string;
    capacite: number;
    localisation?: string;
    typeSalle: TypeSalle;
    equipements?: string[];
    description?: string;
    statut: StatutSalle;
    disponible: boolean;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerSalleDto {
    nom: string;
    code: string;
    capacite?: number;
    localisation?: string;
    typeSalle?: TypeSalle;
    equipements?: string[];
    description?: string;
    statut?: StatutSalle;
    disponible?: boolean;
}

export interface ModifierSalleDto {
    nom?: string;
    capacite?: number;
    localisation?: string;
    typeSalle?: TypeSalle;
    equipements?: string[];
    description?: string;
    statut?: StatutSalle;
    disponible?: boolean;
}

export interface FiltresSalles {
    page?: number;
    limit?: number;
    typeSalle?: TypeSalle;
    disponible?: boolean;
    statut?: StatutSalle;
    capaciteMin?: number;
    capaciteMax?: number;
    search?: string;
}

export interface StatistiquesSalles {
    total: number;
    disponibles: number;
    enMaintenance: number;
    indisponibles: number;
    capaciteTotale: number;
    parType: Record<string, number>;
}

export interface PaginationResponse {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
