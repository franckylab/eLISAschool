/**
 * ==================================
 * eLISAschool - Types Transport
 * ==================================
 */

export interface LigneTransport {
    id: string;
    nom: string;
    code: string;
    description?: string;
    capaciteMax: number;
    effectif?: number;
    chauffeurId?: string;
    etablissementId: string;
    statut?: 'actif' | 'inactif' | 'maintenance';
    createdAt: string;
    updatedAt: string;
    chauffeur?: {
        id: string;
        nom: string;
        prenom: string;
        telephone?: string;
    };
}

export interface InscriptionTransport {
    id: string;
    eleveId: string;
    ligneId: string;
    etablissementId: string;
    anneeScolaireId: string;
    pointMontee: string;
    pointDescente: string;
    statut?: 'actif' | 'inactif' | 'suspendu';
    dateDebut: string;
    dateFin?: string;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
    ligne?: {
        id: string;
        nom: string;
        code: string;
    };
}

export interface CreerLigneDto {
    nom: string;
    code: string;
    description?: string;
    capaciteMax: number;
    chauffeurId?: string;
}

export interface CreerInscriptionTransportDto {
    eleveId: string;
    ligneId: string;
    pointMontee: string;
    pointDescente: string;
    dateDebut: string;
    dateFin?: string;
}

export interface LigneFiltres {
    recherche?: string;
    statut?: 'actif' | 'inactif' | 'maintenance';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface InscriptionTransportFiltres {
    eleveId?: string;
    ligneId?: string;
    statut?: 'actif' | 'inactif' | 'suspendu';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
