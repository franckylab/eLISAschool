/**
 * ==================================
 * eLISAschool - Types Utilisateur, Rôle et Permission
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Types complets pour la gestion des utilisateurs, rôles et permissions
 */

export type StatutUtilisateur = 'actif' | 'inactif' | 'suspendu';
export type SexeUtilisateur = 'M' | 'F';

export interface Utilisateur {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    telephone?: string;
    matricule?: string;
    role: string;
    etablissementId: string;
    actif?: boolean;
    statut?: StatutUtilisateur;
    derniereConnexion?: string;
    createdAt: string;
    updatedAt: string;
    permissions?: string[];
    profil?: {
        avatar?: string;
        adresse?: string;
        dateNaissance?: string;
        sexe?: SexeUtilisateur;
    };
    // Métadonnées
    nomComplet?: string;
    nbConnexions?: number;
    motDePasseExpire?: boolean;
    deuxFacteursActif?: boolean;
}

export interface CreerUtilisateurDto {
    email: string;
    nom: string;
    prenom: string;
    telephone?: string;
    role: string;
    motDePasse: string;
    etablissementId: string;
    statut?: StatutUtilisateur;
    profil?: {
        adresse?: string;
        dateNaissance?: string;
        sexe?: SexeUtilisateur;
    };
}

export interface ModifierUtilisateurDto extends Partial<CreerUtilisateurDto> {
    id: string;
}

export interface UtilisateurFiltres {
    recherche?: string;
    role?: string;
    statut?: StatutUtilisateur;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    actif?: boolean;
    etablissementId?: string;
}

// ==================== RÔLES ====================

export interface Role {
    id: string;
    nom: string;
    code: string;
    description?: string;
    permissions: string[] | Permission[];  // Peut être codes (string[]) ou objets (Permission[])
    estSysteme: boolean;
    etablissementId?: string;
    couleur?: string;
    icone?: string;
    nbUtilisateurs?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreerRoleDto {
    nom: string;
    code: string;
    description?: string;
    permissionIds?: string[];  // IDs des permissions à attribuer
    couleur?: string;
    icone?: string;
}

export interface ModifierRoleDto extends Partial<CreerRoleDto> {
    id: string;
}

export interface RoleFiltres {
    recherche?: string;
    estSysteme?: boolean;
    page?: number;
    limit?: number;
}

// ==================== PERMISSIONS ====================

export interface Permission {
    id: string;
    code: string;
    libelle: string;
    description?: string;
    module: string;
    categorie: string;
    estSysteme: boolean;
}

export interface PermissionGroupe {
    module: string;
    libelle: string;
    permissions: Permission[];
}

export interface AttribuerPermissionDto {
    roleId: string;
    permissions: string[];
}
