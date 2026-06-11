/**
 * ==================================
 * eLISAschool - Types Année Scolaire
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface AnneeScolaire {
    id: string;
    libelle: string;
    code: string;
    dateDebut: string;
    dateFin: string;
    etablissementId: string;
    statut: 'active' | 'inactive' | 'future' | 'archivee';
    estActuelle: boolean;
    createdAt: string;
    updatedAt: string;
    trimestres?: Trimestre[];
    semestres?: Semestre[];
}

export interface Trimestre {
    id: string;
    nom: string;
    numero: number;
    dateDebut: string;
    dateFin: string;
    anneeScolaireId: string;
}

export interface Semestre {
    id: string;
    nom: string;
    numero: number;
    dateDebut: string;
    dateFin: string;
    anneeScolaireId: string;
}

export interface CreerAnneeScolaireDto {
    libelle: string;
    code: string;
    dateDebut: string;
    dateFin: string;
    statut?: 'active' | 'inactive' | 'future' | 'archivee';
    estActuelle?: boolean;
}

export interface ModifierAnneeScolaireDto extends Partial<CreerAnneeScolaireDto> {
    id: string;
}

export interface AnneeScolaireFiltres {
    recherche?: string;
    statut?: 'active' | 'inactive' | 'future' | 'archivee';
    estActuelle?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
