/**
 * ==================================
 * eLISAschool - Types Période
 * ==================================
 */

export interface Periode {
    id: string;
    nom: string;
    code: string;
    type: 'trimestre' | 'semestre' | 'module' | 'autre';
    numero: number;
    dateDebut: string;
    dateFin: string;
    anneeScolaireId: string;
    etablissementId: string;
    statut?: 'active' | 'inactive' | 'future' | 'terminee';
    createdAt: string;
    updatedAt: string;
    anneeScolaire?: {
        id: string;
        libelle: string;
        code: string;
    };
}

export interface CreerPeriodeDto {
    nom: string;
    code: string;
    type: 'trimestre' | 'semestre' | 'module' | 'autre';
    numero: number;
    dateDebut: string;
    dateFin: string;
    anneeScolaireId: string;
    statut?: 'active' | 'inactive' | 'future' | 'terminee';
}

export interface ModifierPeriodeDto extends Partial<CreerPeriodeDto> {
    id: string;
}

export interface PeriodeFiltres {
    anneeScolaireId?: string;
    type?: 'trimestre' | 'semestre' | 'module' | 'autre';
    recherche?: string;
    statut?: 'active' | 'inactive' | 'future' | 'terminee';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
