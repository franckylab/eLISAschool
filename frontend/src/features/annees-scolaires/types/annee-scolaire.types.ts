/**
 * ==================================
 * eLISAschool - Types Année Scolaire
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import type { NiveauPeriode } from '@/features/periodes/types/periode.types';

export interface AnneeScolaire {
    id: string;
    libelle: string;
    dateDebut: string;
    dateFin: string;
    etablissementId: string;
    statut: 'OUVERTE' | 'EN_COURS' | 'EN_ATTENTE_CLOTURE' | 'CLOTUREE';
    createdAt: string;
    updatedAt: string;
    periodes?: Periode[];
}

/**
 * Période liée à une année scolaire (vue simplifiée)
 * Alignée sur le modèle v5.0 — niveauId (FK vers NiveauPeriode)
 */
export interface Periode {
    id: string;
    nom: string;
    niveauId: string;
    niveau?: NiveauPeriode;
    dateDebut: string;
    dateFin: string;
    statut: 'OUVERTE' | 'EN_ATTENTE_CLOTURE' | 'CLOTUREE';
}

export interface CreerAnneeScolaireDto {
    libelle: string;
    dateDebut: string;
    dateFin: string;
}

export interface ModifierAnneeScolaireDto extends Partial<CreerAnneeScolaireDto> {
    id: string;
}

export interface AnneeScolaireFiltres {
    recherche?: string;
    statut?: 'OUVERTE' | 'EN_COURS' | 'EN_ATTENTE_CLOTURE' | 'CLOTUREE';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
