/**
 * ==================================
 * eLISAschool - Types utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Role, StatutUtilisateur, Genre } from '../enums';

/**
 * Interface utilisateur de base
 */
export interface IUser {
    id: string;
    email: string;
    matricule: string;
    role: Role;
    statut: StatutUtilisateur;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Profil utilisateur
 */
export interface IUserProfile {
    id: string;
    userId: string;
    nom: string;
    prenom: string;
    genre?: Genre;
    dateNaissance?: Date;
    telephone?: string;
    adresse?: string;
    photo?: string;
    langue: string;
}

/**
 * Utilisateur avec profil
 */
export interface IUserWithProfile extends IUser {
    profil: IUserProfile;
}

/**
 * Données de session utilisateur
 */
export interface IUserSession {
    userId: string;
    email: string;
    role: Role;
    permissions: string[];
    etablissementId?: string;
}

export default {
    // Types exportés
};
