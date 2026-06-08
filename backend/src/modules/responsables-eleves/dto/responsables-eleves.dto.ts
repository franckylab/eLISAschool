/**
 * ==================================
 * eLISAschool - DTOs Responsables Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { z } from 'zod';
import { LienParente } from '../entities';
import { paginationWithSortSchema } from '@common/dto/pagination.dto';

/**
 * Schéma pour lier un parent à un élève
 */
export const lierParentSchema = z.object({
    parentId: z.string().uuid('ID du parent invalide'),
    enfantId: z.string().uuid('ID de l\'élève invalide'),
    lienParente: z.nativeEnum(LienParente, {
        errorMap: () => ({ message: 'Type de lien de parenté invalide' }),
    }),
    responsableLegal: z.boolean().default(true),
    peutConsulter: z.boolean().default(true),
    peutPayer: z.boolean().default(false),
    email: z.string().email('Email invalide').optional().nullable(),
    telephone: z.string().max(20, 'Téléphone trop long').optional().nullable(),
    adresse: z.string().max(255, 'Adresse trop longue').optional().nullable(),
});

/**
 * Schéma pour modifier une relation parent-élève
 */
export const updateResponsableSchema = lierParentSchema.omit({
    parentId: true,
    enfantId: true,
}).partial();

/**
 * Schéma pour la réponse API
 */
export const responsableEleveResponseSchema = z.object({
    id: z.string().uuid(),
    utilisateurId: z.string().uuid(),
    enfantId: z.string().uuid(),
    lienParente: z.nativeEnum(LienParente),
    responsableLegal: z.boolean(),
    peutConsulter: z.boolean(),
    peutPayer: z.boolean(),
    email: z.string().nullable(),
    telephone: z.string().nullable(),
    adresse: z.string().nullable(),
    dateAjout: z.string().datetime(),
    actif: z.boolean(),
    updatedAt: z.string().datetime(),
});

/**
 * Schéma pour vérifier l'accès d'un parent à un élève
 */
export const verifierAccesSchema = z.object({
    parentId: z.string().uuid(),
    eleveId: z.string().uuid(),
});

// Types inférés
export type LierParentDto = z.infer<typeof lierParentSchema>;
export type UpdateResponsableDto = z.infer<typeof updateResponsableSchema>;
export type ResponsableEleveResponse = z.infer<typeof responsableEleveResponseSchema>;
export type VerifierAccesDto = z.infer<typeof verifierAccesSchema>;
