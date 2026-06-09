/**
 * ==================================
 * eLISAschool - DTOs TypeEnum
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import { CategorieEnum } from '../entities';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

/**
 * Schéma de création d'un type enum
 */
export const createTypeEnumSchema = z.object({
    categorie: z.nativeEnum(CategorieEnum),
    code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, 'Le code doit contenir uniquement des majuscules, chiffres et underscores'),
    libelle: z.string().min(2).max(100),
    description: z.string().optional(),
    ordre: z.number().int().min(0).default(0),
});

/**
 * Schéma de modification d'un type enum
 * - Modification complète interdite pour les types système
 * - Seule la modification du libelle est autorisée pour les types système
 */
export const updateTypeEnumSchema = z.object({
    libelle: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    estActif: z.boolean().optional(),
    ordre: z.number().int().min(0).optional(),
});

/**
 * Schéma de requête pour la liste des types enum
 */
export const queryTypeEnumSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        categorie: z.nativeEnum(CategorieEnum).optional(),
        estSysteme: z.string().transform(val => val === 'true').optional(),
        estActif: z.string().transform(val => val === 'true').optional(),
    });

export type CreateTypeEnumDto = z.infer<typeof createTypeEnumSchema>;
export type UpdateTypeEnumDto = z.infer<typeof updateTypeEnumSchema>;
export type QueryTypeEnumDto = z.infer<typeof queryTypeEnumSchema>;
