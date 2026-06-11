/**
 * ==================================
 * eLISAschool - Types Bibliothèque
 * ==================================
 */

export interface Ouvrage {
    id: string;
    isbn?: string;
    titre: string;
    auteur: string;
    editeur?: string;
    anneePublication?: number;
    categorie: 'manuel' | 'roman' | 'documentaire' | 'dictionnaire' | 'encyclopedie' | 'revue' | 'autre';
    nombreExemplaires: number;
    exemplairesDisponibles: number;
    localisation?: string;
    description?: string;
    langue?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerOuvrageDto {
    isbn?: string;
    titre: string;
    auteur: string;
    editeur?: string;
    anneePublication?: number;
    categorie: string;
    nombreExemplaires: number;
    localisation?: string;
    description?: string;
    langue?: string;
}

export interface Pret {
    id: string;
    ouvrageId: string;
    eleveId?: string;
    personnelId?: string;
    datePret: string;
    dateRetourPrevue: string;
    dateRetourReelle?: string;
    statut: 'en_cours' | 'retourne' | 'en_retard' | 'prolonge';
    remarque?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    ouvrage?: {
        id: string;
        titre: string;
        auteur: string;
    };
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
    personnel?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface CreerPretDto {
    ouvrageId: string;
    eleveId?: string;
    personnelId?: string;
    dateRetourPrevue: string;
    remarque?: string;
}

export interface Reservation {
    id: string;
    ouvrageId: string;
    eleveId?: string;
    personnelId?: string;
    dateReservation: string;
    statut: 'en_attente' | 'notifie' | 'honoree' | 'annulee';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    ouvrage?: {
        id: string;
        titre: string;
        auteur: string;
    };
}

export interface StatistiquesBibliotheque {
    totalOuvrages: number;
    totalExemplaires: number;
    exemplairesDisponibles: number;
    pretsEnCours: number;
    pretsEnRetard: number;
    parCategorie: { categorie: string; nombre: number; }[];
    ouvragesLesPlusPrete: { ouvrage: string; nombre: number; }[];
    evolutionMensuelle: {
        mois: string;
        prets: number;
        retours: number;
    }[];
}

export interface BibliothequeFiltres {
    categorie?: string;
    disponibilite?: 'disponible' | 'indisponible' | 'tous';
    recherche?: string;
}
