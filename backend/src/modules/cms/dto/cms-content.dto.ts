/**
 * ==================================
 * eLISAschool - DTOs CMS Contenu Dynamique (Zod)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Schémas de validation pour les entités de contenu CMS :
 * Actualités, Témoignages, Événements, Partenaires, Newsletter.
 */

import { z } from 'zod';

// ==================================
// Actualités
// ==================================

export const creerActualiteSchema = z.object({
    titre: z.string().min(3).max(200),
    slug: z.string().max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    resume: z.string().max(500).optional(),
    contenu: z.string().max(50000).optional(),
    image: z.string().url().max(500).optional(),
    categorie: z.string().max(100).optional(),
    statut: z.enum(['BROUILLON', 'PUBLIE', 'ARCHIVE']).default('BROUILLON'),
    auteurNom: z.string().max(100).optional(),
    datePublication: z.string().datetime().optional(),
    estEnUne: z.boolean().default(false),
    seo: z.object({
        metaTitle: z.string().max(200).optional(),
        metaDescription: z.string().max(500).optional(),
    }).optional(),
});

export const modifierActualiteSchema = creerActualiteSchema.partial().omit({ slug: true });

export const listeActualitesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    statut: z.enum(['BROUILLON', 'PUBLIE', 'ARCHIVE']).optional(),
    categorie: z.string().optional(),
    estEnUne: z.coerce.boolean().optional(),
    recherche: z.string().optional(),
});

// ==================================
// Témoignages
// ==================================

export const creerTemoignageSchema = z.object({
    nom: z.string().min(2).max(100),
    role: z.string().max(100).optional(),
    categorie: z.enum(['ELEVE', 'PARENT', 'ENSEIGNANT', 'ANCIEN_ELEVE', 'PARTENAIRE']).default('ELEVE'),
    texte: z.string().min(10).max(5000),
    photo: z.string().url().max(500).optional(),
    note: z.number().int().min(1).max(5).default(5),
    ordre: z.number().int().min(0).default(0),
    estVisible: z.boolean().default(true),
    estEnUne: z.boolean().default(false),
});

export const modifierTemoignageSchema = creerTemoignageSchema.partial();

// ==================================
// Événements
// ==================================

export const creerEvenementSchema = z.object({
    titre: z.string().min(3).max(200),
    description: z.string().max(10000).optional(),
    image: z.string().url().max(500).optional(),
    dateDebut: z.string().datetime(),
    dateFin: z.string().datetime().optional(),
    type: z.enum(['REUNION', 'CEREMONIE', 'SORTIE', 'COMPETITION', 'JOURNEE_PORTES_OUVERTES', 'AUTRE']).default('AUTRE'),
    lieu: z.string().max(200).optional(),
    estPublic: z.boolean().default(true),
    metadata: z.record(z.unknown()).optional(),
});

export const modifierEvenementSchema = creerEvenementSchema.partial();

export const listeEvenementsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.string().optional(),
    futur: z.coerce.boolean().optional(),
    recherche: z.string().optional(),
});

// ==================================
// Partenaires
// ==================================

export const creerPartenaireSchema = z.object({
    nom: z.string().min(2).max(150),
    logo: z.string().url().max(500).optional(),
    siteWeb: z.string().url().max(500).optional(),
    categorie: z.enum(['SPONSOR', 'ASSOCIATION', 'INSTITUTION', 'ENTREPRISE', 'FOURNISSEUR']).default('PARTENAIRE' as any),
    description: z.string().max(2000).optional(),
    ordre: z.number().int().min(0).default(0),
    estEnUne: z.boolean().default(false),
    estVisible: z.boolean().default(true),
});

export const modifierPartenaireSchema = creerPartenaireSchema.partial();

// ==================================
// Newsletter
// ==================================

export const abonnementNewsletterSchema = z.object({
    email: z.string().email('Adresse email invalide'),
    nom: z.string().max(100).optional(),
    source: z.string().max(50).optional(),
    // Honeypot anti-spam — doit être vide
    _honeypot: z.string().max(0).optional(),
});

// ==================================
// Types inférés
// ==================================

export type CreerActualiteDto = z.infer<typeof creerActualiteSchema>;
export type ModifierActualiteDto = z.infer<typeof modifierActualiteSchema>;
export type ListeActualitesQuery = z.infer<typeof listeActualitesSchema>;

export type CreerTemoignageDto = z.infer<typeof creerTemoignageSchema>;
export type ModifierTemoignageDto = z.infer<typeof modifierTemoignageSchema>;

export type CreerEvenementDto = z.infer<typeof creerEvenementSchema>;
export type ModifierEvenementDto = z.infer<typeof modifierEvenementSchema>;
export type ListeEvenementsQuery = z.infer<typeof listeEvenementsSchema>;

export type CreerPartenaireDto = z.infer<typeof creerPartenaireSchema>;
export type ModifierPartenaireDto = z.infer<typeof modifierPartenaireSchema>;

export type AbonnementNewsletterDto = z.infer<typeof abonnementNewsletterSchema>;
