/**
 * ==================================
 * eLISAschool - Types Finances
 * ==================================
 */

export interface FraisScolaire {
    id: string;
    libelle: string;
    code: string;
    montant: number;
    type: 'scolarite' | 'inscription' | 'cantine' | 'transport' | 'activite' | 'autre';
    anneeScolaireId: string;
    etablissementId: string;
    estPayableEnPlusieursFois?: boolean;
    nombreEcheances?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Paiement {
    id: string;
    eleveId: string;
    fraisId: string;
    montant: number;
    datePaiement: string;
    moyenPaiement: 'especes' | 'cheque' | 'virement' | 'mobile' | 'autre';
    reference?: string;
    statut: 'effectue' | 'partiel' | 'en_attente' | 'annule';
    recu?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
    frais?: {
        id: string;
        libelle: string;
        code: string;
        montant: number;
    };
}

export interface CreerFraisDto {
    libelle: string;
    code: string;
    montant: number;
    type: 'scolarite' | 'inscription' | 'cantine' | 'transport' | 'activite' | 'autre';
    anneeScolaireId: string;
    estPayableEnPlusieursFois?: boolean;
    nombreEcheances?: number;
}

export interface CreerPaiementDto {
    eleveId: string;
    fraisId: string;
    montant: number;
    moyenPaiement: 'especes' | 'cheque' | 'virement' | 'mobile' | 'autre';
    reference?: string;
}

export interface FraisFiltres {
    type?: string;
    anneeScolaireId?: string;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaiementFiltres {
    eleveId?: string;
    statut?: string;
    moyenPaiement?: string;
    dateDebut?: string;
    dateFin?: string;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface StatistiquesFinancieres {
    totalEncaisse: number;
    montantEnAttente: number;
    totalPaiements: number;
    tauxCollecte: number;
}
