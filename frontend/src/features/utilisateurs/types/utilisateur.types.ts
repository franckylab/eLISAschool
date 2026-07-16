/**
 * ==================================
 * eLISAschool - Types Utilisateur, Rôle et Permission
 * ==================================
 * Version: 2.1.0
 * Auteur: franck arlos chendjou
 * 
 * Types complets pour la gestion des utilisateurs, rôles et permissions
 * 
 * NOTE v2.1 — Single Source of Truth :
 * - Utilisateur (auth) et ProfilUtilisateur (données perso) sont SÉPARÉS
 * - nom/prenom/telephone sont APLATIS au top-level par formatUtilisateurResponse
 * - profil contient aussi ces champs + genre, dateNaissance, photo
 * - MembrePersonnel ne porte QUE les champs professionnels (matricule, diplomes...)
 */

export type StatutUtilisateur = 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'EN_ATTENTE_VALIDATION';

export interface Utilisateur {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    telephone?: string;
    matricule: string;
    role: string;
    statut?: StatutUtilisateur;
    emailVerifie?: boolean;
    langue?: string;
    deuxFacteursActif?: boolean;
    pseudonyme?: string;
    qrCodeId?: string;
    maxEtablissementsPersonnel?: number;
    derniereConnexion?: string;
    createdAt: string;
    updatedAt: string;
    permissions?: string[];
    profil?: {
        nom: string;
        prenom: string;
        telephone?: string;
        genre?: string;
        dateNaissance?: string;
        lieuNaissance?: string;
        nationalite?: string;
        telephoneSecondaire?: string;
        adresse?: string;
        ville?: string;
        quartier?: string;
        photoUrl?: string;
        photoThumbnail?: string;
        pieceRectoUrl?: string;
        pieceVersoUrl?: string;
        typePieceIdentite?: string;
        numeroPieceIdentite?: string;
        notes?: string;
    };
    roleEtablissement?: string;
    actifDansEtablissement?: boolean;
    membrePersonnel?: {
        id: string;
        matricule: string;
        statut: string;
        dateEmbauche: string;
        typePersonnel?: {
            id: string;
            code: string;
            nom: string;
        };
        typePersonnelId?: string;
        specialitePrincipale?: string;
        departement?: string;
    };
}

export interface CreerUtilisateurDto {
    email: string;
    nom: string;
    prenom: string;
    telephone?: string;
    role: string;
    motDePasse: string;
    etablissementId?: string;
    statut?: StatutUtilisateur;
    profil?: {
        adresse?: string;
        dateNaissance?: string;
        genre?: 'M' | 'F' | 'A';
    };
}

export interface ModifierUtilisateurDto extends Partial<CreerUtilisateurDto> {
    id: string;
    maxEtablissementsPersonnel?: number;
}

export interface UpdateProfilDto {
    nom?: string;
    prenom?: string;
    telephone?: string | null;
    telephoneSecondaire?: string | null;
    genre?: 'M' | 'F' | 'A';
    dateNaissance?: string | null;
    lieuNaissance?: string | null;
    nationalite?: string | null;
    adresse?: string | null;
    ville?: string | null;
    quartier?: string | null;
    photoUrl?: string | null;
    photoThumbnail?: string | null;
    pieceRectoUrl?: string | null;
    pieceVersoUrl?: string | null;
    typePieceIdentite?: string | null;
    numeroPieceIdentite?: string | null;
    notes?: string | null;
}

export interface UpdateSecurityDto {
    role?: string;
    statut?: StatutUtilisateur;
    langue?: string;
    motDePasse?: string;
    deuxFacteursActif?: boolean;
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
    libelle: string;
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
    libelle: string;
    code: string;
    description?: string;
    permissionIds?: string[];
    parentId?: string;
    couleur?: string;
    icone?: string;
    etablissementId?: string;
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

export interface PermissionAvecSource {
    permissionId: string;
    code: string;
    libelle: string;
    module: string;
    action: string;
    source: 'role' | 'granted' | 'denied' | 'none';
    utilisateurPermissionId?: string;
}

export interface BatchPermissionEntry {
    permissionId: string;
    type: 'GRANTED' | 'DENIED' | null;
}

export interface RolePermissionAvecStatut {
    permissionId: string;
    code: string;
    libelle: string;
    module: string;
    action: string;
    source: 'role' | 'none';
}

export interface BatchRolePermissionsDto {
    addedPermissionIds: string[];
    removedPermissionIds: string[];
}
