/**
 * ==================================
 * eLISAschool - Types Élève
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Types alignés avec le backend Entity Eleve
 */

export type StatutEleve = 'ACTIF' | 'EXCLU' | 'ABANDON' | 'DIPLOME';
export type SousSysteme = 'FRANCOPHONE' | 'ANGLOPHONE';
export type Sexe = 'M' | 'F';

export interface Eleve {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    lieuNaissance: string;
    sexe: Sexe;
    nationalite?: string;
    sousSysteme: SousSysteme;
    
    // Parents directs (déprécié, utiliser ResponsableEleve)
    nomPere?: string;
    professionPere?: string;
    telephonePere?: string;
    emailPere?: string;
    nomMere?: string;
    professionMere?: string;
    telephoneMere?: string;
    emailMere?: string;
    nomTuteur?: string;
    lienParenteTuteur?: string;
    telephoneTuteur?: string;
    
    // Contact élève
    photo?: string;
    groupeSanguin?: string;
    allergies?: string;
    
    // Adresse
    adresseDomicile?: string;
    ville?: string;
    quartier?: string;
    
    // Services
    transportScolaire: boolean;
    cantine: boolean;
    boursier: boolean;
    redoublement: boolean;
    
    // Workflow
    statut: StatutEleve;
    
    // Relations
    classeId: string;
    anneeScolaireId: string;
    etablissementId: string;
    utilisateurId?: string;
    
    // Metadata
    createdAt: string;
    updatedAt: string;
    
    // Relations chargées
    classe?: {
        id: string;
        nom: string;
        niveau: string;
    };
    anneeScolaire?: {
        id: string;
        libelle: string;
    };
    utilisateur?: {
        id: string;
        email: string;
        telephone?: string;
        adresse?: string;
    };
}

export interface CreerEleveDto {
    nom: string;
    prenom: string;
    dateNaissance: string;
    lieuNaissance: string;
    sexe: Sexe;
    nationalite?: string;
    sousSysteme?: SousSysteme;
    
    // Parents
    nomPere?: string;
    professionPere?: string;
    telephonePere?: string;
    emailPere?: string;
    nomMere?: string;
    professionMere?: string;
    telephoneMere?: string;
    emailMere?: string;
    nomTuteur?: string;
    lienParenteTuteur?: string;
    telephoneTuteur?: string;
    
    // Coordonnées
    adresseDomicile?: string;
    ville?: string;
    quartier?: string;
    
    // Complément
    photo?: string;
    groupeSanguin?: string;
    allergies?: string;
    transportScolaire?: boolean;
    cantine?: boolean;
    boursier?: boolean;
    redoublement?: boolean;
    
    // Relations obligatoires
    classeId: string;
    anneeScolaireId: string;
}

export interface ModifierEleveDto extends Partial<CreerEleveDto> {
    id: string;
}

export interface EleveFiltres {
    recherche?: string;
    classeId?: string;
    anneeScolaireId?: string;
    sexe?: Sexe;
    statut?: StatutEleve;
    sousSysteme?: SousSysteme;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
