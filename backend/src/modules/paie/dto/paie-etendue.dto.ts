/**
 * ==================================
 * eLISAschool - DTOs Paie Étendue
 * ==================================
 */

import { z } from 'zod';

// ElementSalaire
export const createElementSalaireSchema = z.object({
    bulletinPaieId: z.string().uuid(),
    type: z.enum(['GAIN', 'RETENUE']),
    categorie: z.enum(['SALAIRE_BASE', 'PRIME', 'INDEMNITE', 'COTISATION', 'HEURE_SUP', 'HEURE_COURS', 'RETENUE', 'AUTRE']),
    libelle: z.string().min(2).max(200),
    montant: z.number().positive(),
    baseCalcul: z.number().optional(),
    taux: z.number().optional(),
    ordreAffichage: z.number().default(0),
});

export const updateElementSalaireSchema = createElementSalaireSchema.partial();

// Cotisation
export const createCotisationSchema = z.object({
    code: z.string().min(2).max(20),
    nom: z.string().min(2).max(100),
    type: z.enum(['PATRONALE', 'SALARIALE', 'MIXTE']),
    tauxPatronal: z.number().default(0),
    tauxSalarial: z.number().default(0),
    plafond: z.number().optional(),
    description: z.string().optional(),
});

export const updateCotisationSchema = createCotisationSchema.partial();

// TypePrime
export const createTypePrimeSchema = z.object({
    code: z.string().min(2).max(30),
    nom: z.string().min(2).max(100),
    typeCalcul: z.enum(['FIXE', 'POURCENTAGE', 'VARIABLE']),
    valeur: z.number(),
    description: z.string().optional(),
});

export const updateTypePrimeSchema = createTypePrimeSchema.partial();

// TypeRetenue
export const createTypeRetenueSchema = z.object({
    code: z.string().min(2).max(30),
    nom: z.string().min(2).max(100),
    frequence: z.enum(['PONCTUELLE', 'RECURRENTE']),
    montantMax: z.number().optional(),
    description: z.string().optional(),
});

export const updateTypeRetenueSchema = createTypeRetenueSchema.partial();

// Types inférés
export type CreateElementSalaireDto = z.infer<typeof createElementSalaireSchema>;
export type UpdateElementSalaireDto = z.infer<typeof updateElementSalaireSchema>;
export type CreateCotisationDto = z.infer<typeof createCotisationSchema>;
export type UpdateCotisationDto = z.infer<typeof updateCotisationSchema>;
export type CreateTypePrimeDto = z.infer<typeof createTypePrimeSchema>;
export type UpdateTypePrimeDto = z.infer<typeof updateTypePrimeSchema>;
export type CreateTypeRetenueDto = z.infer<typeof createTypeRetenueSchema>;
export type UpdateTypeRetenueDto = z.infer<typeof updateTypeRetenueSchema>;
