/**
 * ==================================
 * eLISAschool - Types Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface MembrePersonnel {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    sexe: 'M' | 'F';
    email?: string;
    telephone?: string;
    adresse?: string;
    photo?: string;
    poste: string;
    departement?: string;
    typeContrat: 'cdi' | 'cdd' | 'vacataire' | 'stage';
    dateEntree: string;
    dateSortie?: string;
    statut: 'actif' | 'inactif' | 'en_conge' | 'demission';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    utilisateurId?: string;
    specialite?: string;
    qualification?: string;
}

export interface CreerPersonnelDto {
    nom: string;
    prenom: string;
    dateNaissance: string;
    sexe: 'M' | 'F';
    email?: string;
    telephone?: string;
    adresse?: string;
    poste: string;
    departement?: string;
    typeContrat: 'cdi' | 'cdd' | 'vacataire' | 'stage';
    dateEntree: string;
    statut?: 'actif' | 'inactif' | 'en_conge' | 'demission';
    specialite?: string;
    qualification?: string;
}

export interface ModifierPersonnelDto extends Partial<CreerPersonnelDto> {
    id: string;
}

export interface PersonnelFiltres {
    poste?: string;
    departement?: string;
    typeContrat?: 'cdi' | 'cdd' | 'vacataire' | 'stage';
    statut?: 'actif' | 'inactif' | 'en_conge' | 'demission';
    typePersonnelId?: string;
    actif?: boolean;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
