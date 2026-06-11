/**
 * ==================================
 * eLISAschool - Schéma Validation Élève (Zod)
 * ==================================
 * Validation multi-étapes pour le formulaire élève
 */

import { z } from 'zod';

// Étape 1: Identité
export const etape1IdentiteSchema = z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
    prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(100),
    dateNaissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
    lieuNaissance: z.string().min(2, 'Le lieu de naissance est obligatoire').max(100),
    sexe: z.enum(['M', 'F'], { required_error: 'Le sexe est obligatoire' }),
    nationalite: z.string().optional(),
    sousSysteme: z.enum(['FRANCOPHONE', 'ANGLOPHONE']).optional(),
    photo: z.string().optional(),
});

// Étape 2: Coordonnées
export const etape2CoordonneesSchema = z.object({
    adresseDomicile: z.string().optional(),
    ville: z.string().optional(),
    quartier: z.string().optional(),
    telephone: z.string().optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
});

// Étape 3: Parents
export const etape3ParentsSchema = z.object({
    nomPere: z.string().optional(),
    professionPere: z.string().optional(),
    telephonePere: z.string().optional(),
    emailPere: z.string().email('Email invalide').optional().or(z.literal('')),
    nomMere: z.string().optional(),
    professionMere: z.string().optional(),
    telephoneMere: z.string().optional(),
    emailMere: z.string().email('Email invalide').optional().or(z.literal('')),
    nomTuteur: z.string().optional(),
    lienParenteTuteur: z.string().optional(),
    telephoneTuteur: z.string().optional(),
});

// Étape 4: Complément
export const etape4ComplementSchema = z.object({
    classeId: z.string().uuid('La classe est obligatoire'),
    anneeScolaireId: z.string().uuid('L\'année scolaire est obligatoire'),
    transportScolaire: z.boolean().default(false),
    cantine: z.boolean().default(false),
    boursier: z.boolean().default(false),
    redoublement: z.boolean().default(false),
    groupeSanguin: z.string().optional(),
    allergies: z.string().optional(),
});

// Schéma complet pour création
export const creerEleveCompletSchema = etape1IdentiteSchema
    .merge(etape2CoordonneesSchema)
    .merge(etape3ParentsSchema)
    .merge(etape4ComplementSchema);

// Schéma pour modification (partiel)
export const modifierEleveSchema = creerEleveCompletSchema.partial();

// Types inférés
export type Etape1Data = z.infer<typeof etape1IdentiteSchema>;
export type Etape2Data = z.infer<typeof etape2CoordonneesSchema>;
export type Etape3Data = z.infer<typeof etape3ParentsSchema>;
export type Etape4Data = z.infer<typeof etape4ComplementSchema>;
export type CreerEleveCompletDto = z.infer<typeof creerEleveCompletSchema>;
