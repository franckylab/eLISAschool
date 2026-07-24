/**
 * ==================================
 * eLISAschool - Schémas Zod Organisation (validation frontend)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

export const createUniteSchema = z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
    description: z.string().optional(),
    echelonStructurelId: z.string().uuid().optional().or(z.literal('')),
    code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(50),
    parentId: z.string().optional(),
    ordre: z.coerce.number().int().min(0).default(0),
    responsableNom: z.string().max(200).optional(),
    responsableId: z.string().optional(),
    localisation: z.string().max(100).optional(),
});

export const updateUniteSchema = createUniteSchema.partial().omit({ code: true });

export const createHierarchieSchema = z.object({
    personnelId: z.string().optional().or(z.literal('')),
    superieurId: z.string().optional().or(z.literal('')),
    typeRelation: z.enum(['DIRECT', 'FONCTIONNEL']).default('DIRECT'),
    posteId: z.string().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    commentaire: z.string().optional(),
});

export const updateHierarchieSchema = createHierarchieSchema.partial();

export type CreateUniteFormData = z.infer<typeof createUniteSchema>;
export type UpdateUniteFormData = z.infer<typeof updateUniteSchema>;
export type CreateHierarchieFormData = z.infer<typeof createHierarchieSchema>;
export type UpdateHierarchieFormData = z.infer<typeof updateHierarchieSchema>;
