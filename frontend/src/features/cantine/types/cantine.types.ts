/**
 * ==================================
 * eLISAschool - Types Cantine
 * ==================================
 */

export interface InscriptionCantine {
    id: string;
    eleveId: string;
    etablissementId: string;
    anneeScolaireId: string;
    typeInscription: 'quotidien' | 'hebdomadaire' | 'mensuel' | 'trimestriel' | 'annuel';
    statut?: 'actif' | 'inactif' | 'suspendu';
    dateDebut: string;
    dateFin?: string;
    tarifReduit?: number;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
}

export interface MenuCantine {
    id: string;
    date: string;
    typeRepas: 'dejeuner' | 'gouter';
    entree?: string;
    platPrincipal?: string;
    accompagnement?: string;
    dessert?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerInscriptionCantineDto {
    eleveId: string;
    typeInscription: 'quotidien' | 'hebdomadaire' | 'mensuel' | 'trimestriel' | 'annuel';
    dateDebut: string;
    dateFin?: string;
    tarifReduit?: number;
}

export interface CreerMenuDto {
    date: string;
    typeRepas: 'dejeuner' | 'gouter';
    entree?: string;
    platPrincipal?: string;
    accompagnement?: string;
    dessert?: string;
}

export interface InscriptionCantineFiltres {
    eleveId?: string;
    statut?: 'actif' | 'inactif' | 'suspendu';
    typeInscription?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface MenuFiltres {
    dateDebut?: string;
    dateFin?: string;
    typeRepas?: 'dejeuner' | 'gouter';
    page?: number;
    limit?: number;
}
