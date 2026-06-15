/**
 * ==================================
 * eLISAschool - DTOs Salles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Schémas de validation Zod pour les salles
 */

import { z } from 'zod';
import { TypeSalle, StatutSalle } from '../entities';

// ==================================
// Schémas de base
// ==================================

export const createSalleSchema = z.object({
    nom: z.string().min(2).max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    code: z.string().min(2).max(50, 'Le code ne peut pas dépasser 50 caractères'),
    capacite: z.number().int().min(1).max(1000).default(30),
    localisation: z.string().max(100).optional(),
    typeSalle: z.nativeEnum(TypeSalle).default(TypeSalle.CLASSIQUE),
    equipements: z.array(z.string()).optional(),
    description: z.string().optional(),
    statut: z.nativeEnum(StatutSalle).default(StatutSalle.DISPONIBLE),
    disponible: z.boolean().default(true),
});

export const updateSalleSchema = createSalleSchema.partial().omit({ code: true });

export const querySallesSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    typeSalle: z.nativeEnum(TypeSalle).optional(),
    disponible: z.boolean().optional(),
    statut: z.nativeEnum(StatutSalle).optional(),
    capaciteMin: z.number().int().min(1).optional(),
    capaciteMax: z.number().int().max(1000).optional(),
    search: z.string().optional(),
});

// ==================================
// Types inférés
// ==================================

export type CreateSalleDto = z.infer<typeof createSalleSchema>;
export type UpdateSalleDto = z.infer<typeof updateSalleSchema>;
export type QuerySallesDto = z.infer<typeof querySallesSchema>;
