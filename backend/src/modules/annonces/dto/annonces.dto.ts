/**
 * ==================================
 * eLISAschool - DTOs du module Annonces (Zod)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import type {
  AnnonceStatut,
  AnnonceValidation,
  AnnonceTypeContenu,
  CiblageType,
} from '../entities';

// ==================== SCHÉMA DE CIBLAGE ====================

export const ciblageSchema = z.object({
  typeCible: z.enum([
    'role',
    'utilisateur',
    'classe',
    'niveau',
    'fonction',
    'etablissement',
  ] as const),
  cibleId: z.string().min(1, 'L\'identifiant de la cible est requis'),
  cibleValeur: z.string().max(200).optional(),
});

// ==================== SCHÉMA DE CRÉATION ====================

export const createAnnonceSchema = z.object({
  titre: z
    .string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  contenu: z
    .string()
    .min(10, 'Le contenu doit contenir au moins 10 caractères')
    .max(5000, 'Le contenu ne peut pas dépasser 5000 caractères'),
  typeContenu: z.enum(['texte', 'html', 'enrichi'] as const).default('texte'),
  priorite: z.number().int().min(0).max(100).default(0).optional(),
  dateDebut: z.string().datetime({ message: 'La date de début doit être au format ISO 8601' }),
  dateFin: z.string().datetime({ message: 'La date de fin doit être au format ISO 8601' }),
  cibleGlobale: z.boolean().default(false),
  ordreAffichage: z.number().int().min(0).default(0).optional(),
  ciblages: z.array(ciblageSchema).optional(),
});

// ==================== SCHÉMA DE MODIFICATION ====================

export const updateAnnonceSchema = createAnnonceSchema.partial().extend({
  statut: z.enum([
    'brouillon',
    'actif',
    'programmé',
    'expiré',
    'archive',
  ] as const).optional(),
  ordreAffichage: z.number().int().min(0).optional(),
});

// ==================== SCHÉMA DE CONFIGURATION ====================

export const annonceConfigurationSchema = z.object({
  vitesseDefilement: z.number().int().min(10).max(200).default(50).optional(),
  hauteurBande: z.number().int().min(20).max(100).default(40).optional(),
  intervalleActualisation: z.number().int().min(10).max(300).default(30).optional(),
  typesContenuAutorises: z.array(z.enum(['texte', 'html', 'enrichi'] as const)).default(['texte', 'html']).optional(),
  tailleMaxContenu: z.number().int().min(1000).max(10000).default(5000).optional(),
  pauseSurVol: z.boolean().default(true).optional(),
  actif: z.boolean().default(true).optional(),
  arretAutomatique: z.number().int().min(0).max(60).default(0).optional(),
  delaiApparition: z.number().int().min(0).max(2000).default(600).optional(),
  delaiReapparition: z.number().int().min(0).max(80000).default(600).optional(),
});

// ==================== TYPES INFÉRÉS ====================

export type CreateAnnonceDto = z.infer<typeof createAnnonceSchema>;
export type UpdateAnnonceDto = z.infer<typeof updateAnnonceSchema>;
export type CiblageDto = z.infer<typeof ciblageSchema>;
export type AnnonceConfigurationDto = z.infer<typeof annonceConfigurationSchema>;

// ==================== TYPES DE RÉPONSE ====================

export interface AnnonceListResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AnnonceResponse {
  success: boolean;
  data: any;
  message?: string;
}

export interface AnnoncesActivesResponse {
  success: boolean;
  data: any[];
  meta: {
    total: number;
    actualiseA: string;
  };
}
