import { z } from 'zod';

export const createUniteSchema = z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
    description: z.string().optional(),
    typeUniteId: z.string().uuid().optional().or(z.literal('')),
    usageUniteId: z.string().uuid().optional().or(z.literal('')),
    niveauOrganisationId: z.string().uuid().optional().or(z.literal('')),
    code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(50),
    parentId: z.string().optional(),
    ordre: z.coerce.number().int().min(0).default(0),
    responsableNom: z.string().max(200).optional(),
    responsableId: z.string().optional(),
    localisation: z.string().max(100).optional(),
    telephone: z.string().max(50).optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
});

export const updateUniteSchema = createUniteSchema.partial().omit({ code: true });

export const createHierarchieSchema = z.object({
    personnelId: z.string().optional().or(z.literal('')),
    personnelNom: z.string().min(2).max(200),
    superieurId: z.string().optional().or(z.literal('')),
    superieurNom: z.string().min(2).max(200),
    typeRelationId: z.string().uuid().optional().or(z.literal('')),
    posteId: z.string().optional(),
    posteIntitule: z.string().max(100).optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    commentaire: z.string().optional(),
});

export const updateHierarchieSchema = createHierarchieSchema.partial();

export type CreateUniteFormData = z.infer<typeof createUniteSchema>;
export type UpdateUniteFormData = z.infer<typeof updateUniteSchema>;
export type CreateHierarchieFormData = z.infer<typeof createHierarchieSchema>;
export type UpdateHierarchieFormData = z.infer<typeof updateHierarchieSchema>;
