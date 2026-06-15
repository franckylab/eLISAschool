/**
 * ==================================
 * eLISAschool - Types Inventaire
 * ==================================
 */

export interface Materiel {
    id: string;
    reference: string;
    designation: string;
    categorie: 'mobilier' | 'informatique' | 'pedagogique' | 'entretien' | 'autre';
    quantite: number;
    quantiteDisponible: number;
    emplacement?: string;
    etat: 'neuf' | 'bon' | 'moyen' | 'use' | 'hors_service';
    dateAcquisition?: string;
    prixUnitaire?: number;
    fournisseur?: string;
    responsableId?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    responsable?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    page?: number;
    limit?: number;
}

export interface CreerMaterielDto {
    reference: string;
    designation: string;
    categorie: string;
    quantite: number;
    emplacement?: string;
    etat: string;
    dateAcquisition?: string;
    prixUnitaire?: number;
    fournisseur?: string;
    responsableId?: string;
    page?: number;
    limit?: number;
}

export interface MouvementStock {
    id: string;
    materielId: string;
    type: 'entree' | 'sortie' | 'transfert' | 'reforme';
    quantite: number;
    dateMouvement: string;
    motif: string;
    effectueParId?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    materiel?: {
        id: string;
        reference: string;
        designation: string;
    };
    effectuePar?: {
        id: string;
        nom: string;
        prenom: string;
    };
    page?: number;
    limit?: number;
}

export interface StatistiquesInventaire {
    totalMateriel: number;
    parCategorie: { categorie: string; nombre: number; }[];
    parEtat: { etat: string; nombre: number; }[];
    valeurTotale: number;
    materielsHorsService: number;
    evolutionMensuelle: {
        mois: string;
        entrees: number;
        sorties: number;
    }[];
    page?: number;
    limit?: number;
}

export interface InventaireFiltres {
    categorie?: string;
    etat?: string;
    recherche?: string;
    emplacement?: string;
    page?: number;
    limit?: number;
    actif?: boolean;
}
