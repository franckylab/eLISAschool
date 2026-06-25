/**
 * ==================================
 * eLISAschool - DTOs Utilisateurs
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

/**
 * Schéma de création d'utilisateur
 */
export const createUtilisateurSchema = z.object({
    email: z.string()
        .email('Adresse email invalide')
        .max(255),
    motDePasse: z.string()
        .min(8, 'Le mot de passe doit faire au moins 8 caractères')
        .max(128),
    role: z.enum([
        'SUPER_ADMIN', 'ADMIN', 'CHEF_ETABLISSEMENT', 'ENSEIGNANT',
        'PERSONNEL', 'RESPONSABLE_CANTINE', 'RESPONSABLE_TRANSPORT',
        'PARENT', 'ELEVE'
    ]),
    nom: z.string().min(2).max(100),
    prenom: z.string().min(2).max(100),
    telephone: z.string().regex(/^\+?[0-9]{9,15}$/).optional(),
    genre: z.enum(['M', 'F', 'A']).optional(),
    dateNaissance: z.string().datetime().optional(),
    adresse: z.string().max(500).optional(),
    etablissementId: z.string().uuid().optional(),
    langue: z.string().default('fr'),
});

/**
 * Schéma de mise à jour d'utilisateur
 */
export const updateUtilisateurSchema = z.object({
    email: z.string().email().max(255).optional(),
    role: z.enum([
        'SUPER_ADMIN', 'ADMIN', 'CHEF_ETABLISSEMENT', 'ENSEIGNANT',
        'PERSONNEL', 'RESPONSABLE_CANTINE', 'RESPONSABLE_TRANSPORT',
        'PARENT', 'ELEVE'
    ]).optional(),
    statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_ATTENTE_VALIDATION']).optional(),
    langue: z.string().optional(),
    etablissementId: z.string().uuid().optional().nullable(),
});

/**
 * Schéma de mise à jour du profil
 */
export const updateProfilSchema = z.object({
    nom: z.string().min(2).max(100).optional(),
    prenom: z.string().min(2).max(100).optional(),
    telephone: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
    telephoneSecondaire: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
    genre: z.enum(['M', 'F', 'A']).optional(),
    dateNaissance: z.string().optional().nullable(),
    lieuNaissance: z.string().max(100).optional().nullable(),
    nationalite: z.string().max(100).optional().nullable(),
    adresse: z.string().max(500).optional().nullable(),
    ville: z.string().max(100).optional().nullable(),
    quartier: z.string().max(100).optional().nullable(),
});

/**
 * Schéma de recherche/filtrage d'utilisateurs
 * Utilise les schémas réutilisables de pagination
 */
export const queryUtilisateursSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        role: z.string().optional(),
        statut: z.string().optional(),
        etablissementId: z.string().uuid().optional(),
        exclureEtablissement: z.string().uuid().optional().describe('Exclure les utilisateurs déjà assignés à cet établissement'),
        actifFiltre: z.enum(['tous', 'actif', 'inactif']).default('actif').optional().describe('Filtre par statut d\'affectation (tous/actif/inactif)'),
    });

// Types inférés
export type CreateUtilisateurDto = z.infer<typeof createUtilisateurSchema>;
export type UpdateUtilisateurDto = z.infer<typeof updateUtilisateurSchema>;
export type UpdateProfilDto = z.infer<typeof updateProfilSchema>;
export type QueryUtilisateursDto = z.infer<typeof queryUtilisateursSchema>;

/**
 * Schéma de changement de statut d'affectation (désactiver/réactiver)
 */
export const toggleStatutSchema = z.object({
    actif: z.boolean({
        required_error: 'Le statut (actif/inactif) est requis',
    }),
    motif: z.string()
        .min(10, 'Le motif doit contenir au moins 10 caractères')
        .max(500, 'Le motif ne doit pas dépasser 500 caractères'),
});

export type ToggleStatutDto = z.infer<typeof toggleStatutSchema>;

/**
 * DTO de réponse utilisateur
 * 
 * NOTE v4.0 : etablissementId SUPPRIMÉ de l'entité Utilisateur
 * Pour connaître les établissements d'un utilisateur, utiliser:
 * - GET /api/utilisateur-etablissements/:utilisateurId
 * - Le JWT contient etablissementId (établissement courant)
 */
export interface UtilisateurResponseDto {
    id: string;
    email: string;
    matricule: string;
    /** Nom aplati depuis le profil pour accès direct */
    nom: string;
    /** Prénom aplati depuis le profil pour accès direct */
    prenom: string;
    role: string;
    statut: string;
    emailVerifie: boolean;
    langue: string;
    // NOTE: etablissementId supprimé - géré via utilisateur_etablissements
    etablissements?: Array<{
        etablissementId: string;
        nom: string;
        role: string;
        etablissementPrincipal: boolean;
        actif: boolean;
    }>;
    derniereConnexion?: Date;
    createdAt: Date;
    updatedAt: Date;
    profil?: {
        nom: string;
        prenom: string;
        telephone?: string;
        genre?: string;
        dateNaissance?: Date;
        photo?: string;
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
}

export default {
    createUtilisateurSchema,
    updateUtilisateurSchema,
    updateProfilSchema,
    queryUtilisateursSchema,
};
