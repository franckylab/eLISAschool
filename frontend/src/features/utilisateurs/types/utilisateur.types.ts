/**
 * ==================================
 * eLISAschool - Types Utilisateur, Rôle et Permission
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Types complets pour la gestion des utilisateurs, rôles et permissions
 */

export type StatutUtilisateur = 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'EN_ATTENTE_VALIDATION';
export type SexeUtilisateur = 'M' | 'F';

export interface Utilisateur {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    telephone?: string;
    matricule?: string;
    role: string;
    // NOTE v4.0: etablissementId SUPPRIMÉ - géré via utilisateur_etablissements
    // Pour connaître les établissements, utiliser le endpoint dédié
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
    /**
     * Rôle de l'utilisateur dans l'établissement courant
     * (peut être différent du rôle global)
     */
    roleEtablissement?: string;
    /**
     * Statut d'affectation dans l'établissement courant
     * (true = actif dans cet établissement, false = inactif/désactivé)
     */
    actifDansEtablissement?: boolean;
    // Méta donné es
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
    actifFiltre?: 'tous' | 'actif' | 'inactif';
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
