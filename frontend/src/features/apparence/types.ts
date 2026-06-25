/**
 * ==================================
 * eLISAschool - Types pour le module Apparence
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export enum CategorieFond {
    INSTRUMENT_MESURE = 'instrument_mesure',
    INSTRUMENT_CALCUL = 'instrument_calcul',
    MATERIEL_LABORATOIRE = 'materiel_laboratoire',
    MATERIEL_INFORMATIQUE = 'materiel_informatique',
    MATERIEL_ELECTRIQUE = 'materiel_electrique',
    MATERIEL_BUREAU = 'materiel_bureau',
    MATERIEL_BATIMENT = 'materiel_batiment',
    OBJET_SALLE_CLASSE = 'objet_salle_classe',
    LIVRES_DOCUMENTATION = 'livres_documentation',
    SPORT_EDUCATION_PHYSIQUE = 'sport_education_physique',
    ARTS_CREATIVITE = 'arts_creativite',
    MUSIQUE = 'musique',
}

export interface Fond {
    id: string;
    nom: string;
    description?: string;
    categorie: CategorieFond;
    cheminFichier: string;
    source: 'catalogue' | 'upload';
    estActif: boolean;
    estSysteme: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FondEtablissement {
    id: string;
    etablissementId: string;
    fondId: string;
    actif: boolean;
    ordre: number;
    dateAjout: string;
    fond: Fond;
}

export interface ConfigRotation {
    actif: boolean;
    delaiRotation: number; // en secondes
}

export interface CreateFondEtablissementDto {
    fondId: string;
    actif?: boolean;
    ordre?: number;
}

export interface UpdateFondEtablissementDto {
    actif?: boolean;
    ordre?: number;
}

export interface UploadFondDto {
    nom: string;
    description?: string;
    categorie: CategorieFond;
    fichier: string; // base64
}

export const CATEGORIE_LABELS: Record<CategorieFond, string> = {
    [CategorieFond.INSTRUMENT_MESURE]: 'Instruments de mesure',
    [CategorieFond.INSTRUMENT_CALCUL]: 'Instruments de calcul',
    [CategorieFond.MATERIEL_LABORATOIRE]: 'Matériel de laboratoire',
    [CategorieFond.MATERIEL_INFORMATIQUE]: 'Matériel informatique',
    [CategorieFond.MATERIEL_ELECTRIQUE]: 'Matériel électrique',
    [CategorieFond.MATERIEL_BUREAU]: 'Matériel de bureau',
    [CategorieFond.MATERIEL_BATIMENT]: 'Matériel de bâtiment',
    [CategorieFond.OBJET_SALLE_CLASSE]: 'Objets de salle de classe',
    [CategorieFond.LIVRES_DOCUMENTATION]: 'Livres et documentation',
    [CategorieFond.SPORT_EDUCATION_PHYSIQUE]: 'Sport et éducation physique',
    [CategorieFond.ARTS_CREATIVITE]: 'Arts et créativité',
    [CategorieFond.MUSIQUE]: 'Musique',
};
