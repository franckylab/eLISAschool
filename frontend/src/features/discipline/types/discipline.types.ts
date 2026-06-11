/**
 * ==================================
 * eLISAschool - Types Discipline
 * ==================================
 */

export interface Sanction {
    id: string;
    eleveId: string;
    type: 'avertissement' | 'remontrance' | 'exclusion_temporaire' | 'exclusion_definitive' | 'conseil_discipline' | 'autre';
    gravite: 'legere' | 'moyenne' | 'grave' | 'tres_grave';
    motif: string;
    description?: string;
    dateSanction: string;
    sanctionneParId?: string;
    etablissementId: string;
    statut?: 'active' | 'amnistiee' | 'archivee';
    dateAmnistie?: string;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
        classe?: {
            nom: string;
            code: string;
        };
    };
    sanctionnePar?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface CreerSanctionDto {
    eleveId: string;
    type: 'avertissement' | 'remontrance' | 'exclusion_temporaire' | 'exclusion_definitive' | 'conseil_discipline' | 'autre';
    gravite: 'legere' | 'moyenne' | 'grave' | 'tres_grave';
    motif: string;
    description?: string;
    dateSanction: string;
}

export interface ModifierSanctionDto extends Partial<CreerSanctionDto> {}

export interface SanctionFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    type?: string;
    gravite?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
}

export interface StatistiquesDiscipline {
    totalSanctions: number;
    parType: {
        type: string;
        nombre: number;
    }[];
    parGravite: {
        gravite: string;
        nombre: number;
    }[];
    parStatut: {
        statut: string;
        nombre: number;
    }[];
    evolutionMensuelle: {
        mois: string;
        nombre: number;
    }[];
}
